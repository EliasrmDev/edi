import { createSql } from './db.js';
import {
  cleanupExpiredSessions,
  cleanupOldLogs,
  processCredentialDeletions,
  checkExpiringCredentials,
  processPendingDeletions,
  configureEmail,
} from './handlers/index.js';

export interface Env {
  DATABASE_URL: string;
  RESEND_API_KEY?: string;
  EMAIL_FROM?: string;
  /** Number of days to retain audit logs. Defaults to 90. */
  AUDIT_LOG_RETENTION_DAYS?: string;
}

// Cron schedules (must match wrangler.toml)
const CRON_EXPIRATION_CHECK = '0 8 * * *';
const CRON_USER_DELETION    = '0 4 * * *';
const CRON_SESSION_CLEANUP  = '0 2 * * *';
const CRON_LOG_CLEANUP      = '0 3 1 * *';

export default {
  async scheduled(event: ScheduledEvent, env: Env): Promise<void> {
    // Initialise per-invocation resources
    const sql = createSql(env.DATABASE_URL);
    configureEmail(env.RESEND_API_KEY, env.EMAIL_FROM);

    const retentionDays = parseInt(env.AUDIT_LOG_RETENTION_DAYS ?? '90', 10);

    switch (event.cron) {
      case CRON_EXPIRATION_CHECK:
        await checkExpiringCredentials(sql);
        // Also process any credentials due for hard-deletion (soft-deleted > 7d)
        await processCredentialDeletions(sql);
        break;

      case CRON_USER_DELETION:
        await processPendingDeletions(sql);
        break;

      case CRON_SESSION_CLEANUP:
        await cleanupExpiredSessions(sql);
        break;

      case CRON_LOG_CLEANUP:
        await cleanupOldLogs(sql, retentionDays);
        break;

      default:
        console.warn(`Unhandled cron trigger: ${event.cron}`);
    }
  },
};
