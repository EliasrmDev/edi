import { Hono } from 'hono';
import { z } from 'zod';
import { db } from '../db/index.js';
import type { AppEnv } from '../types.js';
import { requireAuth } from '../middleware/auth.js';
import { apiLimiter, credentialLimiter } from '../middleware/rateLimit.js';
import { AppError } from '../middleware/errorHandler.js';
import { EncryptionService } from '../services/crypto/EncryptionService.js';
import { AuditService } from '../services/audit/AuditService.js';
import { CredentialService } from '../services/credentials/CredentialService.js';
import { ModelFetcherService } from '../services/models/ModelFetcherService.js';

// ---------------------------------------------------------------------------
// Service instances (module-level singletons)
// ---------------------------------------------------------------------------
const encryption = new EncryptionService();
const audit = new AuditService();
const credentialService = new CredentialService(db, encryption, audit);
const modelFetcherService = new ModelFetcherService(db, encryption);

// ---------------------------------------------------------------------------
// Zod schemas
// ---------------------------------------------------------------------------

const CredentialSubmissionSchema = z.object({
  provider: z.enum(['openai', 'anthropic', 'google-ai', 'openrouter']),
  rawKey: z.string().min(1).max(512),
  label: z.string().min(1).max(100),
  expiresAt: z
    .string()
    .datetime()
    .optional()
    .transform((v) => (v ? new Date(v) : undefined)),
});

const RotateSchema = z.object({
  newRawKey: z.string().min(1).max(512),
});

const PaginationSchema = z.object({
  page: z
    .string()
    .optional()
    .transform((v) => (v ? Math.max(1, parseInt(v, 10)) : 1)),
  limit: z
    .string()
    .optional()
    .transform((v) => (v ? Math.min(100, Math.max(1, parseInt(v, 10))) : 20)),
});

const SelectModelSchema = z.object({
  modelId: z.string().min(1).max(100),
});

const FavoriteModelSchema = z.object({
  modelId: z.string().min(1).max(100),
  action: z.enum(['add', 'remove']),
});

// ---------------------------------------------------------------------------
// Route helpers
// ---------------------------------------------------------------------------

function getClientIP(c: { req: { header: (n: string) => string | undefined } }): string {
  return (
    c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ??
    c.req.header('x-real-ip') ??
    '127.0.0.1'
  );
}

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

const credentialsRouter = new Hono<AppEnv>();

// All credential endpoints require authentication
credentialsRouter.use('*', requireAuth(), apiLimiter());

// ---- POST /credentials — create new credential ----
credentialsRouter.post('/', credentialLimiter(), async (c) => {
  const user = c.get('user');
  const body = CredentialSubmissionSchema.parse(await c.req.json());

  const credential = await credentialService.create(
    user.id,
    body,
    getClientIP(c),
    c.req.header('User-Agent'),
  );

  return c.json({ data: credential }, 201);
});

// ---- GET /credentials — list credentials (paginated) ----
credentialsRouter.get('/', async (c) => {
  const user = c.get('user');
  const query = PaginationSchema.parse({
    page: c.req.query('page'),
    limit: c.req.query('limit'),
  });

  const all = await credentialService.list(user.id);
  const total = all.length;
  const offset = (query.page - 1) * query.limit;
  const items = all.slice(offset, offset + query.limit);

  return c.json({
    data: items,
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      hasNext: offset + query.limit < total,
    },
  });
});

// ---- GET /credentials/:id — single credential ----
credentialsRouter.get('/:id', async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');

  const credential = await credentialService.getById(id, user.id);

  return c.json({ data: credential });
});

// ---- POST /credentials/:id/verify — test key with provider ----
credentialsRouter.post('/:id/verify', async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');

  const result = await credentialService.verify(id, user.id);

  return c.json({
    data: {
      valid: result.valid,
      error: result.error ?? null,
      verifiedAt: new Date().toISOString(),
    },
  });
});

// ---- POST /credentials/:id/rotate — rotate to new key ----
credentialsRouter.post('/:id/rotate', credentialLimiter(), async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');
  const body = RotateSchema.parse(await c.req.json());

  const credential = await credentialService.rotate(
    id,
    user.id,
    body.newRawKey,
    getClientIP(c),
    c.req.header('User-Agent'),
  );

  return c.json({ data: credential });
});

// ---- DELETE /credentials/:id — soft-delete + schedule hard delete ----
credentialsRouter.delete('/:id', async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');

  await credentialService.delete(id, user.id, getClientIP(c), c.req.header('User-Agent'));

  return c.json({ data: { message: 'Credential deleted. Hard deletion scheduled in 7 days.' } });
});

// ---- PATCH /credentials/:id/activate — set as the active credential ----
credentialsRouter.patch('/:id/activate', async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');

  const credential = await credentialService.setActive(id, user.id);

  return c.json({ data: credential });
});

// ---- PATCH /credentials/:id/toggle-enabled — enable/disable a credential ----
credentialsRouter.patch('/:id/toggle-enabled', async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');

  const credential = await credentialService.toggleEnabled(id, user.id);

  return c.json({ data: credential });
});

// ---- GET /credentials/:id/models — fetch available models from provider API ----
credentialsRouter.get('/:id/models', apiLimiter(), async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');

  try {
    const models = await modelFetcherService.fetchModels(id, user.id);
    return c.json({ data: models });
  } catch (err) {
    if (err instanceof AppError) throw err;
    // Provider API errors (network, auth, unexpected status) — surface as 502
    const message = err instanceof Error ? err.message : 'Failed to fetch models from provider';
    throw new AppError('PROVIDER_ERROR', message, 502);
  }
});

// ---- PATCH /credentials/:id/model — set selected model for a credential ----
credentialsRouter.patch('/:id/model', async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');

  const body = await c.req.json().catch(() => ({}));
  const parsed = SelectModelSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: 'VALIDATION_ERROR', message: 'modelId must be a non-empty string (max 100 chars)' }, 422);
  }

  const credential = await credentialService.updateSelectedModel(id, user.id, parsed.data.modelId);

  return c.json({ data: credential });
});

// ---- DELETE /credentials/:id/model — clear selected model for a credential ----
credentialsRouter.delete('/:id/model', async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');

  const credential = await credentialService.clearSelectedModel(id, user.id);

  return c.json({ data: credential });
});

// ---- PATCH /credentials/:id/model-favorites — toggle a model favorite ----
credentialsRouter.patch('/:id/model-favorites', async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');

  const body = await c.req.json().catch(() => ({}));
  const parsed = FavoriteModelSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: 'VALIDATION_ERROR', message: 'modelId and action (add|remove) are required' }, 422);
  }

  const credential = await credentialService.toggleFavoriteModel(
    id,
    user.id,
    parsed.data.modelId,
    parsed.data.action,
  );

  return c.json({ data: credential });
});

// ---- GET /credentials/:id/provider-usage — fetch live usage data from the provider's API ----
credentialsRouter.get('/:id/provider-usage', async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');

  const usage = await credentialService.getProviderUsage(id, user.id);

  return c.json({ data: usage });
});

export default credentialsRouter;
