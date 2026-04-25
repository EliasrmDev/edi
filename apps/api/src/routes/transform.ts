import { Hono } from 'hono';
import { z } from 'zod';
import { and, avg, count, desc, eq, gte, sql, sum } from 'drizzle-orm';
import { db } from '../db/index.js';
import { usageRecords } from '../db/schema.js';
import type { AppEnv } from '../types.js';
import { requireAuth } from '../middleware/auth.js';
import { apiLimiter } from '../middleware/rateLimit.js';
import { AppError } from '../middleware/errorHandler.js';
import { EncryptionService } from '../services/crypto/EncryptionService.js';
import { AuditService } from '../services/audit/AuditService.js';
import { CredentialService } from '../services/credentials/CredentialService.js';
import { AIOrchestrationService } from '../services/ai/AIOrchestrationService.js';

// ---------------------------------------------------------------------------
// Service instances (module-level singletons)
// ---------------------------------------------------------------------------
const encryption = new EncryptionService();
const audit = new AuditService();
const credentialService = new CredentialService(db, encryption, audit);
const aiOrchestration = new AIOrchestrationService(credentialService, db);

// ---------------------------------------------------------------------------
// Zod schemas
// ---------------------------------------------------------------------------

const TransformationRequestSchema = z.object({
  text: z.string().min(1).max(50_000),
  transformation: z.enum([
    'uppercase',
    'lowercase',
    'sentence-case',
    'remove-formatting',
    'correct-orthography',
    'tone-voseo-cr',
    'tone-tuteo',
    'tone-ustedeo',
    'copy-writing-cr',
  ]),
  tone: z.enum(['voseo-cr', 'tuteo', 'ustedeo']).optional(),
  verbalMode: z.enum(['indicativo', 'imperativo']).optional(),
  locale: z.enum(['es-CR', 'es-419', 'es']),
  // Client must explicitly opt into AI — never default
  requestAIValidation: z.boolean(),
  copyConfig: z
    .object({
      tratamiento: z.enum(['voseo', 'tuteo', 'ustedeo']),
      modoVerbal: z.enum(['indicativo', 'imperativo']),
      contexto: z.enum(['boton', 'formulario', 'error', 'landing', 'anuncio', 'notificacion']),
      canal: z.enum(['web', 'app', 'email', 'meta-ads', 'display', 'whatsapp', 'sms']).optional(),
      formalidad: z.enum(['alto', 'medio', 'bajo']),
      objetivo: z.enum(['informar', 'convertir', 'guiar', 'persuadir']),
      intensidadCambio: z.enum(['minima', 'moderada', 'alta']),
      limiteLongitud: z.number().int().positive().optional(),
      terminosObligatorios: z.array(z.string()).optional(),
      terminosProhibidos: z.array(z.string()).optional(),
      configuracionGuardada: z.string().optional(),
      guardarConfiguracion: z.boolean().optional(),
      nombreConfiguracion: z.string().optional(),
    })
    .optional(),
});

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

const transformRouter = new Hono<AppEnv>();

transformRouter.use('*', requireAuth(), apiLimiter());

// ---- POST /transform — AI text transformation proxy ----
transformRouter.post('/', async (c) => {
  const user = c.get('user');
  const body = TransformationRequestSchema.parse(await c.req.json());

  // AI must be explicitly requested — never default
  if (!body.requestAIValidation) {
    throw new AppError(
      'AI_NOT_REQUESTED',
      'AI validation must be explicitly requested (requestAIValidation: true)',
      400,
    );
  }

  // Server-side credential selection — credentialId and rawKey are NEVER
  // accepted from the request body (OWASP A01: Broken Access Control)
  const credential = await credentialService.getActiveForUser(user.id);
  if (!credential) {
    throw new AppError(
      'NO_ACTIVE_CREDENTIAL',
      'No active AI credential found. Add an API key in your settings.',
      422,
    );
  }

  const result = await aiOrchestration.orchestrate(user.id, credential.id, body);

  return c.json({ data: result });
});

// ---- GET /transform/quota — current quota usage ----
transformRouter.get('/quota', async (c) => {
  const user = c.get('user');
  const status = await aiOrchestration.getQuotaStatus(user.id);

  if (!status) {
    return c.json({
      data: {
        message: 'No quota record configured. Contact support.',
        unlimited: true,
      },
    });
  }

  return c.json({ data: status });
});

// ---- POST /transform/record-local — record a local (no-AI) transformation ----
const RecordLocalSchema = z.object({
  transformationType: z.string().min(1).max(100),
  processingMs: z.number().int().nonnegative(),
  clientHint: z.string().max(50).optional(),
});

transformRouter.post('/record-local', async (c) => {
  const user = c.get('user');
  const body = RecordLocalSchema.parse(await c.req.json());

  await db.insert(usageRecords).values({
    userId: user.id,
    transformationType: body.transformationType,
    source: 'local',
    processingMs: body.processingMs,
  });

  return c.json({ data: { recorded: true } });
});

