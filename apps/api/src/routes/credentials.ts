import { Hono } from 'hono';
import { z } from 'zod';
import { db } from '../db/index.js';
import type { AppEnv } from '../types.js';
import { requireAuth } from '../middleware/auth.js';
import { apiLimiter, credentialLimiter } from '../middleware/rateLimit.js';
import { EncryptionService } from '../services/crypto/EncryptionService.js';
import { AuditService } from '../services/audit/AuditService.js';
import { CredentialService } from '../services/credentials/CredentialService.js';

// ---------------------------------------------------------------------------
// Service instances (module-level singletons)
// ---------------------------------------------------------------------------
const encryption = new EncryptionService();
const audit = new AuditService();
const credentialService = new CredentialService(db, encryption, audit);

// ---------------------------------------------------------------------------
// Zod schemas
// ---------------------------------------------------------------------------

const CredentialSubmissionSchema = z.object({
  provider: z.enum(['openai', 'anthropic', 'google-ai']),
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

export default credentialsRouter;
