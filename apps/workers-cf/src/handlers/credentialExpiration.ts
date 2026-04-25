import type { Sql } from '../db.js';
import { sendEmail, type EmailData } from './email.js';

interface CredentialRow {
  id: string;
  user_id: string;
  label: string;
  provider: string;
  masked_key: string;
  expires_at: string;
  reminder_sent_at: string | null;
}

interface UserEmailRow {
  email: string;
}

// ---------------------------------------------------------------------------
// Daily scan — find credentials expiring within 30 days and send reminders.
// Replaces pg-boss `credential.expiration-check` cron job.
// ---------------------------------------------------------------------------
export async function checkExpiringCredentials(sql: Sql): Promise<void> {
  const now = new Date();
  const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const rawRows = await sql`
    SELECT id, user_id, label, provider, masked_key, expires_at, reminder_sent_at
    FROM provider_credentials
    WHERE deleted_at IS NULL
      AND is_active = TRUE
      AND expires_at IS NOT NULL
      AND expires_at >= ${now.toISOString()}
      AND expires_at <= ${in30Days.toISOString()}
  `;
  const rows = rawRows as unknown as CredentialRow[];

  let dispatched = 0;
  for (const credential of rows) {
    const expiresAt = new Date(credential.expires_at);
    const msUntilExpiry = expiresAt.getTime() - now.getTime();
    const daysUntilExpiry = Math.ceil(msUntilExpiry / (1000 * 60 * 60 * 24));

    const thresholds = [30, 7, 1];
    const atThreshold = thresholds.some((t) => daysUntilExpiry <= t);
    const recentlySent =
      credential.reminder_sent_at !== null &&
      now.getTime() - new Date(credential.reminder_sent_at).getTime() <
        24 * 60 * 60 * 1000;

    if (atThreshold && !recentlySent) {
      await sendExpirationReminder(
        sql,
        credential,
        daysUntilExpiry,
      );
      dispatched++;
    }
  }

  console.log(
    `credential.expiration-check: ${rows.length} credentials scanned, ${dispatched} reminders dispatched.`,
  );
}

async function sendExpirationReminder(
  sql: Sql,
  credential: CredentialRow,
  daysUntilExpiry: number,
): Promise<void> {
  // Look up the user's email
  const rawRows2 = await sql`
    SELECT email FROM users WHERE id = ${credential.user_id} AND deleted_at IS NULL
  `;
  const users = rawRows2 as unknown as UserEmailRow[];
  const user = users[0];
  if (!user) return;

  const emailData: EmailData = {
    to: user.email,
    template: 'credential-expiration-reminder',
    variables: {
      provider: credential.provider,
      label: credential.label,
      maskedKey: credential.masked_key,
      daysUntilExpiry: String(daysUntilExpiry),
    },
  };

  await sendEmail(emailData);

  // Mark reminder sent
  await sql`
    UPDATE provider_credentials
    SET reminder_sent_at = NOW()
    WHERE id = ${credential.id}
  `;
}
