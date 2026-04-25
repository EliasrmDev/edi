import { createMiddleware } from 'hono/factory';

/**
 * In-memory sliding window rate limiter.
 * LIMITATION: Single-instance only. For multi-instance deployments, use Redis.
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

/**
 * Clear all in-memory rate limit counters.
 * Exported for use in tests only — do not call in production code.
 */
export function clearRateLimitStore(): void {
  store.clear();
}

// Periodic cleanup every 60s to prevent memory leaks
// NOTE: setInterval is not used here because CF Workers isolates are short-lived
// and don't support .unref(). Cleanup is done lazily inside checkLimit instead.

function checkLimit(
  key: string,
  maxRequests: number,
  windowMs: number,
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();

  // Lazy cleanup: evict a few expired entries on each call to bound memory usage
  if (store.size > 500) {
    for (const [k, e] of store) {
      if (e.resetAt <= now) store.delete(k);
    }
  }

  const entry = store.get(key);

  if (!entry || entry.resetAt <= now) {
    const resetAt = now + windowMs;
    store.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: maxRequests - 1, resetAt };
  }

  entry.count++;
  if (entry.count > maxRequests) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  return { allowed: true, remaining: maxRequests - entry.count, resetAt: entry.resetAt };
}

function getClientIP(c: { req: { header: (name: string) => string | undefined } }): string {
  return (
    c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ??
    c.req.header('x-real-ip') ??
    '127.0.0.1'
  );
}

/**
 * Auth rate limiter: 10 attempts per 15 minutes per IP.
 * Used on login, register, forgot-password, and similar endpoints.
 */
export const authLimiter = () =>
  createMiddleware(async (c, next) => {
    const ip = getClientIP(c);
    const key = `auth:${ip}`;
    const { allowed, remaining, resetAt } = checkLimit(key, 10, 15 * 60 * 1000);

    c.header('X-RateLimit-Remaining', String(remaining));
    c.header('X-RateLimit-Reset', String(Math.ceil(resetAt / 1000)));

    if (!allowed) {
      const retryAfter = Math.ceil((resetAt - Date.now()) / 1000);
      c.header('Retry-After', String(retryAfter));
      return c.json(
        { error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many requests. Try again later.' } },
        429,
      );
    }

    await next();
  });

/**
 * API rate limiter: 100 requests per minute per user ID.
 * Applied to authenticated API routes.
 */
export const apiLimiter = () =>
  createMiddleware(async (c, next) => {
    const user = c.get('user') as { id: string } | undefined;
    const key = user ? `api:${user.id}` : `api:${getClientIP(c)}`;
    const { allowed, remaining, resetAt } = checkLimit(key, 100, 60 * 1000);

    c.header('X-RateLimit-Remaining', String(remaining));
    c.header('X-RateLimit-Reset', String(Math.ceil(resetAt / 1000)));

    if (!allowed) {
      const retryAfter = Math.ceil((resetAt - Date.now()) / 1000);
      c.header('Retry-After', String(retryAfter));
      return c.json(
        { error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many requests. Try again later.' } },
        429,
      );
    }

    await next();
  });

/**
 * Strict rate limiter: 3 attempts per hour per IP.
 * Used on sensitive endpoints like forgot-password.
 */
export const strictLimiter = () =>
  createMiddleware(async (c, next) => {
    const ip = getClientIP(c);
    const key = `strict:${ip}`;
    const { allowed, remaining, resetAt } = checkLimit(key, 3, 60 * 60 * 1000);

    c.header('X-RateLimit-Remaining', String(remaining));
    c.header('X-RateLimit-Reset', String(Math.ceil(resetAt / 1000)));

    if (!allowed) {
      const retryAfter = Math.ceil((resetAt - Date.now()) / 1000);
      c.header('Retry-After', String(retryAfter));
      return c.json(
        { error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many requests. Try again later.' } },
        429,
      );
    }

    await next();
  });

/**
 * Credential creation limiter: 10 per hour per user.
 * Prevents credential farming and abuse of provider verification calls.
 */
export const credentialLimiter = () =>
  createMiddleware(async (c, next) => {
    const user = c.get('user') as { id: string } | undefined;
    const key = user ? `cred:${user.id}` : `cred:${getClientIP(c)}`;
    const { allowed, remaining, resetAt } = checkLimit(key, 10, 60 * 60 * 1000);

    c.header('X-RateLimit-Remaining', String(remaining));
    c.header('X-RateLimit-Reset', String(Math.ceil(resetAt / 1000)));

    if (!allowed) {
      const retryAfter = Math.ceil((resetAt - Date.now()) / 1000);
      c.header('Retry-After', String(retryAfter));
      return c.json(
        { error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many requests. Try again later.' } },
        429,
      );
    }

    await next();
  });