// ---- GET /transform/usage-stats — aggregated usage statistics ----
transformRouter.get('/usage-stats', async (c) => {
  const user = c.get('user');
  const userId = user.id;
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [quota, summaryRows, byProviderRaw, byTypeRaw, bySourceRaw, dailyRaw, recentRows] =
    await Promise.all([
      aiOrchestration.getQuotaStatus(userId),
      db
        .select({
          totalRequests: count(),
          totalTokens: sum(usageRecords.tokensUsed),
          avgProcessingMs: avg(usageRecords.processingMs),
        })
        .from(usageRecords)
        .where(eq(usageRecords.userId, userId)),
      db
        .select({
          provider: usageRecords.provider,
          requestCount: count(),
          totalTokens: sum(usageRecords.tokensUsed),
        })
        .from(usageRecords)
        .where(eq(usageRecords.userId, userId))
        .groupBy(usageRecords.provider),
      db
        .select({
          transformationType: usageRecords.transformationType,
          requestCount: count(),
        })
        .from(usageRecords)
        .where(eq(usageRecords.userId, userId))
        .groupBy(usageRecords.transformationType),
      db
        .select({
          source: usageRecords.source,
          requestCount: count(),
        })
        .from(usageRecords)
        .where(eq(usageRecords.userId, userId))
        .groupBy(usageRecords.source),
      db
        .select({
          date: sql<string>`date_trunc('day', ${usageRecords.createdAt})::date::text`,
          requestCount: count(),
          totalTokens: sum(usageRecords.tokensUsed),
          localCount: sql<number>`count(*) filter (where ${usageRecords.source} = 'local')`,
          aiCount: sql<number>`count(*) filter (where ${usageRecords.source} in ('ai-validated', 'ai-fallback'))`,
        })
        .from(usageRecords)
        .where(and(eq(usageRecords.userId, userId), gte(usageRecords.createdAt, thirtyDaysAgo)))
        .groupBy(sql`date_trunc('day', ${usageRecords.createdAt})`),
      db
        .select({
          id: usageRecords.id,
          provider: usageRecords.provider,
          transformationType: usageRecords.transformationType,
          source: usageRecords.source,
          tokensUsed: usageRecords.tokensUsed,
          processingMs: usageRecords.processingMs,
          createdAt: usageRecords.createdAt,
        })
        .from(usageRecords)
        .where(eq(usageRecords.userId, userId))
        .orderBy(desc(usageRecords.createdAt))
        .limit(10),
    ]);

  const raw = summaryRows[0];
  const byProvider = [...byProviderRaw].sort(
    (a, b) => Number(b.requestCount) - Number(a.requestCount),
  );
  const byType = [...byTypeRaw].sort(
    (a, b) => Number(b.requestCount) - Number(a.requestCount),
  );
  const bySource = [...bySourceRaw].sort(
    (a, b) => Number(b.requestCount) - Number(a.requestCount),
  );
  const dailyActivity = [...dailyRaw].sort((a, b) => a.date.localeCompare(b.date));

  const totalAiRequests = Number(
    bySource.find((r) => r.source === 'ai-validated')?.requestCount ?? 0,
  );
  const totalFallbacks = Number(
    bySource.find((r) => r.source === 'ai-fallback')?.requestCount ?? 0,
  );

  return c.json({
    data: {
      quota,
      summary: {
        totalRequests: Number(raw?.totalRequests ?? 0),
        totalAiRequests,
        totalFallbacks,
        totalTokens: Number(raw?.totalTokens ?? 0),
        avgProcessingMs: Math.round(Number(raw?.avgProcessingMs ?? 0)),
      },
      byProvider: byProvider.map((r) => ({
        provider: r.provider ?? 'unknown',
        requestCount: Number(r.requestCount),
        totalTokens: Number(r.totalTokens ?? 0),
      })),
      byType: byType.map((r) => ({
        transformationType: r.transformationType,
        requestCount: Number(r.requestCount),
      })),
      bySource: bySource.map((r) => ({
        source: r.source,
        requestCount: Number(r.requestCount),
      })),
      dailyActivity: dailyActivity.map((r) => ({
        date: r.date,
        requestCount: Number(r.requestCount),
        totalTokens: Number(r.totalTokens ?? 0),
        localCount: Number(r.localCount ?? 0),
        aiCount: Number(r.aiCount ?? 0),
      })),
      recentRecords: recentRows.map((r) => ({
        id: r.id,
        provider: r.provider,
        transformationType: r.transformationType,
        source: r.source,
        tokensUsed: r.tokensUsed,
        processingMs: r.processingMs,
        createdAt: r.createdAt.toISOString(),
      })),
    },
  });
});

export default transformRouter;
