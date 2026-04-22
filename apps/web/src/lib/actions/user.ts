'use server';

import { redirect } from 'next/navigation';
import type { User, UserProfile } from '@edi/shared';
import { getAuthHeader } from '@/lib/session';

const API_URL = process.env.API_URL ?? 'http://localhost:3001';

export type ProfileError = 'DISPLAY_NAME_TOO_LONG' | 'SERVER_ERROR';
export type UpdateProfileState = { error?: ProfileError; success?: boolean } | null;
export type DeletionState = { error?: string; success?: boolean } | null;
export type PrivacyState = { error?: string; success?: boolean } | null;

export interface CurrentUser {
  user: User;
  profile: UserProfile;
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const authHeader = await getAuthHeader();
  if (!authHeader) return null;
  try {
    const [meRes, profileRes] = await Promise.all([
      fetch(`${API_URL}/api/auth/me`, { headers: { Authorization: authHeader }, cache: 'no-store' }),
      fetch(`${API_URL}/api/users/profile`, { headers: { Authorization: authHeader }, cache: 'no-store' }),
    ]);
    if (!meRes.ok || !profileRes.ok) return null;
    const meBody = (await meRes.json()) as { data?: { user: User } };
    const profileBody = (await profileRes.json()) as { data?: { profile: UserProfile } };
    const user = meBody.data?.user;
    const profile = profileBody.data?.profile;
    if (!user || !profile) return null;
    return { user, profile };
  } catch {
    return null;
  }
}

export async function updateProfileAction(
  _prevState: UpdateProfileState,
  formData: FormData,
): Promise<UpdateProfileState> {
  const displayName = formData.get('displayName');
  const defaultTone = formData.get('defaultTone');
  const preferredLocale = formData.get('preferredLocale');

  const cookie = await getAuthHeader();

  let res: Response;
  try {
    res = await fetch(`${API_URL}/api/users/profile`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: cookie },
      body: JSON.stringify({
        displayName: typeof displayName === 'string' ? displayName || null : undefined,
        defaultTone: typeof defaultTone === 'string' ? defaultTone : undefined,
        preferredLocale: typeof preferredLocale === 'string' ? preferredLocale : undefined,
      }),
    });
  } catch {
    return { error: 'SERVER_ERROR' };
  }

  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: { code?: string } };
    const code = body.error?.code as ProfileError | undefined;
    return { error: code ?? 'SERVER_ERROR' };
  }

  return { success: true };
}

export async function requestDeletionAction(
  _prevState: DeletionState,
  formData: FormData,
): Promise<DeletionState> {
  const confirmation = formData.get('confirmation');
  if (confirmation !== 'ELIMINAR') {
    return { error: 'Debés escribir "ELIMINAR" para confirmar.' };
  }

  const cookie = await getAuthHeader();

  let res: Response;
  try {
    res = await fetch(`${API_URL}/api/users/request-deletion`, {
      method: 'POST',
      headers: { Authorization: cookie, 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
  } catch {
    return { error: 'SERVER_ERROR' };
  }

  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: { code?: string } };
    return { error: body.error?.code ?? 'SERVER_ERROR' };
  }

  return { success: true };
}

export async function cancelDeletionAction(
  _prevState: DeletionState,
): Promise<DeletionState> {
  const cookie = await getAuthHeader();

  let res: Response;
  try {
    res = await fetch(`${API_URL}/api/users/cancel-deletion`, {
      method: 'POST',
      headers: { Authorization: cookie },
    });
  } catch {
    return { error: 'SERVER_ERROR' };
  }

  if (!res.ok) return { error: 'SERVER_ERROR' };
  return { success: true };
}

export async function updatePrivacyAction(
  _prevState: PrivacyState,
  formData: FormData,
): Promise<PrivacyState> {
  const retainHistory = formData.get('retainHistory') === 'on';

  const cookie = await getAuthHeader();

  let res: Response;
  try {
    res = await fetch(`${API_URL}/api/users/profile`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: cookie },
      body: JSON.stringify({ retainHistory }),
    });
  } catch {
    return { error: 'SERVER_ERROR' };
  }

  if (!res.ok) return { error: 'SERVER_ERROR' };
  return { success: true };
}

export async function exportDataAction(
  _prevState: DeletionState,
): Promise<DeletionState> {
  const cookie = await getAuthHeader();

  let res: Response;
  try {
    res = await fetch(`${API_URL}/api/users/export-data`, {
      method: 'POST',
      headers: { Authorization: cookie },
    });
  } catch {
    return { error: 'SERVER_ERROR' };
  }

  if (!res.ok) return { error: 'SERVER_ERROR' };
  return { success: true };
}

export async function changePasswordAction(
  _prevState: UpdateProfileState,
  formData: FormData,
): Promise<UpdateProfileState> {
  const currentPassword = formData.get('currentPassword');
  const newPassword = formData.get('newPassword');

  if (typeof currentPassword !== 'string' || typeof newPassword !== 'string') {
    return { error: 'SERVER_ERROR' };
  }

  const cookie = await getAuthHeader();

  let res: Response;
  try {
    res = await fetch(`${API_URL}/api/auth/change-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: cookie },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  } catch {
    return { error: 'SERVER_ERROR' };
  }

  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: { code?: string } };
    const code = body.error?.code as ProfileError | undefined;
    return { error: code ?? 'SERVER_ERROR' };
  }

  redirect('/account?success=password-changed');
}
