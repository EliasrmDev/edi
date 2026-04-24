import {
  pgTable,
  uuid,
  text,
  boolean,
  integer,
  timestamp,
  jsonb,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ---------------------------------------------------------------------------
// users
// ---------------------------------------------------------------------------
export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    email: text('email').notNull().unique(),
    emailVerified: boolean('email_verified').notNull().default(false),
    passwordHash: text('password_hash'),
    role: text('role').notNull().default('user'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
    deletionRequestedAt: timestamp('deletion_requested_at', { withTimezone: true }),
    deletionScheduledAt: timestamp('deletion_scheduled_at', { withTimezone: true }),
  },
  (table) => ({
    emailIdx: uniqueIndex('users_email_idx').on(table.email),
    deletedAtIdx: index('users_deleted_at_idx').on(table.deletedAt),
  }),
);

// ---------------------------------------------------------------------------
// user_profiles
// ---------------------------------------------------------------------------
export const userProfiles = pgTable('user_profiles', {
  userId: uuid('user_id')
    .primaryKey()
    .references(() => users.id, { onDelete: 'cascade' }),
  displayName: text('display_name'),
  defaultTone: text('default_tone').notNull().default('voseo-cr'),
  preferredLocale: text('preferred_locale').notNull().default('es-CR'),
  retainHistory: boolean('retain_history').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// ---------------------------------------------------------------------------
// sessions
// ---------------------------------------------------------------------------
export const sessions = pgTable(
  'sessions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    tokenHash: text('token_hash').notNull().unique(),
    userAgent: text('user_agent'),
    ipAddress: text('ip_address'),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    tokenHashIdx: uniqueIndex('sessions_token_hash_idx').on(table.tokenHash),
    userIdIdx: index('sessions_user_id_idx').on(table.userId),
    expiresAtIdx: index('sessions_expires_at_idx').on(table.expiresAt),
  }),
);

// ---------------------------------------------------------------------------
// email_verifications
// ---------------------------------------------------------------------------
export const emailVerifications = pgTable(
  'email_verifications',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    tokenHash: text('token_hash').notNull().unique(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    usedAt: timestamp('used_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    tokenHashIdx: uniqueIndex('email_verifications_token_hash_idx').on(table.tokenHash),
  }),
);

// ---------------------------------------------------------------------------
// password_reset_tokens
// ---------------------------------------------------------------------------
export const passwordResetTokens = pgTable(
  'password_reset_tokens',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    tokenHash: text('token_hash').notNull().unique(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    usedAt: timestamp('used_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    tokenHashIdx: uniqueIndex('password_reset_tokens_token_hash_idx').on(table.tokenHash),
  }),
);

// ---------------------------------------------------------------------------
// provider_credentials
// ---------------------------------------------------------------------------
export const providerCredentials = pgTable(
  'provider_credentials',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    provider: text('provider').notNull(),
    mode: text('mode').notNull().default('byok'),
    label: text('label').notNull(),
    encryptedKey: text('encrypted_key').notNull(),
    keyVersion: integer('key_version').notNull().default(1),
    maskedKey: text('masked_key').notNull(),
    isActive: boolean('is_active').notNull().default(true),
    isEnabled: boolean('is_enabled').notNull().default(true),
    selectedModel: text('selected_model'),
    favoriteModels: text('favorite_models').array().notNull().default([]),
    expiresAt: timestamp('expires_at', { withTimezone: true }),
    lastVerifiedAt: timestamp('last_verified_at', { withTimezone: true }),
    lastUsedAt: timestamp('last_used_at', { withTimezone: true }),
    reminderSentAt: timestamp('reminder_sent_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (table) => ({
    userIdIdx: index('provider_credentials_user_id_idx').on(table.userId),
    isActiveIdx: index('provider_credentials_is_active_idx').on(table.isActive),
    expiresAtIdx: index('provider_credentials_expires_at_idx').on(table.expiresAt),
  }),
);

// ---------------------------------------------------------------------------
// audit_logs
// ---------------------------------------------------------------------------
export const auditLogs = pgTable(
  'audit_logs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id'),
    action: text('action').notNull(),
    resourceType: text('resource_type'),
    resourceId: text('resource_id'),
    ipAddressHash: text('ip_address_hash'),
    userAgentTruncated: text('user_agent_truncated'),
    outcome: text('outcome').notNull(),
    metadata: jsonb('metadata').notNull().default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    userIdIdx: index('audit_logs_user_id_idx').on(table.userId),
    actionIdx: index('audit_logs_action_idx').on(table.action),
    createdAtIdx: index('audit_logs_created_at_idx').on(table.createdAt),
  }),
);

