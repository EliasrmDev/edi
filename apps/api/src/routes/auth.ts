import { Hono } from 'hono';
import type { AppEnv } from '../types.js';
import { z } from 'zod';
import { db } from '../db/index.js';
import { users, userProfiles, quotaLimits, oauthAccounts } from '../db/schema.js';
import { eq, and } from 'drizzle-orm';
import { findUserByEmail, createUser, toSafeUser } from '../services/users/UserService.js';
import { validatePasswordStrength, hashPassword, verifyPassword } from '../services/auth/PasswordService.js';
import { createSession, revokeSession, revokeAllUserSessions } from '../services/auth/SessionService.js';
import {
  createVerification,
  verifyEmail,
  createPasswordReset,
  resetPassword,
} from '../services/auth/EmailVerificationService.js';
import { writeAuditLog } from '../services/audit/AuditService.js';
import { AppError } from '../middleware/errorHandler.js';
import { authLimiter, strictLimiter } from '../middleware/rateLimit.js';
import { requireAuth } from '../middleware/auth.js';

// ---------------------------------------------------------------------------
// Zod schemas
// ---------------------------------------------------------------------------

const RegisterSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(12).max(128),
  displayName: z.string().max(100).optional(),
});

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const ForgotPasswordSchema = z.object({
  email: z.string().email(),
});

const ResetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(12).max(128),
});

const ResendVerificationSchema = z.object({
  email: z.string().email(),
});

const OAuthSigninSchema = z.object({
  provider: z.string().min(1).max(100),
  providerAccountId: z.string().min(1).max(255),
  email: z.string().email().max(255),
  displayName: z.string().max(100).nullable().optional(),
});

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

function getClientIP(c: { req: { header: (name: string) => string | undefined } }): string {
  return (
    c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ??
    c.req.header('x-real-ip') ??
    '127.0.0.1'
  );
}

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

const auth = new Hono<AppEnv>();

// ---- POST /auth/register ----
auth.post('/register', authLimiter(), async (c) => {
  const body = RegisterSchema.parse(await c.req.json());

  validatePasswordStrength(body.password, body.email);

  const passwordHash = await hashPassword(body.password);
  const { user, profile } = await createUser({
    email: body.email,
    passwordHash,
    displayName: body.displayName,
  });

  const session = await createSession(
    user.id,
    getClientIP(c),
    c.req.header('User-Agent') ?? null,
  );

  // Send verification email (fire-and-forget in real implementation)
  const verification = await createVerification(user.id);

  await writeAuditLog({
    userId: user.id,
    action: 'user.register',
    outcome: 'success',
    ipAddress: getClientIP(c),
    userAgent: c.req.header('User-Agent'),
  });

  return c.json(
    {
      data: {
        user,
        profile,
        token: session.token,
        expiresAt: session.expiresAt.toISOString(),
        emailVerificationSent: true,
        // In production, token would be sent via email, not returned here
        _dev: { verificationToken: verification.token },
      },
    },
    201,
  );
});

// ---- POST /auth/login ----
auth.post('/login', authLimiter(), async (c) => {
  const body = LoginSchema.parse(await c.req.json());
  const ip = getClientIP(c);
  const ua = c.req.header('User-Agent') ?? null;

  const user = await findUserByEmail(body.email);

  if (!user || !user.passwordHash) {
    await writeAuditLog({
      userId: null,
      action: 'user.login',
      outcome: 'failure',
      ipAddress: ip,
      userAgent: ua ?? undefined,
      metadata: { reason: 'user_not_found' },
    });
    throw new AppError('INVALID_CREDENTIALS', 'Invalid email or password', 401);
  }

  if (!user.emailVerified) {
    await writeAuditLog({
      userId: user.id,
      action: 'user.login',
      outcome: 'failure',
      ipAddress: ip,
      userAgent: ua ?? undefined,
      metadata: { reason: 'email_not_verified' },
    });
    throw new AppError('EMAIL_NOT_VERIFIED', 'Please verify your email address before logging in', 403);
  }

  const valid = await verifyPassword(user.passwordHash, body.password);
  if (!valid) {
    await writeAuditLog({
      userId: user.id,
      action: 'user.login',
      outcome: 'failure',
      ipAddress: ip,
      userAgent: ua ?? undefined,
      metadata: { reason: 'invalid_password' },
    });
    throw new AppError('INVALID_CREDENTIALS', 'Invalid email or password', 401);
  }

  const session = await createSession(user.id, ip, ua);

  await writeAuditLog({
    userId: user.id,
    action: 'user.login',
    outcome: 'success',
    ipAddress: ip,
    userAgent: ua ?? undefined,
  });

  return c.json({
    data: {
      user: toSafeUser(user),
      token: session.token,
      expiresAt: session.expiresAt.toISOString(),
    },
  });
});

