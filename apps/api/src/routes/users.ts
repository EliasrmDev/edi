import { Hono } from 'hono';
import type { AppEnv } from '../types.js';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth.js';
import { apiLimiter } from '../middleware/rateLimit.js';
import { writeAuditLog } from '../services/audit/AuditService.js';
import {
  getUserProfile,
  updateUserProfile,
  updateUserPassword,
  findUserById,
  createDeletionRequest,
  cancelDeletionRequest,
  getDeletionStatus,
} from '../services/users/UserService.js';
import {
  validatePasswordStrength,
  hashPassword,
  verifyPassword,
} from '../services/auth/PasswordService.js';
import { revokeAllUserSessions } from '../services/auth/SessionService.js';
import { AppError } from '../middleware/errorHandler.js';

// ---------------------------------------------------------------------------
// Zod schemas
// ---------------------------------------------------------------------------

const UpdateProfileSchema = z
  .object({
    displayName: z.string().max(100).optional(),
    defaultTone: z.string().max(50).optional(),
    preferredLocale: z.string().max(10).optional(),
    retainHistory: z.boolean().optional(),
  })
  .refine(
    (data) =>
      data.displayName !== undefined ||
      data.defaultTone !== undefined ||
      data.preferredLocale !== undefined ||
      data.retainHistory !== undefined,
    { message: 'At least one field must be provided' },
  );

const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1).optional(),
  newPassword: z.string().min(12).max(128),
});

const RequestDeletionSchema = z.object({
  reason: z.string().max(500).optional(),
});

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

const usersRouter = new Hono<AppEnv>();

// All routes require authentication
usersRouter.use('*', requireAuth(), apiLimiter());

// ---- GET /users/profile ----
usersRouter.get('/profile', async (c) => {
  const user = c.get('user');
  const profile = await getUserProfile(user.id);

  return c.json({ data: { profile } });
});

// ---- PATCH /users/profile ----
usersRouter.patch('/profile', async (c) => {
  const user = c.get('user');
  const body = UpdateProfileSchema.parse(await c.req.json());

  const profile = await updateUserProfile(user.id, body);

  await writeAuditLog({
    userId: user.id,
    action: 'user.update_profile',
    resourceType: 'user_profile',
    resourceId: user.id,
    outcome: 'success',
    ipAddress: c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ?? '127.0.0.1',
    userAgent: c.req.header('User-Agent'),
    metadata: { updatedFields: Object.keys(body) },
  });

  return c.json({ data: { profile } });
});

// ---- POST /users/change-password ----
usersRouter.post('/change-password', async (c) => {
  const user = c.get('user');
  const sessionId = c.get('sessionId');
  const body = ChangePasswordSchema.parse(await c.req.json());

  // Fetch current user to get password hash
  const dbUser = await findUserById(user.id);
  if (!dbUser) {
    throw new AppError('USER_NOT_FOUND', 'User not found', 404);
  }

  if (dbUser.passwordHash) {
    // User already has a password — require current password verification
    if (!body.currentPassword) {
      throw new AppError('INVALID_PASSWORD', 'Current password is required', 400);
    }
    const valid = await verifyPassword(dbUser.passwordHash, body.currentPassword);
    if (!valid) {
      await writeAuditLog({
        userId: user.id,
        action: 'user.change_password',
        outcome: 'failure',
        ipAddress: c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ?? '127.0.0.1',
        userAgent: c.req.header('User-Agent'),
        metadata: { reason: 'invalid_current_password' },
      });
      throw new AppError('INVALID_PASSWORD', 'Current password is incorrect', 401);
    }
  }
  // OAuth-only users (no passwordHash): skip current password check — they're setting a password for the first time

  // Validate and hash new password
  validatePasswordStrength(body.newPassword, dbUser.email);
  const newHash = await hashPassword(body.newPassword);
  await updateUserPassword(user.id, newHash);

  // Revoke all other sessions (keep current one active)
  await revokeAllUserSessions(user.id, sessionId);

  await writeAuditLog({
    userId: user.id,
    action: 'user.change_password',
    outcome: 'success',
    ipAddress: c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ?? '127.0.0.1',
    userAgent: c.req.header('User-Agent'),
  });

  return c.json({ data: { message: 'Password changed. Other sessions have been revoked.' } });
});

// ---- POST /users/request-deletion ----
usersRouter.post('/request-deletion', async (c) => {
  const user = c.get('user');
  const body = RequestDeletionSchema.parse(await c.req.json());

  const result = await createDeletionRequest(user.id, body.reason ?? null);

  await writeAuditLog({
    userId: user.id,
    action: 'user.request_deletion',
    resourceType: 'deletion_request',
    resourceId: result.requestId,
    outcome: 'success',
    ipAddress: c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ?? '127.0.0.1',
    userAgent: c.req.header('User-Agent'),
  });

  return c.json({
    data: {
      message: 'Account deletion requested. You have 30 days to cancel.',
      requestId: result.requestId,
      scheduledAt: result.scheduledAt.toISOString(),
    },
  });
});

// ---- POST /users/cancel-deletion ----
usersRouter.post('/cancel-deletion', async (c) => {
  const user = c.get('user');

  await cancelDeletionRequest(user.id);

  await writeAuditLog({
    userId: user.id,
    action: 'user.cancel_deletion',
    outcome: 'success',
    ipAddress: c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ?? '127.0.0.1',
    userAgent: c.req.header('User-Agent'),
  });

  return c.json({ data: { message: 'Deletion request cancelled.' } });
});

// ---- GET /users/deletion-status ----
usersRouter.get('/deletion-status', async (c) => {
  const user = c.get('user');
  const status = await getDeletionStatus(user.id);

  if (!status) {
    return c.json({ data: { hasPendingDeletion: false } });
  }

  return c.json({
    data: {
      hasPendingDeletion: status.status === 'pending',
      request: {
        id: status.id,
        status: status.status,
        requestedAt: status.requestedAt.toISOString(),
        scheduledAt: status.scheduledAt.toISOString(),
        cancelledAt: status.cancelledAt?.toISOString() ?? null,
      },
    },
  });
});

export default usersRouter;
