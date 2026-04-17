import type { UserId } from './user';

export type AuditAction =
  | 'user.created'
  | 'user.login'
  | 'user.logout'
  | 'user.password_reset'
  | 'user.email_verified'
  | 'user.deletion_requested'
  | 'user.deleted'
  | 'credential.created'
  | 'credential.verified'
  | 'credential.rotated'
  | 'credential.deleted'
  | 'credential.expired'
  | 'ai.request'
  | 'ai.error'
  | 'quota.exceeded'
  | 'admin.action';

export interface AuditLogEntry {
  id: string;
  userId: UserId | null;
  action: AuditAction;
  resourceType: string | null;
  resourceId: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  outcome: 'success' | 'failure' | 'partial';
  metadata: Record<string, unknown>;
  createdAt: Date;
}