// ---- POST /auth/logout ----
auth.post('/logout', requireAuth(), async (c) => {
  const sessionId = c.get('sessionId');
  const user = c.get('user');

  await revokeSession(sessionId);

  await writeAuditLog({
    userId: user.id,
    action: 'user.logout',
    outcome: 'success',
    ipAddress: getClientIP(c),
    userAgent: c.req.header('User-Agent'),
  });

  return c.json({ data: { message: 'Logged out successfully' } });
});

// ---- POST /auth/logout-all ----
auth.post('/logout-all', requireAuth(), async (c) => {
  const user = c.get('user');

  await revokeAllUserSessions(user.id);

  await writeAuditLog({
    userId: user.id,
    action: 'user.logout_all',
    outcome: 'success',
    ipAddress: getClientIP(c),
    userAgent: c.req.header('User-Agent'),
  });

  return c.json({ data: { message: 'All sessions revoked' } });
});

// ---- GET /auth/verify-email?token=xxx ----
auth.get('/verify-email', async (c) => {
  const token = c.req.query('token');
  if (!token) {
    throw new AppError('MISSING_TOKEN', 'Verification token is required', 400);
  }

  const { userId } = await verifyEmail(token);

  await writeAuditLog({
    userId,
    action: 'user.verify_email',
    outcome: 'success',
    ipAddress: getClientIP(c),
    userAgent: c.req.header('User-Agent'),
  });

  return c.json({ data: { message: 'Email verified successfully' } });
});

// ---- POST /auth/resend-verification ----
auth.post('/resend-verification', strictLimiter(), async (c) => {
  const body = ResendVerificationSchema.parse(await c.req.json());
  const user = await findUserByEmail(body.email);

  // Always respond success to prevent user enumeration
  if (!user || user.emailVerified) {
    return c.json({ data: { message: 'If the email exists, a verification email has been sent' } });
  }

  const verification = await createVerification(user.id);

  await writeAuditLog({
    userId: user.id,
    action: 'user.resend_verification',
    outcome: 'success',
    ipAddress: getClientIP(c),
    userAgent: c.req.header('User-Agent'),
  });

  return c.json({
    data: {
      message: 'If the email exists, a verification email has been sent',
      _dev: { verificationToken: verification.token },
    },
  });
});

// ---- POST /auth/forgot-password ----
auth.post('/forgot-password', strictLimiter(), async (c) => {
  const body = ForgotPasswordSchema.parse(await c.req.json());

  const result = await createPasswordReset(body.email);

  // Audit log only if user exists (token is non-null)
  if (result.token) {
    await writeAuditLog({
      userId: null,
      action: 'user.forgot_password',
      outcome: 'success',
      ipAddress: getClientIP(c),
      userAgent: c.req.header('User-Agent'),
    });
  }

  // Always return same response (constant-time, prevents enumeration)
  return c.json({
    data: {
      message: 'If an account exists, a password reset email has been sent',
      _dev: result.token ? { resetToken: result.token } : undefined,
    },
  });
});

