import { hash, verify } from '@node-rs/argon2';
import { AppError } from '../../middleware/errorHandler.js';

/**
 * Argon2id parameters — OWASP recommended:
 * memoryCost: 65536 KB (64 MB), timeCost: 3 iterations, parallelism: 4 threads
 */
const ARGON2_OPTIONS = {
  memoryCost: 65536,
  timeCost: 3,
  parallelism: 4,
} as const;

const MIN_PASSWORD_LENGTH = 12;
const MAX_PASSWORD_LENGTH = 128;

/**
 * Very common passwords to reject (top entries).
 * In production, consider a larger dictionary or HaveIBeenPwned API.
 */
const COMMON_PASSWORDS = new Set([
  'password1234',
  '123456789012',
  'qwerty123456',
  'admin1234567',
  'letmein12345',
  'welcome12345',
  'password1234!',
]);

/**
 * Validate password strength before hashing.
 * Requirements:
 * - 12–128 characters
 * - Not a common password
 * - Not containing the user's email
 */
export function validatePasswordStrength(password: string, email?: string): void {
  if (password.length < MIN_PASSWORD_LENGTH) {
    throw new AppError(
      'PASSWORD_TOO_SHORT',
      `Password must be at least ${MIN_PASSWORD_LENGTH} characters`,
      422,
    );
  }

  if (password.length > MAX_PASSWORD_LENGTH) {
    throw new AppError(
      'PASSWORD_TOO_LONG',
      `Password must be at most ${MAX_PASSWORD_LENGTH} characters`,
      422,
    );
  }

  if (COMMON_PASSWORDS.has(password.toLowerCase())) {
    throw new AppError(
      'PASSWORD_TOO_COMMON',
      'This password is too common. Choose a stronger password.',
      422,
    );
  }

  if (email) {
    const emailLocal = email.split('@')[0]?.toLowerCase() ?? '';
    if (emailLocal.length >= 4 && password.toLowerCase().includes(emailLocal)) {
      throw new AppError(
        'PASSWORD_CONTAINS_EMAIL',
        'Password must not contain your email address',
        422,
      );
    }
  }
}

/**
 * Hash a password with Argon2id.
 * The plain-text password is not retained after this call.
 */
export async function hashPassword(password: string): Promise<string> {
  return hash(password, ARGON2_OPTIONS);
}

/**
 * Verify a password against its Argon2id hash.
 * Returns true if the password matches, false otherwise.
 */
export async function verifyPassword(
  hashedPassword: string,
  candidatePassword: string,
): Promise<boolean> {
  try {
    return await verify(hashedPassword, candidatePassword, ARGON2_OPTIONS);
  } catch {
    return false;
  }
}
