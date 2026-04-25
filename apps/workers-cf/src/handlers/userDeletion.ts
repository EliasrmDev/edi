import type { Sql } from '../db.js';
import { sendEmail } from './email.js';

interface DeletionRequestRow {
  id: string;
  user_id: string;
  status: string;
}

interface UserEmailRow {
  email: string;
}

// ---------------------------------------------------------------------------
// Daily cron — scan for pending deletion requests past their scheduled date.
// Replaces the pg-boss `user.deletion-workflow` deferred job.
//
// A deletion request is created when the user requests account deletion;
// `scheduled_at` is set to NOW() + 30 days. This cron executes any request
// where scheduled_at <= NOW() and status = 'pending'.
// ---------------------------------------------------------------------------
export async function processPendingDeletions(sql: Sql): Promise<void> {
  const now = new Date().toISOString();

  const rawPending = await sql`
    SELECT id, user_id, status
    FROM deletion_requests
    WHERE status = 'pending'
      AND scheduled_at <= ${now}
  `;
  const pending = rawPending as unknown as DeletionRequestRow[];

  let completed = 0;
  for (const req of pending) {
    try {
      await executeUserDeletion(sql, req.id, req.user_id);
      completed++;
    } catch (err) {
      console.error(`Failed to delete user ${req.user_id}:`, err);
      // Leave status as 'pending' for the next run.
    }
  }

  console.log(
    `user.deletion-check: ${pending.length} pending, ${completed} processed.`,
  );
}

async function executeUserDeletion(
  sql: Sql,
  deletionRequestId: string,
  userId: string,
): Promise<void> {
  // Mark in-progress (idempotent guard)
  await sql`
    UPDATE deletion_requests SET status = 'processing' WHERE id = ${deletionRequestId}
  `;

  try {
    // Neon's tagged template driver doesn't expose traditional transactions,
    // so we batch operations sequentially. On failure we revert status.

    // 1. Revoke all active sessions
    await sql`
      UPDATE sessions
      SET revoked_at = NOW()
      WHERE user_id = ${userId} AND revoked_at IS NULL
    `;

    // 2. Hard-delete provider credentials (encrypted keys included)
    await sql`
      DELETE FROM provider_credentials WHERE user_id = ${userId}
    `;

    // 3. Delete usage records
    await sql`
      DELETE FROM usage_records WHERE user_id = ${userId}
    `;

    // 4. Anonymize audit log entries (user_id is nullable)
    await sql`
      UPDATE audit_logs SET user_id = NULL WHERE user_id = ${userId}
    `;

    // 5. Remove user profile
    await sql`
      DELETE FROM user_profiles WHERE user_id = ${userId}
    `;

    // 6. Soft-delete and anonymize the user row (GDPR erasure)
    await sql`
      UPDATE users
      SET deleted_at  = NOW(),
          email       = ${'deleted_' + userId + '@deleted.invalid'},
          password_hash = NULL,
          updated_at  = NOW()
      WHERE id = ${userId}
    `;

    // 7. Complete the deletion request
    await sql`
      UPDATE deletion_requests
      SET status = 'completed', completed_at = NOW()
      WHERE id = ${deletionRequestId}
    `;

    console.log(`User deletion completed for user ${userId}.`);
  } catch (err) {
    // Revert to pending so the next cron run retries
    await sql`
      UPDATE deletion_requests SET status = 'pending' WHERE id = ${deletionRequestId}
    `.catch(() => undefined);
    throw err;
  }
}

// ---------------------------------------------------------------------------
// Send deletion-scheduled email (called by the API when a request is created)
// ---------------------------------------------------------------------------
export async function sendDeletionScheduledEmail(
  sql: Sql,
  userId: string,
  scheduledAt: Date,
): Promise<void> {
  const rawUsers = await sql`
    SELECT email FROM users WHERE id = ${userId} AND deleted_at IS NULL
  `;
  const users = rawUsers as unknown as UserEmailRow[];
  const user = users[0];
  if (!user) return;

  await sendEmail({
    to: user.email,
    template: 'deletion-requested',
    variables: {
      scheduledDate: scheduledAt.toLocaleDateString('es-CR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
    },
  });
}
