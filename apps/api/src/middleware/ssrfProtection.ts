import { lookup } from 'node:dns/promises';

/**
 * Allowlist of provider hostnames that outbound AI calls may target.
 * All other hosts are rejected — no user-supplied URLs accepted.
 */
const ALLOWED_PROVIDER_HOSTS = new Set([
  'api.openai.com',
  'api.anthropic.com',
  'generativelanguage.googleapis.com',
]);

/**
 * Typed SSRF violation error.
 * Thrown by validateOutboundUrl when the URL fails a safety check.
 */
export class SSRFError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SSRFError';
  }
}

/**
 * Returns true if the given IPv4/IPv6 address is in a private, loopback,
 * link-local, or otherwise reserved range that must not be reachable from
 * the application server.
 */
export function isPrivateIP(ip: string): boolean {
  // IPv6 loopback (::1) and mapped IPv4 (::ffff:127.x.x.x)
  if (ip === '::1' || ip === '0:0:0:0:0:0:0:1') return true;
  // IPv6 link-local (fe80::/10)
  if (/^fe[89ab][0-9a-f]:/i.test(ip)) return true;
  // IPv6 unique local (fc00::/7)
  if (/^f[cd][0-9a-f]{2}:/i.test(ip)) return true;

  // Every other colon-containing address treated as non-private IPv6
  if (ip.includes(':')) return false;

  const parts = ip.split('.');
  if (parts.length !== 4) return true; // malformed → reject

  const a = parseInt(parts[0] ?? '0', 10);
  const b = parseInt(parts[1] ?? '0', 10);

  if (isNaN(a) || isNaN(b)) return true;

  return (
    a === 10 || // 10.0.0.0/8
    a === 127 || // 127.0.0.0/8 (loopback)
    a === 0 || // 0.0.0.0/8
    (a === 172 && b >= 16 && b <= 31) || // 172.16.0.0/12
    (a === 192 && b === 168) || // 192.168.0.0/16
    (a === 169 && b === 254) || // 169.254.0.0/16 (link-local / APIPA)
    (a === 100 && b >= 64 && b <= 127) || // 100.64.0.0/10 (carrier-grade NAT)
    a === 198 || // 198.18.0.0/15 (benchmarking)
    a === 240 || // 240.0.0.0/4 (reserved)
    (a === 255 && b === 255) // 255.255.255.255 (broadcast)
  );
}

/**
 * Validates that `url` is safe to use as an outbound AI provider call.
 *
 * Checks performed (in order):
 * 1. Must be a parseable URL
 * 2. Protocol must be `https:`
 * 3. Hostname must be in ALLOWED_PROVIDER_HOSTS
 * 4. DNS resolution must succeed and resolve to a non-private IP
 *
 * Used internally by ProviderAdapters — not HTTP middleware.
 * Throws {@link SSRFError} on any violation.
 */
export async function validateOutboundUrl(url: string): Promise<void> {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new SSRFError(`Invalid URL: ${url}`);
  }

  if (parsed.protocol !== 'https:') {
    throw new SSRFError(
      `Protocol not allowed: "${parsed.protocol}". Only https: is permitted for provider calls.`,
    );
  }

  const hostname = parsed.hostname;

  if (!ALLOWED_PROVIDER_HOSTS.has(hostname)) {
    throw new SSRFError(
      `Host "${hostname}" is not in the provider allowlist. ` +
        `Allowed: ${[...ALLOWED_PROVIDER_HOSTS].join(', ')}`,
    );
  }

  // Double-check resolved IP is not in a private/reserved range.
  // Protects against DNS rebinding attacks where a trusted hostname resolves
  // to a private IP after the allowlist check passes.
  let resolvedAddress: string;
  try {
    const result = await lookup(hostname, { family: 4 });
    resolvedAddress = result.address;
  } catch {
    // If DNS fails, block the request — we cannot guarantee it's safe.
    throw new SSRFError(`DNS resolution failed for "${hostname}"`);
  }

  if (isPrivateIP(resolvedAddress)) {
    throw new SSRFError(
      `Host "${hostname}" resolved to private/reserved IP "${resolvedAddress}". Request blocked.`,
    );
  }
}
