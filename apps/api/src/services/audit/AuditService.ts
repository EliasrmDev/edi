import { db } from '../../db/index.js';
import { auditLogs } from '../../db/schema.js';
import { hashIP, truncateUserAgent } from '../auth/TokenService.js';

interface AuditLogParams {
  userId: string | null;
  action: string;
  resourceType?: string;
  resourceId?: string;
  ipAddress?: string;
  userAgent?: string;
  outcome: 'success' | 'failure' | 'partial';
  metadata?: Record<string, unknown>;
}

/** Keywords whose values must be redacted from audit metadata. Case-insensitive substring match. */
const SENSITIVE_KEYS = ['password', 'token', 'secret', 'key', 'authorization', 'rawkey'];

export class AuditService {
  /**
   * Write an audit log entry.
   * - Redacts sensitive fields from metadata before storage.
   * - Hashes IP addresses.
   * - Truncates user agent strings.
   * - Never throws — audit failures must not break the main request flow.
   */
  async log(params: AuditLogParams): Promise<void> {
    try {
      const redactedMetadata = this.redactMetadata(params.metadata ?? {});

      await db.insert(auditLogs).values({
        userId: params.userId,
        action: params.action,
        resourceType: params.resourceType ?? null,
        resourceId: params.resourceId ?? null,
        ipAddressHash: params.ipAddress ? hashIP(params.ipAddress) : null,
        userAgentTruncated: truncateUserAgent(params.userAgent),
        outcome: params.outcome,
        metadata: redactedMetadata,
      });
    } catch (err) {
      // Audit must not break the application flow
      console.error(
        JSON.stringify({
          level: 'error',
          event: 'audit_log_failed',
          action: params.action,
          error: err instanceof Error ? err.message : String(err),
          timestamp: new Date().toISOString(),
        }),
      );
    }
  }

  /**
   * Recursively redact values whose key contains a sensitive keyword.
   * Also truncates string values to 500 characters.
   */
  private redactMetadata(metadata: Record<string, unknown>): Record<string, unknown> {
    const redactValue = (key: string, value: unknown): unknown => {
      const lowerKey = key.toLowerCase();

      if (SENSITIVE_KEYS.some((sensitive) => lowerKey.includes(sensitive))) {
        return '[REDACTED]';
      }

      if (typeof value === 'string') {
        return value.slice(0, 500);
      }

      if (Array.isArray(value)) {
        return value.map((item, i) => redactValue(String(i), item));
      }

      if (value !== null && typeof value === 'object') {
        return Object.fromEntries(
          Object.entries(value as Record<string, unknown>).map(([k, v]) => [
            k,
            redactValue(k, v),
          ]),
        );
      }

      return value;
    };

    return Object.fromEntries(
      Object.entries(metadata).map(([k, v]) => [k, redactValue(k, v)]),
    );
  }
}

// ---------------------------------------------------------------------------
// Backward-compatible function wrapper (used by auth/users routes)
// ---------------------------------------------------------------------------

const defaultAuditService = new AuditService();

/**
 * Module-level convenience wrapper around AuditService.log.
 * Preserves the original function signature used by auth/users routes.
 */
export async function writeAuditLog(params: AuditLogParams): Promise<void> {
  return defaultAuditService.log(params);
}
