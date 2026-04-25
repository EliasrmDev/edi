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

export interface EmailData {
  to: string;
  template: string;
  variables: Record<string, string>;
}

// Resend API key and sender address — populated from wrangler bindings.
let _resendApiKey: string | undefined;
let _emailFrom: string | undefined;

export function configureEmail(apiKey?: string, from?: string): void {
  _resendApiKey = apiKey;
  _emailFrom = from;
}

export async function sendEmail(data: EmailData): Promise<void> {
  if (!_resendApiKey) {
    console.warn('RESEND_API_KEY not configured — skipping email send.');
    return;
  }

  const templateFn = EMAIL_TEMPLATES[data.template];
  if (!templateFn) {
    console.error(`Unknown email template "${data.template}" — discarding.`);
    return;
  }

  const { subject, html } = templateFn(data.variables);
  const from = _emailFrom ?? 'EDI <noreply@edi.app>';

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${_resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from, to: data.to, subject, html }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Resend API error ${res.status}: ${body}`);
  }

  console.log(`Email sent: template=${data.template}`);
}

// Compatibility alias for jobs dispatched with SendEmailJob shape
export async function sendEmailJob(data: SendEmailJob): Promise<void> {
  return sendEmail(data);
}
