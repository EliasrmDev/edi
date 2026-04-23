import type { ProviderId } from '@edi/shared';
import type { DB } from '../../db/index.js';
import { providerCredentials } from '../../db/schema.js';
import { and, eq, isNull } from 'drizzle-orm';
import { AppError } from '../../middleware/errorHandler.js';
import type { EncryptionService } from '../crypto/EncryptionService.js';
import { fetchOpenAIModels } from './adapters/OpenAIModelAdapter.js';
import { fetchAnthropicModels } from './adapters/AnthropicModelAdapter.js';
import { fetchGoogleAIModels } from './adapters/GoogleAIModelAdapter.js';

export type { ModelInfo as ProviderModelInfo } from './adapters/OpenAIModelAdapter.js';

export interface ModelInfo {
  id: string;
  name: string;
  supportsVision: boolean;
  supportsStreaming: boolean;
  maxOutputTokens: number | null;
}

export class ModelFetcherService {
  constructor(
    private db: DB,
    private encryption: EncryptionService,
  ) {}

  /**
   * Fetch available models for a credential from the provider's API.
   * Decrypts the raw key in memory, calls the provider, returns the list.
   * The raw key is never returned to callers.
   */
  async fetchModels(credentialId: string, userId: string): Promise<ModelInfo[]> {
    // Load credential — validate ownership
    const rows = await this.db
      .select({
        id: providerCredentials.id,
        userId: providerCredentials.userId,
        provider: providerCredentials.provider,
        encryptedKey: providerCredentials.encryptedKey,
        isActive: providerCredentials.isActive,
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

    if (!row || row.userId !== userId) {
      throw new AppError('CREDENTIAL_NOT_FOUND', 'Credential not found', 404);
    }

    if (row.expiresAt !== null && row.expiresAt < new Date()) {
      throw new AppError('CREDENTIAL_EXPIRED', 'Credential has expired', 403);
    }

    // Decrypt raw key in memory — never returned to caller
    const rawKey = await this.encryption.decrypt(row.encryptedKey);

    try {
      return await this.callProviderAPI(row.provider as ProviderId, rawKey);
    } finally {
      // rawKey goes out of scope here
    }
  }

  private async callProviderAPI(provider: ProviderId, rawKey: string): Promise<ModelInfo[]> {
    switch (provider) {
      case 'openai':
        return fetchOpenAIModels(rawKey);
      case 'anthropic':
        return fetchAnthropicModels(rawKey);
      case 'google-ai':
        return fetchGoogleAIModels(rawKey);
      default: {
        const _exhaustive: never = provider;
        throw new AppError(
          'UNSUPPORTED_PROVIDER',
          `Model listing not supported for provider: ${String(_exhaustive)}`,
          400,
        );
      }
    }
  }
}
