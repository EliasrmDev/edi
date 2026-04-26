import { eq, and, isNull } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { users, userProfiles, deletionRequests, quotaLimits } from '../../db/schema.js';
import { AppError } from '../../middleware/errorHandler.js';

/** Safe user fields returned to clients — never includes password hash. */
export interface SafeUser {
  id: string;
  email: string;
  emailVerified: boolean;
  role: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SafeProfile {
  userId: string;
  displayName: string | null;
  defaultTone: string;
  preferredLocale: string;
  retainHistory: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ---------------------------------------------------------------------------
// User CRUD
// ---------------------------------------------------------------------------

/**
 * Find a user by email (case-insensitive).
 * Returns null if not found — caller decides to throw or return generic response.
 */
export async function findUserByEmail(
  email: string,
): Promise<(typeof users.$inferSelect) | null> {
  const normalizedEmail = email.toLowerCase().trim();
  const result = await db
    .select()
    .from(users)
    .where(
      and(
        eq(users.email, normalizedEmail),
        isNull(users.deletedAt),
      ),
    )
    .limit(1);

  return result[0] ?? null;
}

/**
 * Find a user by ID.
 */
export async function findUserById(
  userId: string,
): Promise<(typeof users.$inferSelect) | null> {
  const result = await db
    .select()
    .from(users)
    .where(
      and(
        eq(users.id, userId),
        isNull(users.deletedAt),
      ),
    )
    .limit(1);

  return result[0] ?? null;
}

/**
 * Create a new user and their profile in a single transaction.
 * Also initializes quota limits.
 */
export async function createUser(params: {
  email: string;
  passwordHash: string;
  displayName?: string;
}): Promise<{ user: SafeUser; profile: SafeProfile }> {
  const normalizedEmail = params.email.toLowerCase().trim();

  // Check for existing user
  const existing = await findUserByEmail(normalizedEmail);
  if (existing) {
    throw new AppError('EMAIL_IN_USE', 'An account with this email already exists', 409);
  }

  const now = new Date();
  const dailyReset = new Date(now);
  dailyReset.setHours(24, 0, 0, 0);
  const monthlyReset = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  // Transaction: create user + profile + quota
  const result = await db.transaction(async (tx) => {
    const userResult = await tx
      .insert(users)
      .values({
        email: normalizedEmail,
        passwordHash: params.passwordHash,
        emailVerified: false,
        role: 'user',
      })
      .returning();

    const newUser = userResult[0];
    if (!newUser) throw new Error('Failed to create user');

    const profileResult = await tx
      .insert(userProfiles)
      .values({
        userId: newUser.id,
        displayName: params.displayName ?? null,
        defaultTone: 'voseo-cr',
        preferredLocale: 'es-CR',
        retainHistory: false,
      })
      .returning();

    const newProfile = profileResult[0];
    if (!newProfile) throw new Error('Failed to create profile');

    await tx.insert(quotaLimits).values({
      userId: newUser.id,
      dailyAiRequests: Number(process.env.DEFAULT_DAILY_AI_QUOTA) || 100,
      monthlyAiRequests: 1000,
      dailyUsed: 0,
      monthlyUsed: 0,
      resetDailyAt: dailyReset,
      resetMonthlyAt: monthlyReset,
    });

    return { user: newUser, profile: newProfile };
  });

  return {
    user: toSafeUser(result.user),
    profile: toSafeProfile(result.profile),
  };
}

// ---------------------------------------------------------------------------
// Profile
// ---------------------------------------------------------------------------

/**
 * Get a user's profile.
 */
export async function getUserProfile(userId: string): Promise<SafeProfile> {
  const result = await db
    .select()
    .from(userProfiles)
    .where(eq(userProfiles.userId, userId))
    .limit(1);

  const profile = result[0];
  if (!profile) {
    throw new AppError('PROFILE_NOT_FOUND', 'User profile not found', 404);
  }

  return toSafeProfile(profile);
}

/**
 * Update a user's profile.
 */
export async function updateUserProfile(
  userId: string,
  updates: {
    displayName?: string | null;
    defaultTone?: string;
    preferredLocale?: string;
    retainHistory?: boolean;
  },
): Promise<SafeProfile> {
  const result = await db
    .update(userProfiles)
    .set({ ...updates, updatedAt: new Date() })
    .where(eq(userProfiles.userId, userId))
    .returning();

  const profile = result[0];
  if (!profile) {
    throw new AppError('PROFILE_NOT_FOUND', 'User profile not found', 404);
  }

  return toSafeProfile(profile);
}

/**
 * Update a user's password hash.
 */
export async function updateUserPassword(userId: string, passwordHash: string): Promise<void> {
  await db
    .update(users)
    .set({ passwordHash, updatedAt: new Date() })
    .where(eq(users.id, userId));
}

// ---------------------------------------------------------------------------
// Deletion requests
// ---------------------------------------------------------------------------

/**
 * Create an account deletion request with 30-day grace period.
 */
export async function createDeletionRequest(
  userId: string,
  reason: string | null,
): Promise<{ requestId: string; scheduledAt: Date }> {
  const now = new Date();
  const scheduledAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  // Check for existing pending request
  const existing = await db
    .select()
    .from(deletionRequests)
    .where(
      and(
        eq(deletionRequests.userId, userId),
        eq(deletionRequests.status, 'pending'),
      ),
    )
    .limit(1);

  if (existing[0]) {
    throw new AppError(
      'DELETION_ALREADY_REQUESTED',
      'A deletion request is already pending',
      409,
    );
  }

  // Mark user deletion timestamps
  await db
    .update(users)
    .set({
      deletionRequestedAt: now,
      deletionScheduledAt: scheduledAt,
      updatedAt: now,
    })
    .where(eq(users.id, userId));

  const result = await db
    .insert(deletionRequests)
    .values({
      userId,
      requestedAt: now,
      scheduledAt,
      reason,
      status: 'pending',
    })
    .returning({ id: deletionRequests.id });

  const row = result[0];
  if (!row) throw new Error('Failed to create deletion request');

  return { requestId: row.id, scheduledAt };
}

/**
 * Cancel a pending deletion request.
 */
export async function cancelDeletionRequest(userId: string): Promise<void> {
  const result = await db
    .select()
    .from(deletionRequests)
    .where(
      and(
        eq(deletionRequests.userId, userId),
        eq(deletionRequests.status, 'pending'),
      ),
    )
    .limit(1);

  const request = result[0];
  if (!request) {
    throw new AppError('NO_PENDING_DELETION', 'No pending deletion request found', 404);
  }

  await db
    .update(deletionRequests)
    .set({ cancelledAt: new Date(), status: 'cancelled' })
    .where(eq(deletionRequests.id, request.id));

  // Clear user deletion timestamps
  await db
    .update(users)
    .set({
      deletionRequestedAt: null,
      deletionScheduledAt: null,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));
}

/**
 * Get the current deletion request status for a user.
 */
export async function getDeletionStatus(
  userId: string,
): Promise<{
  id: string;
  status: string;
  requestedAt: Date;
  scheduledAt: Date;
  cancelledAt: Date | null;
} | null> {
  const result = await db
    .select({
      id: deletionRequests.id,
      status: deletionRequests.status,
      requestedAt: deletionRequests.requestedAt,
      scheduledAt: deletionRequests.scheduledAt,
      cancelledAt: deletionRequests.cancelledAt,
    })
    .from(deletionRequests)
    .where(eq(deletionRequests.userId, userId))
    .orderBy(deletionRequests.requestedAt)
    .limit(1);

  return result[0] ?? null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function toSafeUser(user: typeof users.$inferSelect): SafeUser {
  return {
    id: user.id,
    email: user.email,
    emailVerified: user.emailVerified,
    role: user.role,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

function toSafeProfile(profile: typeof userProfiles.$inferSelect): SafeProfile {
  return {
    userId: profile.userId,
    displayName: profile.displayName,
    defaultTone: profile.defaultTone,
    preferredLocale: profile.preferredLocale,
    retainHistory: profile.retainHistory,
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt,
  };
}
