import PgBoss from 'pg-boss';
import { pool } from '../db';
import type { CredentialDeletionWorkflowJob } from '@edi/shared';

interface CredentialExistsRow {
  id: string;
}

export async function registerCleanupHandlers(boss: PgBoss): Promise<void> {
  // Remove expired sessions that are also revoked (no longer needed for audit)
  await boss.work('cleanup.expired-sessions', async (_jobs) => {
    const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const result = await pool.query(
      `DELETE FROM sessions
       WHERE expires_at <= $1
         AND revoked_at IS NOT NULL`,
      [cutoff.toISOString()],
    );
    console.log(`Cleaned up ${result.rowCount ?? 0} expired+revoked sessions.`);
  });

  // Purge audit logs older than the configured retention window
  await boss.work('cleanup.old-logs', async (_jobs) => {
    const retentionDays = parseInt(process.env.AUDIT_LOG_RETENTION_DAYS ?? '90', 10);
    const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);
    const result = await pool.query(
      `DELETE FROM audit_logs WHERE created_at <= $1`,
      [cutoff.toISOString()],
    );
    console.log(
      `Cleaned up ${result.rowCount ?? 0} audit log entries (older than ${retentionDays} days).`,
    );
  });

  // Securely wipe and hard-delete a specific credential
  await boss.work<CredentialDeletionWorkflowJob>(
    'credential.deletion-workflow',
    async (jobs) => {
      for (const job of jobs) {
        await executeCredentialDeletion(job.data);
      }
    },
  );
}

async function executeCredentialDeletion(data: CredentialDeletionWorkflowJob): Promise<void> {
  const { credentialId, userId } = data;

  // Idempotency check — skip if already deleted
  const check = await pool.query<CredentialExistsRow>(
    `SELECT id FROM provider_credentials WHERE id = $1 AND user_id = $2`,
    [credentialId, userId],
  );

  if ((check.rowCount ?? 0) === 0) {
    console.log(`Credential ${credentialId} already deleted — skipping.`);
    return;
  }

  // Zero-fill the encrypted key before deletion to reduce key-exposure window
  await pool.query(
    `UPDATE provider_credentials
     SET encrypted_key = 'DELETED',
         masked_key = '[deleted]',
         is_active = false,
         updated_at = NOW()
     WHERE id = $1 AND user_id = $2`,
    [credentialId, userId],
  );

  await pool.query(
    `DELETE FROM provider_credentials WHERE id = $1 AND user_id = $2`,
    [credentialId, userId],
  );

  console.log(`Credential ${credentialId} securely deleted for user ${userId}.`);
}
