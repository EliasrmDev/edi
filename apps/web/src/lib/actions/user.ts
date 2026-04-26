'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import type { User, UserProfile } from '@edi/shared';
import { getAuthHeader } from '@/lib/session';

const API_URL = process.env.API_URL ?? 'http://localhost:3001';

export type ProfileError =
  | 'DISPLAY_NAME_TOO_LONG'
  | 'INVALID_PASSWORD'
  | 'PASSWORD_TOO_SHORT'
  | 'PASSWORD_TOO_LONG'
  | 'PASSWORD_TOO_COMMON'
  | 'PASSWORD_CONTAINS_EMAIL'
  | 'VALIDATION_ERROR'
  | 'SERVER_ERROR';
export type UpdateProfileState = { error?: ProfileError; success?: boolean } | null;
export type DeletionState = { error?: string; success?: boolean } | null;
export type PrivacyState = { error?: string; success?: boolean } | null;

export interface CurrentUser {
  user: User & { hasPassword: boolean };
  profile: UserProfile;
}

async function clearAuthCookies(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete('session');
  cookieStore.delete('next-auth.session-token');
  cookieStore.delete('__Secure-next-auth.session-token');
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const authHeader = await getAuthHeader();
  if (!authHeader) return null;
  try {
    const meRes = await fetch(`${API_URL}/api/auth/me`, {
      headers: { Authorization: authHeader },
      cache: 'no-store',
    });

    if (meRes.status === 401) {
      await clearAuthCookies();
      return null;
    }

    if (!meRes.ok) return null;

    const profileRes = await fetch(`${API_URL}/api/users/profile`, {
      headers: { Authorization: authHeader },
      cache: 'no-store',
    });

    // If the API session is revoked or expired, clear stale cookies so the
    // middleware won't block the subsequent redirect to /login.
    if (profileRes.status === 401) {
      await clearAuthCookies();
      return null;
    }
    if (!meRes.ok || !profileRes.ok) return null;
    const meBody = (await meRes.json()) as { data?: { user: User & { hasPassword: boolean } } };
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
  const preferredLocale = formData.get('preferredLocale');

  const cookie = await getAuthHeader();

  let res: Response;
  try {
    res = await fetch(`${API_URL}/api/users/profile`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: cookie },
      body: JSON.stringify({
        displayName: typeof displayName === 'string' ? displayName || null : undefined,
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

  revalidatePath('/profile');
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

  if (typeof newPassword !== 'string' || !newPassword) {
    return { error: 'SERVER_ERROR' };
  }

  const cookie = await getAuthHeader();

  let res: Response;
  try {
    res = await fetch(`${API_URL}/api/users/change-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: cookie },
      body: JSON.stringify({
        ...(typeof currentPassword === 'string' && currentPassword ? { currentPassword } : {}),
        newPassword,
      }),
    });
  } catch {
    return { error: 'SERVER_ERROR' };
  }

  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as {
      error?: { code?: string; details?: Record<string, string[]> };
    };
    const code = body.error?.code;

    // Zod fires before the service layer — map field-level errors to specific codes
    if (code === 'VALIDATION_ERROR') {
      const pwErrors = body.error?.details?.['newPassword'] ?? [];
      if (pwErrors.some((e) => e.toLowerCase().includes('least'))) return { error: 'PASSWORD_TOO_SHORT' };
      if (pwErrors.some((e) => e.toLowerCase().includes('most'))) return { error: 'PASSWORD_TOO_LONG' };
    }

    return { error: (code as ProfileError) ?? 'SERVER_ERROR' };
  }

  // Password changed — clear all auth cookies so the user is forced to
  // re-authenticate. This prevents the stale-session issue where the old
  // OAuth session stays active after a password set/change, blocking access
  // to the login page.
  await clearAuthCookies();
  redirect('/login?success=password-changed');
}
