import PgBoss from 'pg-boss';
import nodemailer from 'nodemailer';
import type { SendEmailJob } from '@edi/shared';

type TemplateFn = (vars: Record<string, string>) => { subject: string; html: string };

const EMAIL_TEMPLATES: Record<string, TemplateFn> = {
  'email-verification': (vars) => ({
    subject: 'Verify your EDI account email',
    html: `
      <h2>Verify your email address</h2>
      <p>Click the link below to verify your email and activate your account:</p>
      <p><a href="${escHtml(vars['verificationUrl'] ?? '')}">Verify Email</a></p>
      <p>This link expires in ${escHtml(vars['expiresIn'] ?? '24 hours')}.</p>
      <p>If you did not create an EDI account, you can safely ignore this email.</p>
    `,
  }),

  'password-reset': (vars) => ({
    subject: 'Reset your EDI password',
    html: `
      <h2>Password Reset Request</h2>
      <p>Click below to choose a new password:</p>
      <p><a href="${escHtml(vars['resetUrl'] ?? '')}">Reset Password</a></p>
      <p>This link expires in ${escHtml(vars['expiresIn'] ?? '1 hour')}.</p>
      <p>If you did not request a password reset, no action is needed.</p>
    `,
  }),

  'credential-expiration-reminder': (vars) => ({
    subject: `API credential expiring in ${escHtml(vars['daysUntilExpiry'] ?? '')} day(s)`,
    html: `
      <h2>API Credential Expiring Soon</h2>
      <p>
        Your <strong>${escHtml(vars['provider'] ?? '')}</strong> credential
        "<em>${escHtml(vars['label'] ?? '')}</em>"
        (${escHtml(vars['maskedKey'] ?? '')})
        will expire in <strong>${escHtml(vars['daysUntilExpiry'] ?? '')} day(s)</strong>.
      </p>
      <p>Log in to EDI and update or replace this credential before it expires.</p>
    `,
  }),

  'deletion-requested': (vars) => ({
    subject: 'Your EDI account has been scheduled for deletion',
    html: `
      <h2>Account Deletion Scheduled</h2>
      <p>
        Your EDI account has been scheduled for permanent deletion on
        <strong>${escHtml(vars['scheduledDate'] ?? '')}</strong>.
      </p>
      <p>All your data will be permanently removed on that date.</p>
      <p>If you did not request this, please contact support immediately.</p>
    `,
  }),
};

/** Minimal HTML-escaping to prevent injection in email templates. */
function escHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function buildTransporter(): nodemailer.Transporter {
  const host = process.env.SMTP_HOST;
  if (!host) {
    throw new Error('SMTP_HOST is not configured');
  }
  const port = parseInt(process.env.SMTP_PORT ?? '587', 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: user && pass ? { user, pass } : undefined,
  });
}

export async function registerEmailHandler(boss: PgBoss): Promise<void> {
  await boss.work<SendEmailJob>('notification.send-email', async (jobs) => {
    for (const job of jobs) {
      await sendEmail(job.data);
    }
  });
}

async function sendEmail(data: SendEmailJob): Promise<void> {
  const { to, template, variables } = data;

  const templateFn = EMAIL_TEMPLATES[template];
  if (!templateFn) {
    // Unknown template — do not retry; log and discard.
    console.error(`Unknown email template "${template}" — discarding job.`);
    return;
  }

  let transporter: nodemailer.Transporter;
  try {
    transporter = buildTransporter();
  } catch (err) {
    // SMTP not configured — log and skip without failing the job.
    console.error('SMTP not configured; skipping email send:', (err as Error).message);
    return;
  }

  const from = process.env.SMTP_FROM ?? 'noreply@edi.app';
  const { subject, html } = templateFn(variables);

  await transporter.sendMail({ from, to, subject, html });

  // Deliberately redact `to` from logs to avoid PII in log sinks.
  console.log(`Email sent: template=${template}`);
}
