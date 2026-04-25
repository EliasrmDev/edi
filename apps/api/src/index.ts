import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { secureHeaders } from 'hono/secure-headers';
import { requestId } from './middleware/requestId.js';
import { structuredLogger } from './middleware/logger.js';
import { errorHandler } from './middleware/errorHandler.js';
import { inputSanitization } from './middleware/inputSanitization.js';
import authRoutes from './routes/auth.js';
import usersRoutes from './routes/users.js';
import credentialsRoutes from './routes/credentials.js';
import transformRoutes from './routes/transform.js';
import type { AppEnv } from './types.js';

const app = new Hono<AppEnv>();

// ---------------------------------------------------------------------------
// Global Middleware (order matters)
// ---------------------------------------------------------------------------
app.use('*', secureHeaders());
app.use('*', requestId());
app.use('*', structuredLogger());
app.use('*', inputSanitization());
// CORS: read at request time so CF Workers bindings are fully loaded
app.use('*', async (c, next) => {
  const origins = (process.env['API_CORS_ORIGINS'] ?? '').split(',').filter(Boolean);
  return cors({
    origin: origins,
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    maxAge: 86_400,
  })(c, next);
});

// ---------------------------------------------------------------------------
// Health check (before auth)
// ---------------------------------------------------------------------------
app.get('/health', (c) =>
  c.json({ status: 'ok', timestamp: new Date().toISOString() }),
);

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------
app.route('/api/auth', authRoutes);
app.route('/api/users', usersRoutes);
app.route('/api/credentials', credentialsRoutes);
app.route('/api/transform', transformRoutes);

// ---------------------------------------------------------------------------
// Error handling
// ---------------------------------------------------------------------------
app.onError(errorHandler);

app.notFound((c) =>
  c.json(
    {
      error: {
        code: 'NOT_FOUND',
        message: `Route ${c.req.method} ${c.req.path} not found`,
      },
    },
    404,
  ),
);

// ---------------------------------------------------------------------------
// Cloudflare Workers export
// CF Worker secrets set via `wrangler secret put` are only available on the
// `env` binding object — they are NOT automatically injected into process.env
// even with nodejs_compat. We copy them here so the rest of the app can use
// process.env safely (db/index.ts, services, etc.).
// Run `pnpm db:migrate` against DATABASE_URL before deploying.
// ---------------------------------------------------------------------------
export default {
  fetch(req: Request, env: Record<string, string>, ctx: unknown) {
    for (const [key, value] of Object.entries(env)) {
      if (typeof value === 'string') {
        process.env[key] = value;
      }
    }
    return app.fetch(req, env, ctx as never);
  },
};
