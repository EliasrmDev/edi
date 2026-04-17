import { createMiddleware } from 'hono/factory';
import type { AppEnv } from '../types.js';
import { randomUUID } from 'node:crypto';

/**
 * Assigns a unique request ID to each incoming request.
 * Reads X-Request-ID header if present, otherwise generates a new UUID.
 * Sets the ID on the context and response header.
 */
export const requestId = () =>
  createMiddleware<AppEnv>(async (c, next) => {
    const id = c.req.header('X-Request-ID') ?? randomUUID();
    c.set('requestId', id);
    c.header('X-Request-ID', id);
    await next();
  });