// ---------------------------------------------------------------------------
// usage_records
// ---------------------------------------------------------------------------
export const usageRecords = pgTable(
  'usage_records',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    credentialId: uuid('credential_id').references(() => providerCredentials.id, {
      onDelete: 'set null',
    }),
    provider: text('provider'),
    transformationType: text('transformation_type').notNull(),
    source: text('source').notNull(),
    tokensUsed: integer('tokens_used'),
    processingMs: integer('processing_ms').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    userIdIdx: index('usage_records_user_id_idx').on(table.userId),
    createdAtIdx: index('usage_records_created_at_idx').on(table.createdAt),
  }),
);

// ---------------------------------------------------------------------------
// quota_limits
// ---------------------------------------------------------------------------
export const quotaLimits = pgTable('quota_limits', {
  userId: uuid('user_id')
    .primaryKey()
    .references(() => users.id, { onDelete: 'cascade' }),
  dailyAiRequests: integer('daily_ai_requests').notNull().default(100),
  monthlyAiRequests: integer('monthly_ai_requests').notNull().default(1000),
  dailyUsed: integer('daily_used').notNull().default(0),
  monthlyUsed: integer('monthly_used').notNull().default(0),
  resetDailyAt: timestamp('reset_daily_at', { withTimezone: true }).notNull(),
  resetMonthlyAt: timestamp('reset_monthly_at', { withTimezone: true }).notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// ---------------------------------------------------------------------------
// deletion_requests
// ---------------------------------------------------------------------------
export const deletionRequests = pgTable(
  'deletion_requests',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    requestedAt: timestamp('requested_at', { withTimezone: true }).notNull(),
    scheduledAt: timestamp('scheduled_at', { withTimezone: true }).notNull(),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    cancelledAt: timestamp('cancelled_at', { withTimezone: true }),
    reason: text('reason'),
    status: text('status').notNull().default('pending'),
  },
  (table) => ({
    userIdIdx: index('deletion_requests_user_id_idx').on(table.userId),
    statusIdx: index('deletion_requests_status_idx').on(table.status),
  }),
);

// ---------------------------------------------------------------------------
// oauth_accounts
// ---------------------------------------------------------------------------
export const oauthAccounts = pgTable(
  'oauth_accounts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    provider: text('provider').notNull(),
    providerAccountId: text('provider_account_id').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    uniqueProviderAccount: uniqueIndex('oauth_accounts_provider_account_idx').on(
      table.provider,
      table.providerAccountId,
    ),
    userIdIdx: index('oauth_accounts_user_id_idx').on(table.userId),
  }),
);

// ===========================================================================
// RELATIONS
// ===========================================================================

export const usersRelations = relations(users, ({ one, many }) => ({
  profile: one(userProfiles, {
    fields: [users.id],
    references: [userProfiles.userId],
  }),
  sessions: many(sessions),
  emailVerifications: many(emailVerifications),
  passwordResetTokens: many(passwordResetTokens),
  credentials: many(providerCredentials),
  usageRecords: many(usageRecords),
  quotaLimit: one(quotaLimits, {
    fields: [users.id],
    references: [quotaLimits.userId],
  }),
  deletionRequests: many(deletionRequests),
  oauthAccounts: many(oauthAccounts),
}));

export const oauthAccountsRelations = relations(oauthAccounts, ({ one }) => ({
  user: one(users, {
    fields: [oauthAccounts.userId],
    references: [users.id],
  }),
}));

export const userProfilesRelations = relations(userProfiles, ({ one }) => ({
  user: one(users, {
    fields: [userProfiles.userId],
    references: [users.id],
  }),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

export const emailVerificationsRelations = relations(emailVerifications, ({ one }) => ({
  user: one(users, {
    fields: [emailVerifications.userId],
    references: [users.id],
  }),
}));

export const passwordResetTokensRelations = relations(passwordResetTokens, ({ one }) => ({
  user: one(users, {
    fields: [passwordResetTokens.userId],
    references: [users.id],
  }),
}));

export const providerCredentialsRelations = relations(providerCredentials, ({ one, many }) => ({
  user: one(users, {
    fields: [providerCredentials.userId],
    references: [users.id],
  }),
  usageRecords: many(usageRecords),
}));

export const usageRecordsRelations = relations(usageRecords, ({ one }) => ({
  user: one(users, {
    fields: [usageRecords.userId],
    references: [users.id],
  }),
  credential: one(providerCredentials, {
    fields: [usageRecords.credentialId],
    references: [providerCredentials.id],
  }),
}));

export const quotaLimitsRelations = relations(quotaLimits, ({ one }) => ({
  user: one(users, {
    fields: [quotaLimits.userId],
    references: [users.id],
  }),
}));

export const deletionRequestsRelations = relations(deletionRequests, ({ one }) => ({
  user: one(users, {
    fields: [deletionRequests.userId],
    references: [users.id],
  }),
}));
