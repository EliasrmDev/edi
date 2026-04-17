import type { UserId } from './user';

export type CredentialId = string;
export type ProviderId = 'openai' | 'anthropic' | 'google-ai';
export type CredentialMode = 'byok' | 'managed';

export interface ProviderCredential {
  id: CredentialId;
  userId: UserId;
  provider: ProviderId;
  mode: CredentialMode;
  label: string;
  maskedKey: string;
  isActive: boolean;
  isExpired: boolean;
  expiresAt: Date | null;
  lastVerifiedAt: Date | null;
  lastUsedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CredentialSubmission {
  provider: ProviderId;
  rawKey: string;
  label: string;
  expiresAt?: Date;
}
