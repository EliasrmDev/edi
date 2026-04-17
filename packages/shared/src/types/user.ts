import type { ToneType } from './tone';

export type UserId = string;
export type UserRole = 'user' | 'admin';

export interface User {
  id: UserId;
  email: string;
  emailVerified: boolean;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface UserProfile {
  userId: UserId;
  displayName: string | null;
  defaultTone: ToneType;
  preferredLocale: 'es-CR' | 'es-419' | 'es';
  retainHistory: boolean;
  createdAt: Date;
  updatedAt: Date;
}
