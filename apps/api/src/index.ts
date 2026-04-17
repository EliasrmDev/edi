import 'dotenv/config';
import { serve } from '@hono/node-server';
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
app.use(
  '*',
  cors({
    origin: (process.env.API_CORS_ORIGINS ?? '').split(',').filter(Boolean),
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    maxAge: 86_400,
  }),
);

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
// Start server
// ---------------------------------------------------------------------------
const port = Number(process.env.API_PORT) || 3001;

serve({ fetch: app.fetch, port }, (info) => {
  console.error(`EDI API running on http://localhost:${info.port}`);
});

export default app;
