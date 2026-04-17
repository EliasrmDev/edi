import { eq, and, isNull } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { emailVerifications, passwordResetTokens, users } from '../../db/schema.js';
import { generateToken, hashToken } from './TokenService.js';
import { hashPassword } from './PasswordService.js';
import { revokeAllUserSessions } from './SessionService.js';
import { AppError } from '../../middleware/errorHandler.js';

const EMAIL_VERIFICATION_HOURS = 24;
const PASSWORD_RESET_HOURS = 1;

// ---------------------------------------------------------------------------
// Email verification
// ---------------------------------------------------------------------------

export interface CreateVerificationResult {
  /** Raw token for the email link — never stored in DB. */
  token: string;
  expiresAt: Date;
}

/**
 * Create an email verification token.
 * Returns the raw token to embed in a verification URL.
 */
export async function createVerification(userId: string): Promise<CreateVerificationResult> {
  const token = generateToken(32);
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + EMAIL_VERIFICATION_HOURS * 60 * 60 * 1000);

  await db.insert(emailVerifications).values({
    userId,
    tokenHash,
    expiresAt,
  });

  return { token, expiresAt };
}

/**
 * Verify an email with a token.
 * Hashes the token, validates the record, marks it used, sets user.email_verified.
 */
export async function verifyEmail(token: string): Promise<{ userId: string }> {
  const tokenHash = hashToken(token);

  const result = await db
    .select()
    .from(emailVerifications)
    .where(
      and(
        eq(emailVerifications.tokenHash, tokenHash),
        isNull(emailVerifications.usedAt),
      ),
    )
    .limit(1);

  const record = result[0];
  if (!record) {
    throw new AppError('INVALID_TOKEN', 'Invalid or expired verification token', 400);
  }

  if (record.expiresAt < new Date()) {
    throw new AppError('TOKEN_EXPIRED', 'Verification token has expired', 400);
  }

  // Mark token as used
  await db
    .update(emailVerifications)
    .set({ usedAt: new Date() })
    .where(eq(emailVerifications.id, record.id));

  // Set user as verified
  await db
    .update(users)
    .set({ emailVerified: true, updatedAt: new Date() })
    .where(eq(users.id, record.userId));

  return { userId: record.userId };
}

// ---------------------------------------------------------------------------
// Password reset
// ---------------------------------------------------------------------------

export interface CreatePasswordResetResult {
  /** Raw token for the reset URL. Null if user not found (constant-time safe). */
  token: string | null;
  expiresAt: Date | null;
}

/**
 * Create a password reset token for an email.
 * Always appears to succeed (constant-time) to prevent user enumeration.
 */
export async function createPasswordReset(email: string): Promise<CreatePasswordResetResult> {
  const normalizedEmail = email.toLowerCase().trim();

  const result = await db
    .select({ id: users.id })
    .from(users)
    .where(
      and(
        eq(users.email, normalizedEmail),
        isNull(users.deletedAt),
      ),
    )
    .limit(1);

  const user = result[0];

  if (!user) {
    // Generate a fake token to maintain constant-time behavior
    generateToken(32);
    return { token: null, expiresAt: null };
  }

  const token = generateToken(32);
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + PASSWORD_RESET_HOURS * 60 * 60 * 1000);

  await db.insert(passwordResetTokens).values({
    userId: user.id,
    tokenHash,
    expiresAt,
  });

  return { token, expiresAt };
}

/**
 * Reset a user's password with a token.
 * Validates the token, updates the password hash, revokes all sessions.
 */
export async function resetPassword(token: string, newPassword: string): Promise<{ userId: string }> {
  const tokenHash = hashToken(token);

  const result = await db
    .select()
    .from(passwordResetTokens)
    .where(
      and(
        eq(passwordResetTokens.tokenHash, tokenHash),
        isNull(passwordResetTokens.usedAt),
      ),
    )
    .limit(1);

  const record = result[0];
  if (!record) {
    throw new AppError('INVALID_TOKEN', 'Invalid or expired reset token', 400);
  }

  if (record.expiresAt < new Date()) {
    throw new AppError('TOKEN_EXPIRED', 'Password reset token has expired', 400);
  }

  const newPasswordHash = await hashPassword(newPassword);

  // Mark token used
  await db
    .update(passwordResetTokens)
    .set({ usedAt: new Date() })
    .where(eq(passwordResetTokens.id, record.id));

  // Update password
  await db
    .update(users)
    .set({ passwordHash: newPasswordHash, updatedAt: new Date() })
    .where(eq(users.id, record.userId));

  // Revoke all sessions for security
  await revokeAllUserSessions(record.userId);

  return { userId: record.userId };
}
