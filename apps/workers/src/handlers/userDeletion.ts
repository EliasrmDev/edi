import PgBoss from 'pg-boss';
import { pool } from '../db';
import type { UserDeletionWorkflowJob } from '@edi/shared';

interface DeletionRequestRow {
  id: string;
  status: string;
}

export async function registerUserDeletionHandler(boss: PgBoss): Promise<void> {
  await boss.work<UserDeletionWorkflowJob>('user.deletion-workflow', async (jobs) => {
    for (const job of jobs) {
      await executeUserDeletion(job.data);
    }
  });

  // Data export stub — future implementation
  await boss.work('user.data-export', async (_jobs) => {
    console.log('User data export requested (not yet implemented).');
  });
}

async function executeUserDeletion(data: UserDeletionWorkflowJob): Promise<void> {
  const { userId } = data;

  // Find the active deletion request
  const reqResult = await pool.query<DeletionRequestRow>(
    `SELECT id, status
     FROM deletion_requests
     WHERE user_id = $1
       AND status IN ('pending', 'processing')
     ORDER BY requested_at DESC
     LIMIT 1`,
    [userId],
  );

  const deletionRequest = reqResult.rows[0];
  if (!deletionRequest) {
    console.warn(`No pending deletion request for user ${userId} — aborting.`);
    return;
  }

  // Mark in-progress (idempotent on retry)
  await pool.query(
    `UPDATE deletion_requests SET status = 'processing' WHERE id = $1`,
    [deletionRequest.id],
  );

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Revoke all active sessions
    await client.query(
      `UPDATE sessions SET revoked_at = NOW() WHERE user_id = $1 AND revoked_at IS NULL`,
      [userId],
    );

    // 2. Hard delete all provider credentials (encrypted keys included)
    await client.query(
      `DELETE FROM provider_credentials WHERE user_id = $1`,
      [userId],
    );

    // 3. Delete usage records (user_id column is NOT NULL — cannot anonymize in-place)
    await client.query(
      `DELETE FROM usage_records WHERE user_id = $1`,
      [userId],
    );

    // 4. Anonymize audit log entries (user_id is nullable in audit_logs)
    await client.query(
      `UPDATE audit_logs SET user_id = NULL WHERE user_id = $1`,
      [userId],
    );

    // 5. Remove user profile
    await client.query(
      `DELETE FROM user_profiles WHERE user_id = $1`,
      [userId],
    );

    // 6. Soft-delete and anonymize the user row (GDPR erasure)
    await client.query(
      `UPDATE users
       SET deleted_at = NOW(),
           email = $2,
           password_hash = NULL,
           updated_at = NOW()
       WHERE id = $1`,
      [userId, `deleted_${userId}@deleted.invalid`],
    );

    // 7. Mark deletion request completed
    await client.query(
      `UPDATE deletion_requests
       SET status = 'completed', completed_at = NOW()
       WHERE id = $1`,
      [deletionRequest.id],
    );

    await client.query('COMMIT');
    console.log(`User deletion workflow completed for user ${userId}.`);
  } catch (err) {
    await client.query('ROLLBACK');

    // Revert status so pg-boss can retry the job
    await pool.query(
      `UPDATE deletion_requests SET status = 'pending' WHERE id = $1`,
      [deletionRequest.id],
    );

    throw err;
  } finally {
    client.release();
  }
}
