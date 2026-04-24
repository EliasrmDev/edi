import { eq, sql } from 'drizzle-orm';
import type { TransformationResult, TransformationRequest, ToneType } from '@edi/shared';
import type { DB } from '../../db/index.js';
import { quotaLimits, usageRecords } from '../../db/schema.js';
import { AppError } from '../../middleware/errorHandler.js';
import { getAdapter, ProviderError } from '../providers/ProviderAdapter.js';
import { AIPromptService } from './AIPromptService.js';
import type { CredentialService } from '../credentials/CredentialService.js';

export class AIOrchestrationService {
  private promptService = new AIPromptService();

  constructor(
    private credentialService: CredentialService,
    private db: DB,
  ) {}

  /**
   * Orchestrate a full AI text transformation:
   * 1. Check quota (throws if exceeded)
   * 2. Decrypt credential in memory
   * 3. Build system prompt
   * 4. Call provider adapter
   * 5. Record usage (no raw text stored)
   * 6. Increment quota counters
   * 7. Return TransformationResult
   *
   * On provider failure: returns fallback result (source: 'ai-fallback').
   * SSRF: all outbound requests go through hardcoded adapter URLs.
   */
  async orchestrate(
    userId: string,
    credentialId: string,
    request: TransformationRequest,
  ): Promise<TransformationResult> {
    // Check quota before making the expensive call
    await this.checkQuota(userId);

    // Decrypt credential — raw key never leaves this scope
    const { rawKey, provider, selectedModel } = await this.credentialService.getForAIUse(credentialId, userId);

    const adapter = getAdapter(provider);
    const tone: ToneType = request.tone ?? 'voseo-cr';
    const systemPrompt = this.promptService.buildSystemPrompt(request.transformation, tone, request.verbalMode, request.copyConfig);

    const start = Date.now();

    try {
      const { result, tokensUsed } = await adapter.validateText({
        rawKey,
        text: request.text,
        transformation: request.transformation,
        tone: request.tone,
        locale: request.locale,
        systemPrompt,
        model: selectedModel ?? undefined,
      });

      const processingMs = Date.now() - start;

      // Record usage (provider, type, tokens — no raw text)
      await this.recordUsage(
        userId,
        credentialId,
        provider,
        request.transformation,
        'ai-validated',
        tokensUsed,
        processingMs,
      );

      // Increment quota counters (best-effort; resets handled atomically via SQL CASE)
      await this.incrementQuota(userId);

      return {
        original: request.text,
        result,
        transformation: request.transformation,
        source: 'ai-validated',
        warnings: [],
        processingMs,
      };
    } catch (err) {
      // Re-throw typed business errors (quota, auth) — don't swallow them
      if (err instanceof AppError) throw err;

      // Provider failures (network, timeout, upstream error) → graceful fallback
      const processingMs = Date.now() - start;
      const warning =
        err instanceof ProviderError
          ? `AI provider error (${err.statusCode}): ${err.message}`
          : 'AI processing unavailable';

      return {
        original: request.text,
        result: request.text, // Return original text unchanged
        transformation: request.transformation,
        source: 'ai-fallback',
        warnings: [{ code: 'AI_FALLBACK', message: warning }],
        processingMs,
      };
    }
  }

  /**
   * Check if the user has remaining daily and monthly AI quota.
   * Resets stale windows before comparing.
   * Throws AppError(429) if quota is exceeded.
   */
  async checkQuota(userId: string): Promise<void> {
    const now = new Date();
    const rows = await this.db
      .select()
      .from(quotaLimits)
      .where(eq(quotaLimits.userId, userId))
      .limit(1);

    const quota = rows[0];
    if (!quota) {
      // No quota record — treat as unlimited (provisioned at registration)
      return;
    }

    // Apply virtual reset if the time window has passed
    const dailyUsed = quota.resetDailyAt <= now ? 0 : quota.dailyUsed;
    const monthlyUsed = quota.resetMonthlyAt <= now ? 0 : quota.monthlyUsed;

    if (dailyUsed >= quota.dailyAiRequests) {
      throw new AppError(
        'QUOTA_EXCEEDED',
        'Daily AI request quota exceeded. Quota resets at midnight.',
        429,
        { resetAt: quota.resetDailyAt.toISOString(), type: 'daily' },
      );
    }

    if (monthlyUsed >= quota.monthlyAiRequests) {
      throw new AppError(
        'QUOTA_EXCEEDED',
        'Monthly AI request quota exceeded.',
        429,
        { resetAt: quota.resetMonthlyAt.toISOString(), type: 'monthly' },
      );
    }
  }

