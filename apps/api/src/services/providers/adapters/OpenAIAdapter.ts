import type { ProviderId } from '@edi/shared';
import { ProviderError, type ProviderAdapter, type ProviderUsageData, type ValidateTextParams } from '../ProviderAdapter.js';

// Hardcoded base URL — no user-supplied URLs (SSRF protection)
const OPENAI_BASE = 'https://api.openai.com/v1';
const VERIFY_TIMEOUT_MS = 5_000;
const GENERATE_TIMEOUT_MS = 30_000;

// OpenAI API response shapes (minimal — only fields we use)
interface OpenAIChatResponse {
  choices: Array<{
    message: { content: string };
  }>;
  usage?: { total_tokens: number };
}

interface OpenAIErrorBody {
  error?: { message?: string };
}

export class OpenAIAdapter implements ProviderAdapter {
  readonly providerId: ProviderId = 'openai';

  /**
   * Verify the key by listing models.
   * 200 → valid. 401/403 → invalid. Timeout/other → error.
   */
  async verifyKey(rawKey: string): Promise<{ valid: boolean; error?: string }> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), VERIFY_TIMEOUT_MS);

    try {
      const res = await fetch(`${OPENAI_BASE}/models`, {
        headers: { Authorization: `Bearer ${rawKey}` },
        signal: controller.signal,
      });

      if (res.status === 200) return { valid: true };
      if (res.status === 401 || res.status === 403) {
        return { valid: false, error: 'Invalid or revoked API key' };
      }
      return { valid: false, error: `Unexpected status ${res.status} from provider` };
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return { valid: false, error: 'Verification timed out' };
      }
      return { valid: false, error: 'Could not reach OpenAI API' };
    } finally {
      clearTimeout(timer);
    }
  }

  /**
   * Run a text transformation via gpt-4o-mini.
   * - model: gpt-4o-mini (cost-effective for text correction)
   * - temperature: 0.3 (consistent corrections)
   * - max_tokens: 4096
   * - timeout: 30s
   */
  async validateText(params: ValidateTextParams): Promise<{ result: string; tokensUsed: number }> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), GENERATE_TIMEOUT_MS);

    try {
      const res = await fetch(`${OPENAI_BASE}/chat/completions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${params.rawKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: params.model ?? 'gpt-4o-mini',
          max_tokens: 4096,
          temperature: 0.3,
          messages: [
            { role: 'system', content: params.systemPrompt },
            { role: 'user', content: params.text },
          ],
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as OpenAIErrorBody;
        const msg = body.error?.message ?? `OpenAI error ${res.status}`;
        throw new ProviderError('openai', res.status, msg);
      }

      const data = (await res.json()) as OpenAIChatResponse;
      const content = data.choices[0]?.message?.content;

      if (!content) {
        throw new ProviderError('openai', 500, 'Empty response content from OpenAI');
      }

      return {
        result: content.trim(),
        tokensUsed: data.usage?.total_tokens ?? 0,
      };
    } catch (err) {
      if (err instanceof ProviderError) throw err;
      if (err instanceof Error && err.name === 'AbortError') {
        throw new ProviderError('openai', 504, 'OpenAI request timed out after 30s');
      }
      throw new ProviderError('openai', 500, 'Failed to reach OpenAI API');
    } finally {
      clearTimeout(timer);
    }
  }

  async getUsage(rawKey: string): Promise<ProviderUsageData> {
    const FALLBACK_URL = 'https://platform.openai.com/usage';
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), VERIFY_TIMEOUT_MS);

    try {
      // OpenAI billing API: get subscription limits + current month usage in parallel
      const now = new Date();
      const startDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
      const endDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

      const [subRes, usageRes] = await Promise.all([
        fetch(`${OPENAI_BASE}/dashboard/billing/subscription`, {
          headers: { Authorization: `Bearer ${rawKey}` },
          signal: controller.signal,
        }),
        fetch(`${OPENAI_BASE}/dashboard/billing/usage?start_date=${startDate}&end_date=${endDate}`, {
          headers: { Authorization: `Bearer ${rawKey}` },
          signal: controller.signal,
        }),
      ]);

      if (!subRes.ok || !usageRes.ok) {
        return { supported: false, unavailableUrl: FALLBACK_URL };
      }

      interface BillingSubscription { hard_limit_usd?: number; soft_limit_usd?: number; }
      interface BillingUsage { total_usage?: number; } // in units of 0.01 cents

      const [sub, usage] = await Promise.all([
        subRes.json() as Promise<BillingSubscription>,
        usageRes.json() as Promise<BillingUsage>,
      ]);

      const usedUsd = (usage.total_usage ?? 0) / 10000; // convert 0.01 cents → USD
      const limitUsd = sub.hard_limit_usd ?? null;

      return {
        supported: true,
        creditsUsed: usedUsd,
        creditsLimit: limitUsd,
        creditsRemaining: limitUsd !== null ? Math.max(0, limitUsd - usedUsd) : null,
        isFreeTier: false,
      };
    } catch {
      return { supported: false, unavailableUrl: FALLBACK_URL };
    } finally {
      clearTimeout(timer);
    }
  }
}
