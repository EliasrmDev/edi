import type { UserId } from './user';
import type { CredentialId } from './credentials';

export type JobName =
  | 'credential.expiration-reminder'
  | 'credential.rotation-reminder'
  | 'user.deletion-workflow'
  | 'user.data-export'
  | 'credential.deletion-workflow'
  | 'cleanup.expired-sessions'
  | 'cleanup.old-logs'
  | 'notification.send-email';

export interface CredentialExpirationReminderJob {
  credentialId: CredentialId;
  userId: UserId;
  daysUntilExpiry: number;
}

export interface UserDeletionWorkflowJob {
  userId: UserId;
  requestedAt: Date;
  reason: string | null;
  gracePeriodDays: number;
}

export interface CredentialDeletionWorkflowJob {
  credentialId: CredentialId;
  userId: UserId;
  scheduledAt: Date;
}

export interface SendEmailJob {
  to: string;
  template: string;
  variables: Record<string, string>;
}