  /**
   * Get current quota usage and limits for display.
   */
  async getQuotaStatus(userId: string): Promise<{
    dailyUsed: number;
    dailyLimit: number;
    monthlyUsed: number;
    monthlyLimit: number;
    resetDailyAt: string;
    resetMonthlyAt: string;
  } | null> {
    const now = new Date();
    const rows = await this.db
      .select()
      .from(quotaLimits)
      .where(eq(quotaLimits.userId, userId))
      .limit(1);

    const quota = rows[0];
    if (!quota) return null;

    return {
      dailyUsed: quota.resetDailyAt <= now ? 0 : quota.dailyUsed,
      dailyLimit: quota.dailyAiRequests,
      monthlyUsed: quota.resetMonthlyAt <= now ? 0 : quota.monthlyUsed,
      monthlyLimit: quota.monthlyAiRequests,
      resetDailyAt: quota.resetDailyAt.toISOString(),
      resetMonthlyAt: quota.resetMonthlyAt.toISOString(),
    };
  }

  /**
   * Persist a usage record. Raw text is NEVER stored.
   */
  private async recordUsage(
    userId: string,
    credentialId: string,
    provider: string,
    transformationType: string,
    source: string,
    tokensUsed: number,
    processingMs: number,
  ): Promise<void> {
    try {
      await this.db.insert(usageRecords).values({
        userId,
        credentialId,
        provider,
        transformationType,
        source,
        tokensUsed,
        processingMs,
      });
    } catch {
      // Usage recording must not fail the request
      console.error(
        JSON.stringify({
          level: 'error',
          event: 'usage_record_failed',
          userId,
          transformationType,
          timestamp: new Date().toISOString(),
        }),
      );
    }
  }

  /**
   * Increment daily and monthly usage counters.
   * Uses CASE expressions to reset counters atomically if the window has expired.
   */
  private async incrementQuota(userId: string): Promise<void> {
    const now = new Date();
    const nextDailyReset = new Date(now);
    nextDailyReset.setHours(24, 0, 0, 0);
    const nextMonthlyReset = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    try {
      await this.db
        .update(quotaLimits)
        .set({
          // Reset counter to 1 if window expired, otherwise increment
          dailyUsed: sql`CASE WHEN ${quotaLimits.resetDailyAt} <= ${now} THEN 1 ELSE ${quotaLimits.dailyUsed} + 1 END`,
          monthlyUsed: sql`CASE WHEN ${quotaLimits.resetMonthlyAt} <= ${now} THEN 1 ELSE ${quotaLimits.monthlyUsed} + 1 END`,
          // Advance reset timestamp if window expired
          resetDailyAt: sql`CASE WHEN ${quotaLimits.resetDailyAt} <= ${now} THEN ${nextDailyReset} ELSE ${quotaLimits.resetDailyAt} END`,
          resetMonthlyAt: sql`CASE WHEN ${quotaLimits.resetMonthlyAt} <= ${now} THEN ${nextMonthlyReset} ELSE ${quotaLimits.resetMonthlyAt} END`,
          updatedAt: now,
        })
        .where(eq(quotaLimits.userId, userId));
    } catch {
      // Quota increment must not fail the request
      console.error(
        JSON.stringify({
          level: 'error',
          event: 'quota_increment_failed',
          userId,
          timestamp: new Date().toISOString(),
        }),
      );
    }
  }
}
