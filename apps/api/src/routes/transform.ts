import { Hono } from 'hono';
import { z } from 'zod';
import { db } from '../db/index.js';
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
  ]),
  tone: z.enum(['voseo-cr', 'tuteo', 'ustedeo']).optional(),
  locale: z.enum(['es-CR', 'es-419', 'es']),
  // Client must explicitly opt into AI — never default
  requestAIValidation: z.boolean(),
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

export default transformRouter;
