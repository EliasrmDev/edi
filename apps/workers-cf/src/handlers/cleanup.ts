import type { Sql } from '../db.js';

export async function cleanupExpiredSessions(sql: Sql): Promise<void> {
  const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const deletedSessions = await sql`
    DELETE FROM sessions
    WHERE expires_at <= ${cutoff}
      AND revoked_at IS NOT NULL
    RETURNING id
  `;
  const rows = deletedSessions as unknown as { id: string }[];
  console.log(`Cleaned up ${rows.length} expired+revoked sessions.`);
}

export async function cleanupOldLogs(
  sql: Sql,
  retentionDays: number,
): Promise<void> {
  const cutoff = new Date(
    Date.now() - retentionDays * 24 * 60 * 60 * 1000,
  ).toISOString();
  const deletedLogs = await sql`
    DELETE FROM audit_logs WHERE created_at <= ${cutoff} RETURNING id
  `;
  const rows2 = deletedLogs as unknown as { id: string }[];
  console.log(
    `Cleaned up ${rows2.length} audit log entries (older than ${retentionDays} days).`,
  );
}

// ---------------------------------------------------------------------------
// Credential hard-deletion — processes soft-deleted credentials older than
// 7 days (replaces the pg-boss `credential.deletion-workflow` deferred job).
// ---------------------------------------------------------------------------
interface CredentialRow {
  id: string;
  user_id: string;
}

export async function processCredentialDeletions(sql: Sql): Promise<void> {
  const cutoff = new Date(
    Date.now() - 7 * 24 * 60 * 60 * 1000,
  ).toISOString();

  const rawPending = await sql`
    SELECT id, user_id
    FROM provider_credentials
    WHERE deleted_at IS NOT NULL
      AND deleted_at <= ${cutoff}
      AND encrypted_key IS NOT NULL
  `;
  const pending = rawPending as unknown as CredentialRow[];

  let count = 0;
  for (const row of pending) {
    await executeCredentialDeletion(sql, row.id, row.user_id);
    count++;
  }
  if (count > 0) console.log(`Hard-deleted ${count} scheduled credentials.`);
}

async function executeCredentialDeletion(
  sql: Sql,
  credentialId: string,
  userId: string,
): Promise<void> {
  // Zero-fill encrypted key first to minimise key-exposure window
  await sql`
    UPDATE provider_credentials
    SET encrypted_key = repeat('0', length(encrypted_key)),
        updated_at    = NOW()
    WHERE id = ${credentialId} AND user_id = ${userId}
  `;
  await sql`
    DELETE FROM provider_credentials
    WHERE id = ${credentialId} AND user_id = ${userId}
  `;
}