// ---- POST /auth/reset-password ----
auth.post('/reset-password', authLimiter(), async (c) => {
  const body = ResetPasswordSchema.parse(await c.req.json());

  validatePasswordStrength(body.password);

  const { userId } = await resetPassword(body.token, body.password);

  await writeAuditLog({
    userId,
    action: 'user.reset_password',
    outcome: 'success',
    ipAddress: getClientIP(c),
    userAgent: c.req.header('User-Agent'),
  });

  return c.json({ data: { message: 'Password reset successfully. All sessions have been revoked.' } });
});

// ---- GET /auth/me ----
auth.get('/me', requireAuth(), async (c) => {
  const user = c.get('user');

  return c.json({
    data: {
      user: {
        id: user.id,
        email: user.email,
        emailVerified: user.emailVerified,
        role: user.role,
        hasPassword: user.hasPassword,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    },
  });
});

// ---- POST /auth/oauth/signin  (server-to-server: called by Next.js during OAuth flow) ----
auth.post('/oauth/signin', strictLimiter(), async (c) => {
  const body = OAuthSigninSchema.parse(await c.req.json());
  const { provider, providerAccountId, email, displayName } = body;
  const ip = getClientIP(c);
  const ua = c.req.header('User-Agent') ?? null;
  const normalizedEmail = email.toLowerCase().trim();

  // 1. Find by provider account ID (survives email changes)
  const existingAccount = await db
    .select({ userId: oauthAccounts.userId })
    .from(oauthAccounts)
    .where(
      and(
        eq(oauthAccounts.provider, provider),
        eq(oauthAccounts.providerAccountId, providerAccountId),
      ),
    )
    .limit(1);

  let userId: string;

  if (existingAccount[0]) {
    userId = existingAccount[0].userId;
  } else {
    // 2. Find by email (enables linking to existing email/password account)
    const existingUser = await findUserByEmail(normalizedEmail);
    if (existingUser) {
      userId = existingUser.id;
      await db
        .insert(oauthAccounts)
        .values({ userId, provider, providerAccountId })
        .onConflictDoNothing();
    } else {
      // 3. Create new OAuth user (emailVerified = true — provider has already verified it)
      userId = await db.transaction(async (tx) => {
        const now = new Date();
        const dailyReset = new Date(now);
        dailyReset.setHours(24, 0, 0, 0);
        const monthlyReset = new Date(now.getFullYear(), now.getMonth() + 1, 1);

        const [newUser] = await tx
          .insert(users)
          .values({
            email: normalizedEmail,
            passwordHash: null,
            emailVerified: true,
            role: 'user',
          })
          .returning({ id: users.id });
        if (!newUser) throw new Error('Failed to create OAuth user');

        await tx.insert(userProfiles).values({
          userId: newUser.id,
          displayName: displayName ?? null,
          defaultTone: 'voseo-cr',
          preferredLocale: 'es-CR',
          retainHistory: false,
        });
        await tx.insert(quotaLimits).values({
          userId: newUser.id,
          dailyAiRequests: Number(process.env.DEFAULT_DAILY_AI_QUOTA) || 100,
          monthlyAiRequests: 1000,
          dailyUsed: 0,
          monthlyUsed: 0,
          resetDailyAt: dailyReset,
          resetMonthlyAt: monthlyReset,
        });
        await tx.insert(oauthAccounts).values({
          userId: newUser.id,
          provider,
          providerAccountId,
        });
        return newUser.id;
      });
    }
  }

  const session = await createSession(userId, ip, ua);
  await writeAuditLog({
    userId,
    action: 'user.oauth_signin',
    outcome: 'success',
    ipAddress: ip,
    userAgent: ua ?? undefined,
    metadata: { provider },
  });

  return c.json({
    data: {
      userId,
      email: normalizedEmail,
      sessionToken: session.token,
      expiresAt: session.expiresAt.toISOString(),
    },
  });
});

export default auth;
