import { randomBytes, createCipheriv, createDecipheriv } from 'node:crypto';

const ALGORITHM = 'aes-256-gcm' as const;
/** Current schema version — increment if the EncryptedPayload structure changes. */
const CURRENT_VERSION = 1;
/** GCM produces a 16-byte authentication tag. */
const GCM_TAG_LENGTH = 16;

/**
 * Envelope encryption payload stored as a JSON string.
 * The DEK auth tag is concatenated onto encryptedDek before base64-encoding,
 * so encryptedDek = base64(cipherDEK || dekAuthTag).
 */
interface EncryptedPayload {
  /** Schema version for forward compatibility. */
  version: number;
  /** base64: encrypted DEK bytes + 16-byte GCM auth tag, encrypted with master key. */
  encryptedDek: string;
  /** base64: 12-byte IV used to encrypt the DEK. */
  dekIv: string;
  /** base64: encrypted content bytes, encrypted with the DEK. */
  ciphertext: string;
  /** base64: 12-byte IV used to encrypt the content. */
  contentIv: string;
  /** base64: 16-byte GCM auth tag for the content ciphertext. */
  authTag: string;
}

function getMasterKey(): Buffer {
  const hex = process.env.ENCRYPTION_MASTER_KEY;
  if (!hex) {
    throw new Error('ENCRYPTION_MASTER_KEY is not configured');
  }
  const key = Buffer.from(hex, 'hex');
  if (key.length !== 32) {
    throw new Error('ENCRYPTION_MASTER_KEY must be 32 bytes (64 hex characters)');
  }
  return key;
}

export class EncryptionService {
  /**
   * Encrypt a plaintext string using envelope encryption:
   * 1. Generate a random 32-byte DEK.
   * 2. Encrypt the DEK with the master key (AES-256-GCM).
   * 3. Encrypt the plaintext with the DEK (AES-256-GCM).
   * 4. Serialize everything as a JSON string for database storage.
   */
  async encrypt(plaintext: string): Promise<string> {
    const masterKey = getMasterKey();

    // --- Encrypt DEK with master key ---
    const dek = randomBytes(32);
    const dekIv = randomBytes(12);

    const dekCipher = createCipheriv(ALGORITHM, masterKey, dekIv, {
      authTagLength: GCM_TAG_LENGTH,
    });
    const encryptedDekBody = Buffer.concat([dekCipher.update(dek), dekCipher.final()]);
    const dekAuthTag = dekCipher.getAuthTag();
    // Append auth tag to ciphertext (16 bytes at end)
    const encryptedDek = Buffer.concat([encryptedDekBody, dekAuthTag]);

    // --- Encrypt content with DEK ---
    const contentIv = randomBytes(12);

    const contentCipher = createCipheriv(ALGORITHM, dek, contentIv, {
      authTagLength: GCM_TAG_LENGTH,
    });
    const ciphertext = Buffer.concat([
      contentCipher.update(plaintext, 'utf8'),
      contentCipher.final(),
    ]);
    const contentAuthTag = contentCipher.getAuthTag();

    const payload: EncryptedPayload = {
      version: CURRENT_VERSION,
      dekIv: dekIv.toString('base64'),
      encryptedDek: encryptedDek.toString('base64'),
      contentIv: contentIv.toString('base64'),
      ciphertext: ciphertext.toString('base64'),
      authTag: contentAuthTag.toString('base64'),
    };

    return JSON.stringify(payload);
  }

  /**
   * Decrypt a stored encrypted string produced by `encrypt`.
   * Validates both GCM auth tags (DEK and content).
   */
  async decrypt(stored: string): Promise<string> {
    const masterKey = getMasterKey();

    let payload: EncryptedPayload;
    try {
      payload = JSON.parse(stored) as EncryptedPayload;
    } catch {
      throw new Error('Invalid encrypted payload: not valid JSON');
    }

    if (payload.version !== CURRENT_VERSION) {
      throw new Error(`Unsupported encryption version: ${payload.version}`);
    }

    // --- Decrypt DEK ---
    const dekIv = Buffer.from(payload.dekIv, 'base64');
    const encryptedDekWithTag = Buffer.from(payload.encryptedDek, 'base64');

    // Last 16 bytes are the auth tag
    const encryptedDekBody = encryptedDekWithTag.subarray(
      0,
      encryptedDekWithTag.length - GCM_TAG_LENGTH,
    );
    const dekAuthTag = encryptedDekWithTag.subarray(
      encryptedDekWithTag.length - GCM_TAG_LENGTH,
    );

    const dekDecipher = createDecipheriv(ALGORITHM, masterKey, dekIv, {
      authTagLength: GCM_TAG_LENGTH,
    });
    dekDecipher.setAuthTag(dekAuthTag);
    const dek = Buffer.concat([dekDecipher.update(encryptedDekBody), dekDecipher.final()]);

    // --- Decrypt content ---
    const contentIv = Buffer.from(payload.contentIv, 'base64');
    const ciphertext = Buffer.from(payload.ciphertext, 'base64');
    const contentAuthTag = Buffer.from(payload.authTag, 'base64');

    const contentDecipher = createDecipheriv(ALGORITHM, dek, contentIv, {
      authTagLength: GCM_TAG_LENGTH,
    });
    contentDecipher.setAuthTag(contentAuthTag);
    const plaintext = Buffer.concat([
      contentDecipher.update(ciphertext),
      contentDecipher.final(),
    ]);

    return plaintext.toString('utf8');
  }

  /**
   * Mask an API key for display.
   * Returns '••••••' + last 6 characters of the key.
   */
  maskKey(rawKey: string): string {
    const last6 = rawKey.slice(-6);
    return '••••••' + last6;
  }

}

