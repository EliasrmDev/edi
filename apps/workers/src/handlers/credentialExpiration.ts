import PgBoss from 'pg-boss';
import { pool } from '../db';
import type { CredentialExpirationReminderJob } from '@edi/shared';

interface CredentialRow {
  id: string;
  user_id: string;
  label: string;
  provider: string;
  masked_key: string;
  expires_at: Date;
  reminder_sent_at: Date | null;
}

interface UserEmailRow {
  email: string;
}

export async function registerCredentialExpirationHandler(boss: PgBoss): Promise<void> {
  // Scheduled scan: find all credentials expiring in the next 30 days
  await boss.work('credential.expiration-check', async (_jobs) => {
    await checkExpiringCredentials(boss);
  });

  // Individual reminder: look up user and enqueue the notification email
  await boss.work<CredentialExpirationReminderJob>(
    'credential.expiration-reminder',
    async (jobs) => {
      for (const job of jobs) {
        await sendExpirationReminder(boss, job.data);
      }
    },
  );

  // Rotation reminder (stub — future implementation)
  await boss.work('credential.rotation-reminder', async (_jobs) => {
    console.log('Credential rotation reminder received (not yet implemented).');
  });
}

async function checkExpiringCredentials(boss: PgBoss): Promise<void> {
  const now = new Date();
  const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const { rows } = await pool.query<CredentialRow>(
    `SELECT id, user_id, label, provider, masked_key, expires_at, reminder_sent_at
     FROM provider_credentials
     WHERE deleted_at IS NULL
       AND is_active = true
       AND expires_at IS NOT NULL
       AND expires_at >= $1
       AND expires_at <= $2`,
    [now.toISOString(), in30Days.toISOString()],
  );

  let dispatched = 0;
  for (const credential of rows) {
    const msUntilExpiry = credential.expires_at.getTime() - now.getTime();
    const daysUntilExpiry = Math.ceil(msUntilExpiry / (1000 * 60 * 60 * 24));

    // Send reminder at 30, 7, and 1-day thresholds; suppress if already sent
    // within the last 24 hours to avoid duplicate emails on re-runs.
    const thresholds = [30, 7, 1];
    const atThreshold = thresholds.some((t) => daysUntilExpiry <= t);
    const recentlySent =
      credential.reminder_sent_at !== null &&
      now.getTime() - credential.reminder_sent_at.getTime() < 24 * 60 * 60 * 1000;

    if (atThreshold && !recentlySent) {
      const jobData: CredentialExpirationReminderJob = {
        credentialId: credential.id,
        userId: credential.user_id,
        daysUntilExpiry,
      };
      await boss.send('credential.expiration-reminder', jobData as unknown as Record<string, unknown>);
      dispatched++;
    }
  }

  console.log(
    `Credential expiration check done. Scanned ${rows.length}, dispatched ${dispatched} reminders.`,
  );
}

async function sendExpirationReminder(
  boss: PgBoss,
  data: CredentialExpirationReminderJob,
): Promise<void> {
  const { credentialId, userId, daysUntilExpiry } = data;

  const credResult = await pool.query<CredentialRow>(
    `SELECT id, user_id, label, provider, masked_key, expires_at, reminder_sent_at
     FROM provider_credentials
     WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL`,
    [credentialId, userId],
  );

  const credential = credResult.rows[0];
  if (!credential) {
    console.warn(`Credential ${credentialId} not found or deleted — skipping reminder.`);
    return;
  }

  const userResult = await pool.query<UserEmailRow>(
    `SELECT email FROM users WHERE id = $1 AND deleted_at IS NULL`,
    [userId],
  );

  const user = userResult.rows[0];
  if (!user) {
    console.warn(`User ${userId} not found or deleted — skipping credential reminder.`);
    return;
  }

  await boss.send('notification.send-email', {
    to: user.email,
    template: 'credential-expiration-reminder',
    variables: {
      provider: credential.provider,
      label: credential.label,
      maskedKey: credential.masked_key,
      daysUntilExpiry: String(daysUntilExpiry),
    },
  });

  await pool.query(
    `UPDATE provider_credentials SET reminder_sent_at = NOW() WHERE id = $1`,
    [credentialId],
  );

  console.log(
    `Dispatched expiration reminder for credential ${credentialId} (${daysUntilExpiry}d remaining).`,
  );
}
