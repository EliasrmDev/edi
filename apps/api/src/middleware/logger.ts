import { createMiddleware } from 'hono/factory';
import type { AppEnv } from '../types.js';

/**
 * Structured JSON logger.
 * Logs: timestamp, requestId, method, path, statusCode, durationMs, userId.
 * NEVER logs: Authorization headers, passwords, tokens, email bodies, query params with tokens.
 */
export const structuredLogger = () =>
  createMiddleware<AppEnv>(async (c, next) => {
    const start = Date.now();
    await next();
    const durationMs = Date.now() - start;

    const requestId = c.get('requestId');
    const user = c.get('user');
    const userId = user?.id;

    // Strip query params to avoid logging tokens in URLs
    const path = c.req.path;

    const entry = {
      level: 'info',
      timestamp: new Date().toISOString(),
      requestId,
      method: c.req.method,
      path,
      statusCode: c.res.status,
      durationMs,
      ...(userId ? { userId } : {}),
    };

    console.error(JSON.stringify(entry));
  });
