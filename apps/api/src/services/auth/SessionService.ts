import { eq, and, isNull, lt } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { sessions } from '../../db/schema.js';
import { generateToken, hashToken } from './TokenService.js';

const SESSION_DURATION_HOURS = Number(process.env.SESSION_DURATION_HOURS) || 24;

export interface CreateSessionResult {
  /** Raw token — shown to the client exactly ONCE, then discarded server-side. */
  token: string;
  sessionId: string;
  expiresAt: Date;
}

/**
 * Create a new session for a user.
 * Generates a random token, stores its SHA-256 hash in the DB.
 */
export async function createSession(
  userId: string,
  ipAddress: string | null,
  userAgent: string | null,
): Promise<CreateSessionResult> {
  const token = generateToken(32);
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + SESSION_DURATION_HOURS * 60 * 60 * 1000);

  const result = await db
    .insert(sessions)
    .values({
      userId,
      tokenHash,
      ipAddress,
      userAgent: userAgent?.slice(0, 200) ?? null,
      expiresAt,
    })
    .returning({ id: sessions.id });

  const row = result[0];
  if (!row) {
    throw new Error('Failed to create session');
  }

  return { token, sessionId: row.id, expiresAt };
}

/**
 * Revoke a single session by setting revoked_at.
 */
export async function revokeSession(sessionId: string): Promise<void> {
  await db
    .update(sessions)
    .set({ revokedAt: new Date() })
    .where(
      and(
        eq(sessions.id, sessionId),
        isNull(sessions.revokedAt),
      ),
    );
}

/**
 * Revoke all active sessions for a user.
 * Optionally exclude a specific session (e.g., the current one).
 */
export async function revokeAllUserSessions(
  userId: string,
  excludeSessionId?: string,
): Promise<void> {
  const now = new Date();

  if (excludeSessionId) {
    // Drizzle doesn't have neq with combined and easily, so we use two queries
    const activeSessions = await db
      .select({ id: sessions.id })
      .from(sessions)
      .where(
        and(
          eq(sessions.userId, userId),
          isNull(sessions.revokedAt),
        ),
      );

    for (const session of activeSessions) {
      if (session.id !== excludeSessionId) {
        await db
          .update(sessions)
          .set({ revokedAt: now })
          .where(eq(sessions.id, session.id));
      }
    }
  } else {
    await db
      .update(sessions)
      .set({ revokedAt: now })
      .where(
        and(
          eq(sessions.userId, userId),
          isNull(sessions.revokedAt),
        ),
      );
  }
}

/**
 * Delete sessions that expired more than 7 days ago.
 * Called by the cleanup.expired-sessions worker job.
 */
export async function cleanupExpiredSessions(): Promise<number> {
  const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const result = await db
    .delete(sessions)
    .where(lt(sessions.expiresAt, cutoff))
    .returning({ id: sessions.id });
  return result.length;
}
