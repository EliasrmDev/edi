// Uses the Web Crypto API (crypto.subtle) — works natively in CF Workers and Node.js ≥15.
// Node.js crypto stream APIs (createCipheriv/createDecipheriv) are NOT available in CF Workers
// even with nodejs_compat (unenv polyfills them as no-ops).

const ALGORITHM = 'AES-GCM';
/** Current schema version — increment if the EncryptedPayload structure changes. */
const CURRENT_VERSION = 1;
/** GCM produces a 16-byte authentication tag. */
const GCM_TAG_LENGTH = 16;

/**
 * Envelope encryption payload stored as a JSON string.
 * encryptedDek = base64(cipherDEK || dekAuthTag)  (Web Crypto appends tag automatically).
 * ciphertext and authTag are stored separately for the content layer.
 */
interface EncryptedPayload {
  version: number;
  /** base64: encrypted DEK bytes + 16-byte GCM auth tag. */
  encryptedDek: string;
  /** base64: 12-byte IV used to encrypt the DEK. */
  dekIv: string;
  /** base64: encrypted content bytes (without auth tag). */
  ciphertext: string;
  /** base64: 12-byte IV used to encrypt the content. */
  contentIv: string;
  /** base64: 16-byte GCM auth tag for the content ciphertext. */
  authTag: string;
}

async function getMasterKey(): Promise<CryptoKey> {
  const hex = process.env.ENCRYPTION_MASTER_KEY;
  if (!hex) throw new Error('ENCRYPTION_MASTER_KEY is not configured');
  const keyBytes = Buffer.from(hex, 'hex');
  if (keyBytes.length !== 32) {
    throw new Error('ENCRYPTION_MASTER_KEY must be 32 bytes (64 hex characters)');
  }
  return crypto.subtle.importKey('raw', keyBytes, { name: ALGORITHM }, false, [
    'encrypt',
    'decrypt',
  ]);
}

export class EncryptionService {
  /**
   * Encrypt a plaintext string using envelope encryption (Web Crypto / AES-256-GCM):
   * 1. Generate a random 32-byte DEK.
   * 2. Encrypt the DEK with the master key (AES-GCM).
   * 3. Encrypt the plaintext with the DEK (AES-GCM).
   * 4. Serialize everything as a JSON string for database storage.
   */
  async encrypt(plaintext: string): Promise<string> {
    const masterKey = await getMasterKey();

    // --- Generate and encrypt DEK ---
    const dekBytes = crypto.getRandomValues(new Uint8Array(32));
    const dekIv = crypto.getRandomValues(new Uint8Array(12));

    // Web Crypto encrypt returns ciphertext || authTag
    const encryptedDekWithTag = await crypto.subtle.encrypt(
      { name: ALGORITHM, iv: dekIv },
      masterKey,
      dekBytes,
    );

    // --- Import DEK as CryptoKey ---
    const dek = await crypto.subtle.importKey('raw', dekBytes, { name: ALGORITHM }, false, [
      'encrypt',
    ]);

    // --- Encrypt content with DEK ---
    const contentIv = crypto.getRandomValues(new Uint8Array(12));
    const encryptedContentWithTag = await crypto.subtle.encrypt(
      { name: ALGORITHM, iv: contentIv },
      dek,
      new TextEncoder().encode(plaintext),
    );

    // Split content ciphertext from auth tag (last 16 bytes)
    const encContent = Buffer.from(encryptedContentWithTag);
    const ciphertext = encContent.subarray(0, encContent.length - GCM_TAG_LENGTH);
    const contentAuthTag = encContent.subarray(encContent.length - GCM_TAG_LENGTH);

    const payload: EncryptedPayload = {
      version: CURRENT_VERSION,
      dekIv: Buffer.from(dekIv).toString('base64'),
      encryptedDek: Buffer.from(encryptedDekWithTag).toString('base64'),
      contentIv: Buffer.from(contentIv).toString('base64'),
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
    const masterKey = await getMasterKey();

    let payload: EncryptedPayload;
    try {
      payload = JSON.parse(stored) as EncryptedPayload;
    } catch {
      throw new Error('Invalid encrypted payload: not valid JSON');
    }

    if (payload.version !== CURRENT_VERSION) {
      throw new Error(`Unsupported encryption version: ${payload.version}`);
    }

    // --- Decrypt DEK (encryptedDek already includes auth tag at end) ---
    const dekIv = Buffer.from(payload.dekIv, 'base64');
    const encryptedDekWithTag = Buffer.from(payload.encryptedDek, 'base64');

    const dekBytes = await crypto.subtle.decrypt(
      { name: ALGORITHM, iv: dekIv },
      masterKey,
      encryptedDekWithTag,
    );

    const dek = await crypto.subtle.importKey('raw', dekBytes, { name: ALGORITHM }, false, [
      'decrypt',
    ]);

    // --- Decrypt content (concatenate ciphertext + authTag for Web Crypto) ---
    const contentIv = Buffer.from(payload.contentIv, 'base64');
    const ciphertext = Buffer.from(payload.ciphertext, 'base64');
    const authTag = Buffer.from(payload.authTag, 'base64');
    const ciphertextWithTag = Buffer.concat([ciphertext, authTag]);

    const plaintextBytes = await crypto.subtle.decrypt(
      { name: ALGORITHM, iv: contentIv },
      dek,
      ciphertextWithTag,
    );

    return new TextDecoder().decode(plaintextBytes);
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


