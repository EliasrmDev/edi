import { createMiddleware } from 'hono/factory';
import type { AppEnv } from '../types.js';
import { eq, and, gt, isNull } from 'drizzle-orm';
import { db } from '../db/index.js';
import { sessions, users } from '../db/schema.js';
import { hashToken } from '../services/auth/TokenService.js';

/**
 * Session-based authentication middleware.
 * - Reads Authorization: Bearer <token>
 * - SHA-256 hashes the token → looks up sessions table
 * - Validates: not expired, not revoked, user not soft-deleted
 * - Sets c.set('user') and c.set('sessionId')
 * - Returns 401 with generic message on any failure (no info leakage)
 */
export const requireAuth = () =>
  createMiddleware<AppEnv>(async (c, next) => {
    const authHeader = c.req.header('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return c.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        401,
      );
    }

    const token = authHeader.slice(7);
    if (!token) {
      return c.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        401,
      );
    }

    const tokenHash = hashToken(token);

    const result = await db
      .select({
        sessionId: sessions.id,
        userId: users.id,
        email: users.email,
        emailVerified: users.emailVerified,
        role: users.role,
        userCreatedAt: users.createdAt,
        userUpdatedAt: users.updatedAt,
        userDeletedAt: users.deletedAt,
      })
      .from(sessions)
      .innerJoin(users, eq(sessions.userId, users.id))
      .where(
        and(
          eq(sessions.tokenHash, tokenHash),
          gt(sessions.expiresAt, new Date()),
          isNull(sessions.revokedAt),
          isNull(users.deletedAt),
        ),
      )
      .limit(1);

    const row = result[0];
    if (!row) {
      return c.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        401,
      );
    }

    c.set('user', {
      id: row.userId,
      email: row.email,
      emailVerified: row.emailVerified,
      role: row.role,
      createdAt: row.userCreatedAt,
      updatedAt: row.userUpdatedAt,
      deletedAt: row.userDeletedAt,
    });
    c.set('sessionId', row.sessionId);

    await next();
  });

/**
 * Require admin role. Must be used after requireAuth().
 */
export const requireAdmin = () =>
  createMiddleware<AppEnv>(async (c, next) => {
    const user = c.get('user');
    if (user?.role !== 'admin') {
      return c.json(
        { error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } },
        403,
      );
    }
    await next();
  });
