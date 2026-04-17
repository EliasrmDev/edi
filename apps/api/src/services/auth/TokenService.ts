import { randomBytes, createHash } from 'node:crypto';

/**
 * Generate a cryptographically secure random token.
 * @param bytes Number of random bytes (output is hex, so 2x length)
 */
export function generateToken(bytes = 32): string {
  return randomBytes(bytes).toString('hex');
}

/**
 * SHA-256 hash a token for database storage.
 * Tokens are NEVER stored raw — only their hash.
 */
export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/**
 * Hash an IP address for audit logs (one-way, salted with app secret).
 * Returns a truncated hash suitable for correlation without storing raw IPs.
 */
export function hashIP(ip: string): string {
  const salt = process.env.SESSION_SECRET ?? 'dev-salt';
  return createHash('sha256').update(salt + ip).digest('hex').slice(0, 16);
}

/**
 * Truncate user-agent string for audit storage.
 * Limits to 200 characters to prevent storage abuse.
 */
export function truncateUserAgent(ua: string | undefined): string | null {
  if (!ua) return null;
  return ua.slice(0, 200);
}
