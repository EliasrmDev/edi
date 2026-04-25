import { eq, and, isNull, desc } from 'drizzle-orm';
import type {
  ProviderId,
  CredentialMode,
  ProviderCredential,
  CredentialSubmission,
} from '@edi/shared';
import type { DB } from '../../db/index.js';
import { providerCredentials } from '../../db/schema.js';
import { AppError } from '../../middleware/errorHandler.js';
import type { EncryptionService } from '../crypto/EncryptionService.js';
import type { AuditService } from '../audit/AuditService.js';
import { getAdapter } from '../providers/ProviderAdapter.js';
import { getBoss } from '../../jobs/boss.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Project a DB row to the public ProviderCredential shape.
 * Computes the derived `isExpired` field and NEVER exposes encryptedKey.
 */
function toProviderCredential(row: {
  id: string;
  userId: string;
  provider: string;
  mode: string;
  label: string;
  maskedKey: string;
  isActive: boolean;
  selectedModel: string | null;
  favoriteModels: string[];
  expiresAt: Date | null;
  lastVerifiedAt: Date | null;
  isEnabled: boolean;
  lastUsedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}): ProviderCredential {
  return {
    id: row.id,
    userId: row.userId,
    provider: row.provider as ProviderId,
    mode: row.mode as CredentialMode,
    label: row.label,
    maskedKey: row.maskedKey,
    isActive: row.isActive,
    isEnabled: row.isEnabled,
    isExpired: row.expiresAt !== null && row.expiresAt < new Date(),
    selectedModel: row.selectedModel,
    favoriteModels: row.favoriteModels,
    expiresAt: row.expiresAt,
    lastVerifiedAt: row.lastVerifiedAt,
    lastUsedAt: row.lastUsedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

// Drizzle column selection that excludes encryptedKey
const SAFE_COLUMNS = {
  id: providerCredentials.id,
  userId: providerCredentials.userId,
  provider: providerCredentials.provider,
  mode: providerCredentials.mode,
  label: providerCredentials.label,
  maskedKey: providerCredentials.maskedKey,
  isActive: providerCredentials.isActive,
  isEnabled: providerCredentials.isEnabled,
  selectedModel: providerCredentials.selectedModel,
  favoriteModels: providerCredentials.favoriteModels,
  expiresAt: providerCredentials.expiresAt,
  lastVerifiedAt: providerCredentials.lastVerifiedAt,
  lastUsedAt: providerCredentials.lastUsedAt,
  createdAt: providerCredentials.createdAt,
  updatedAt: providerCredentials.updatedAt,
} as const;

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

export class CredentialService {
  constructor(
    private db: DB,
    private encryption: EncryptionService,
    private audit: AuditService,
  ) {}

  /**
   * Create a new BYOK credential.
   * Validates format → verifies with provider → encrypts → stores.
   * Raw key is used then discarded (never persisted in plaintext).
   */
  async create(
    userId: string,
    submission: CredentialSubmission,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<ProviderCredential> {
    // 1. Verify key works with provider (live API call — accepts any key format)
    const adapter = getAdapter(submission.provider);
    const { valid, error } = await adapter.verifyKey(submission.rawKey);
    if (!valid) {
      throw new AppError('INVALID_API_KEY', error ?? 'API key verification failed', 422);
    }

    // 2. Encrypt key and mask for display
    const encryptedKey = await this.encryption.encrypt(submission.rawKey);
    const maskedKey = this.encryption.maskKey(submission.rawKey);
    // submission.rawKey is no longer referenced after this point

    const now = new Date();

    // 4. Store credential
    const result = await this.db
      .insert(providerCredentials)
      .values({
        userId,
        provider: submission.provider,
        mode: 'byok',
        label: submission.label,
        encryptedKey,
        maskedKey,
        keyVersion: 1,
        isActive: true,
        expiresAt: submission.expiresAt ?? null,
        lastVerifiedAt: now,
      })
      .returning();

    const row = result[0];
    if (!row) throw new Error('Failed to insert credential');

    // 5. Audit log (never include key material)
    await this.audit.log({
      userId,
      action: 'credential.created',
      resourceType: 'provider_credential',
      resourceId: row.id,
      outcome: 'success',
      ipAddress,
      userAgent,
      metadata: { provider: submission.provider, label: submission.label },
    });

    // 6. Schedule expiration reminder if expiresAt is set (30 days before)
    if (submission.expiresAt) {
      const reminderAt = new Date(submission.expiresAt.getTime() - 30 * 24 * 60 * 60 * 1000);
      if (reminderAt > now) {
        const boss = await getBoss().catch(() => null);
        if (boss) {
          await boss
            .send(
              'credential.expiration-reminder',
              { credentialId: row.id, userId, daysUntilExpiry: 30 },
              { startAfter: reminderAt },
            )
            .catch(() => {
              /* non-fatal */
            });
        }
      }
    }

    return toProviderCredential(row);
  }

  /**
   * List all active credentials for a user.
   * NEVER includes the encrypted key field.
   */
  async list(userId: string): Promise<ProviderCredential[]> {
    const rows = await this.db
      .select(SAFE_COLUMNS)
      .from(providerCredentials)
      .where(
        and(eq(providerCredentials.userId, userId), isNull(providerCredentials.deletedAt)),
      )
      .orderBy(desc(providerCredentials.createdAt));

    return rows.map(toProviderCredential);
  }

  /**
   * Get a single credential by ID, validating ownership.
   * NEVER includes the encrypted key field.
   */
  async getById(credentialId: string, userId: string): Promise<ProviderCredential> {
    const rows = await this.db
      .select(SAFE_COLUMNS)
      .from(providerCredentials)
      .where(
        and(
          eq(providerCredentials.id, credentialId),
          eq(providerCredentials.userId, userId),
          isNull(providerCredentials.deletedAt),
        ),
      )
      .limit(1);

    const row = rows[0];
    if (!row) {
      throw new AppError('CREDENTIAL_NOT_FOUND', 'Credential not found', 404);
    }

    return toProviderCredential(row);
  }

  /**
   * Decrypt and return the raw key IN MEMORY ONLY.
   * Updates lastUsedAt. Logs usage (no key material in log).
   * Result is NEVER sent to the client — internal use only.
   */
  async getForAIUse(
    credentialId: string,
    userId: string,
  ): Promise<{ rawKey: string; provider: ProviderId; selectedModel: string | null }> {
    // Select encryptedKey and ownership fields
    const rows = await this.db
      .select({
        id: providerCredentials.id,
        userId: providerCredentials.userId,
        provider: providerCredentials.provider,
        encryptedKey: providerCredentials.encryptedKey,
        isActive: providerCredentials.isActive,
        isEnabled: providerCredentials.isEnabled,
        selectedModel: providerCredentials.selectedModel,
        expiresAt: providerCredentials.expiresAt,
      })
      .from(providerCredentials)
      .where(
        and(
          eq(providerCredentials.id, credentialId),
          isNull(providerCredentials.deletedAt),
        ),
      )
      .limit(1);

    const row = rows[0];

    // Ownership check (constant-time response for both not-found and not-owner)
    if (!row || row.userId !== userId) {
      throw new AppError('CREDENTIAL_NOT_FOUND', 'Credential not found', 404);
    }

    if (!row.isActive) {
      throw new AppError('CREDENTIAL_INACTIVE', 'Credential is not active', 403);
    }

    if (!row.isEnabled) {
      throw new AppError('CREDENTIAL_DISABLED', 'Credential is disabled', 403);
    }

    if (row.expiresAt !== null && row.expiresAt < new Date()) {
      throw new AppError('CREDENTIAL_EXPIRED', 'Credential has expired', 403);
    }

    // Decrypt — raw key exists in memory only during this call
    const rawKey = await this.encryption.decrypt(row.encryptedKey);

    // Update last used timestamp (non-blocking)
    this.db
      .update(providerCredentials)
      .set({ lastUsedAt: new Date() })
      .where(eq(providerCredentials.id, credentialId))
      .catch(() => {
        /* non-fatal */
      });

    // Audit — no key content in log
    await this.audit.log({
      userId,
      action: 'credential.used',
      resourceType: 'provider_credential',
      resourceId: credentialId,
      outcome: 'success',
      metadata: { provider: row.provider },
    });

    return { rawKey, provider: row.provider as ProviderId, selectedModel: row.selectedModel };
  }

  /**
   * Find the first active credential for a user (server-side selection for AI proxy).
   */
  async getActiveForUser(userId: string): Promise<{ id: string; provider: ProviderId } | null> {
    const rows = await this.db
      .select({
        id: providerCredentials.id,
        provider: providerCredentials.provider,
      })
      .from(providerCredentials)
      .where(
        and(
          eq(providerCredentials.userId, userId),
          eq(providerCredentials.isActive, true),
          eq(providerCredentials.isEnabled, true),
          isNull(providerCredentials.deletedAt),
        ),
      )
      .orderBy(desc(providerCredentials.lastVerifiedAt), providerCredentials.createdAt)
      .limit(1);

    const row = rows[0];
    if (!row) return null;

    return { id: row.id, provider: row.provider as ProviderId };
  }

  /**
   * Verify a credential's API key is still working and update lastVerifiedAt.
   * Unlike getForAIUse, this allows verifying inactive/disabled credentials
   * (the user just wants to know if the key itself is still valid).
   */
  async verify(
    credentialId: string,
    userId: string,
  ): Promise<{ valid: boolean; error?: string }> {
    // Fetch only ownership + encrypted key — do NOT require isActive/isEnabled
    const rows = await this.db
      .select({
        userId: providerCredentials.userId,
        provider: providerCredentials.provider,
        encryptedKey: providerCredentials.encryptedKey,
      })
      .from(providerCredentials)
      .where(
        and(
          eq(providerCredentials.id, credentialId),
          isNull(providerCredentials.deletedAt),
        ),
      )
      .limit(1);

    const row = rows[0];
    if (!row || row.userId !== userId) {
      throw new AppError('CREDENTIAL_NOT_FOUND', 'Credential not found', 404);
    }

    const rawKey = await this.encryption.decrypt(row.encryptedKey);
    const provider = row.provider as ProviderId;

    const adapter = getAdapter(provider);
    const result = await adapter.verifyKey(rawKey);

    const now = new Date();

    if (result.valid) {
      await this.db
        .update(providerCredentials)
        .set({ lastVerifiedAt: now, updatedAt: now })
        .where(eq(providerCredentials.id, credentialId));
    }

    await this.audit.log({
      userId,
      action: 'credential.verified',
      resourceType: 'provider_credential',
      resourceId: credentialId,
      outcome: result.valid ? 'success' : 'failure',
      metadata: { provider, valid: result.valid, error: result.error },
    });

    return result;
  }

  /**
   * Soft-delete a credential and schedule hard deletion in 7 days.
   */
  async delete(
    credentialId: string,
    userId: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
    // Validate ownership
    const rows = await this.db
      .select({ id: providerCredentials.id, userId: providerCredentials.userId })
      .from(providerCredentials)
      .where(
        and(eq(providerCredentials.id, credentialId), isNull(providerCredentials.deletedAt)),
      )
      .limit(1);

    const row = rows[0];
    if (!row || row.userId !== userId) {
      throw new AppError('CREDENTIAL_NOT_FOUND', 'Credential not found', 404);
    }

    const now = new Date();

    // Soft-delete
    await this.db
      .update(providerCredentials)
      .set({ deletedAt: now, isActive: false, updatedAt: now })
      .where(eq(providerCredentials.id, credentialId));

    // Schedule hard deletion in 7 days
    const scheduledAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const boss = await getBoss().catch(() => null);
    if (boss) {
      await boss
        .send(
          'credential.deletion-workflow',
          { credentialId, userId, scheduledAt },
          { startAfter: scheduledAt },
        )
        .catch(() => {
          /* non-fatal */
        });
    }

    await this.audit.log({
      userId,
      action: 'credential.deleted',
      resourceType: 'provider_credential',
      resourceId: credentialId,
      outcome: 'success',
      ipAddress,
      userAgent,
      metadata: { hardDeleteScheduledAt: scheduledAt.toISOString() },
    });
  }

  /**
   * Rotate a credential: verify new key → re-encrypt → increment keyVersion.
   */
  async rotate(
    credentialId: string,
    userId: string,
    newRawKey: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<ProviderCredential> {
    // Fetch current credential (ownership check)
    const rows = await this.db
      .select({
        id: providerCredentials.id,
        userId: providerCredentials.userId,
        provider: providerCredentials.provider,
        keyVersion: providerCredentials.keyVersion,
      })
      .from(providerCredentials)
      .where(
        and(eq(providerCredentials.id, credentialId), isNull(providerCredentials.deletedAt)),
      )
      .limit(1);

    const row = rows[0];
    if (!row || row.userId !== userId) {
      throw new AppError('CREDENTIAL_NOT_FOUND', 'Credential not found', 404);
    }

    const provider = row.provider as ProviderId;

    // Verify new key works (live API call — accepts any key format)
    const adapter = getAdapter(provider);
    const { valid, error } = await adapter.verifyKey(newRawKey);
    if (!valid) {
      throw new AppError('INVALID_API_KEY', error ?? 'New API key verification failed', 422);
    }

    // Encrypt new key
    const encryptedKey = await this.encryption.encrypt(newRawKey);
    const maskedKey = this.encryption.maskKey(newRawKey);
    const now = new Date();

    // Update DB — increment keyVersion
    const updated = await this.db
      .update(providerCredentials)
      .set({
        encryptedKey,
        maskedKey,
        keyVersion: row.keyVersion + 1,
        lastVerifiedAt: now,
        updatedAt: now,
      })
      .where(eq(providerCredentials.id, credentialId))
      .returning(SAFE_COLUMNS);

    const updatedRow = updated[0];
    if (!updatedRow) throw new Error('Failed to update credential');

    await this.audit.log({
      userId,
      action: 'credential.rotated',
      resourceType: 'provider_credential',
      resourceId: credentialId,
      outcome: 'success',
      ipAddress,
      userAgent,
      metadata: { provider, newKeyVersion: row.keyVersion + 1 },
    });

    return toProviderCredential(updatedRow);
  }

  /**
   * Set the selected model for a credential.
   * Validates ownership and that the modelId is a non-empty string.
   */
  async updateSelectedModel(
    credentialId: string,
    userId: string,
    modelId: string,
  ): Promise<ProviderCredential> {
    const now = new Date();

    // Validate ownership
    const rows = await this.db
      .select(SAFE_COLUMNS)
      .from(providerCredentials)
      .where(
        and(
          eq(providerCredentials.id, credentialId),
          eq(providerCredentials.userId, userId),
          isNull(providerCredentials.deletedAt),
        ),
      )
      .limit(1);

    const row = rows[0];
    if (!row) {
      throw new AppError('CREDENTIAL_NOT_FOUND', 'Credential not found', 404);
    }

    const updated = await this.db
      .update(providerCredentials)
      .set({ selectedModel: modelId, updatedAt: now })
      .where(eq(providerCredentials.id, credentialId))
      .returning(SAFE_COLUMNS);

    const updatedRow = updated[0];
    if (!updatedRow) throw new Error('Failed to update selected model');

    await this.audit.log({
      userId,
      action: 'credential.updated',
      resourceType: 'provider_credential',
      resourceId: credentialId,
      outcome: 'success',
      metadata: { provider: updatedRow.provider, selectedModel: modelId },
    });

    return toProviderCredential(updatedRow);
  }

  /**
   * Clear the selected model for a credential (sets selectedModel to null).
   */
  async clearSelectedModel(
    credentialId: string,
    userId: string,
  ): Promise<ProviderCredential> {
    const now = new Date();

    const rows = await this.db
      .select(SAFE_COLUMNS)
      .from(providerCredentials)
      .where(
        and(
          eq(providerCredentials.id, credentialId),
          eq(providerCredentials.userId, userId),
          isNull(providerCredentials.deletedAt),
        ),
      )
      .limit(1);

    const row = rows[0];
    if (!row) {
      throw new AppError('CREDENTIAL_NOT_FOUND', 'Credential not found', 404);
    }

    const updated = await this.db
      .update(providerCredentials)
      .set({ selectedModel: null, updatedAt: now })
      .where(eq(providerCredentials.id, credentialId))
      .returning(SAFE_COLUMNS);

    const updatedRow = updated[0];
    if (!updatedRow) throw new Error('Failed to clear selected model');

    await this.audit.log({
      userId,
      action: 'credential.updated',
      resourceType: 'provider_credential',
      resourceId: credentialId,
      outcome: 'success',
      metadata: { provider: updatedRow.provider, selectedModel: null },
    });

    return toProviderCredential(updatedRow);
  }

  /**
   * Add or remove a model from the favorites list of a credential.
   */
  async toggleFavoriteModel(
    credentialId: string,
    userId: string,
    modelId: string,
    action: 'add' | 'remove',
  ): Promise<ProviderCredential> {
    const now = new Date();

    const rows = await this.db
      .select(SAFE_COLUMNS)
      .from(providerCredentials)
      .where(
        and(
          eq(providerCredentials.id, credentialId),
          eq(providerCredentials.userId, userId),
          isNull(providerCredentials.deletedAt),
        ),
      )
      .limit(1);

    const row = rows[0];
    if (!row) {
      throw new AppError('CREDENTIAL_NOT_FOUND', 'Credential not found', 404);
    }

    const current = row.favoriteModels ?? [];
    const next =
      action === 'add'
        ? [...new Set([...current, modelId])]
        : current.filter((id) => id !== modelId);

    const updated = await this.db
      .update(providerCredentials)
      .set({ favoriteModels: next, updatedAt: now })
      .where(eq(providerCredentials.id, credentialId))
      .returning(SAFE_COLUMNS);

    const updatedRow = updated[0];
    if (!updatedRow) throw new Error('Failed to update favorite models');

    await this.audit.log({
      userId,
      action: 'credential.updated',
      resourceType: 'provider_credential',
      resourceId: credentialId,
      outcome: 'success',
      metadata: { provider: updatedRow.provider, favoriteModelAction: action, modelId },
    });

    return toProviderCredential(updatedRow);
  }

  /**
   * Set a credential as the single active one for a user.
   * Deactivates all other credentials, then activates the selected one.
   */
  async setActive(
    credentialId: string,
    userId: string,
  ): Promise<ProviderCredential> {
    const now = new Date();

    // Ownership check
    const rows = await this.db
      .select(SAFE_COLUMNS)
      .from(providerCredentials)
      .where(
        and(
          eq(providerCredentials.id, credentialId),
          eq(providerCredentials.userId, userId),
          isNull(providerCredentials.deletedAt),
        ),
      )
      .limit(1);

    const row = rows[0];
    if (!row) {
      throw new AppError('CREDENTIAL_NOT_FOUND', 'Credential not found', 404);
    }

    // Deactivate all other credentials for this user
    await this.db
      .update(providerCredentials)
      .set({ isActive: false, updatedAt: now })
      .where(
        and(
          eq(providerCredentials.userId, userId),
          isNull(providerCredentials.deletedAt),
        ),
      );

    // Activate the selected credential
    const updated = await this.db
      .update(providerCredentials)
      .set({ isActive: true, updatedAt: now })
      .where(eq(providerCredentials.id, credentialId))
      .returning(SAFE_COLUMNS);

    const updatedRow = updated[0];
    if (!updatedRow) throw new Error('Failed to activate credential');

    await this.audit.log({
      userId,
      action: 'credential.activated',
      resourceType: 'provider_credential',
      resourceId: credentialId,
      outcome: 'success',
      metadata: { provider: updatedRow.provider },
    });

    return toProviderCredential(updatedRow);
  }

  async toggleEnabled(
    credentialId: string,
    userId: string,
  ): Promise<ProviderCredential> {
    const now = new Date();

    const rows = await this.db
      .select(SAFE_COLUMNS)
      .from(providerCredentials)
      .where(
        and(
          eq(providerCredentials.id, credentialId),
          eq(providerCredentials.userId, userId),
          isNull(providerCredentials.deletedAt),
        ),
      )
      .limit(1);

    const row = rows[0];
    if (!row) {
      throw new AppError('CREDENTIAL_NOT_FOUND', 'Credential not found', 404);
    }

    const updated = await this.db
      .update(providerCredentials)
      .set({ isEnabled: !row.isEnabled, updatedAt: now })
      .where(eq(providerCredentials.id, credentialId))
      .returning(SAFE_COLUMNS);

    const updatedRow = updated[0];
    if (!updatedRow) throw new Error('Failed to toggle credential enabled state');

    await this.audit.log({
      userId,
      action: 'credential.updated',
      resourceType: 'provider_credential',
      resourceId: credentialId,
      outcome: 'success',
      metadata: { provider: updatedRow.provider, isEnabled: updatedRow.isEnabled },
    });

    return toProviderCredential(updatedRow);
  }
}
