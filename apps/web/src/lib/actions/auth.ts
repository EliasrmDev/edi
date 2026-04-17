'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

const API_URL = process.env.API_URL ?? 'http://localhost:3001';

export type AuthError =
  | 'INVALID_CREDENTIALS'
  | 'EMAIL_NOT_VERIFIED'
  | 'RATE_LIMITED'
  | 'EMAIL_ALREADY_EXISTS'
  | 'WEAK_PASSWORD'
  | 'INVALID_TOKEN'
  | 'TOKEN_EXPIRED'
  | 'SERVER_ERROR';

export type LoginState = { error?: AuthError } | null;
export type RegisterState = { error?: AuthError; success?: boolean } | null;
export type ForgotPasswordState = { success?: boolean; error?: AuthError } | null;
export type ResetPasswordState = { error?: AuthError; success?: boolean } | null;

async function forwardSessionCookie(res: Response): Promise<void> {
  const setCookieHeader = res.headers.get('set-cookie');
  if (!setCookieHeader) return;

  const mainPart = setCookieHeader.split(';')[0] ?? '';
  const eqIdx = mainPart.indexOf('=');
  if (eqIdx < 0) return;

  const name = mainPart.slice(0, eqIdx).trim();
  const value = mainPart.slice(eqIdx + 1).trim();
  if (!name || !value) return;

  const cookieStore = await cookies();
  cookieStore.set(name, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 7 * 24 * 60 * 60,
  });
}

export async function loginAction(
  _prevState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = formData.get('email');
  const password = formData.get('password');

  if (typeof email !== 'string' || typeof password !== 'string' || !email || !password) {
    return { error: 'INVALID_CREDENTIALS' };
  }

  let res: Response;
  try {
    res = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
  } catch {
    return { error: 'SERVER_ERROR' };
  }

  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: { code?: string } };
    const code = body.error?.code;
    if (code === 'EMAIL_NOT_VERIFIED') return { error: 'EMAIL_NOT_VERIFIED' };
    if (res.status === 429) return { error: 'RATE_LIMITED' };
    return { error: 'INVALID_CREDENTIALS' };
  }

  await forwardSessionCookie(res);
  redirect('/dashboard');
}

export async function registerAction(
  _prevState: RegisterState,
  formData: FormData,
): Promise<RegisterState> {
  const email = formData.get('email');
  const password = formData.get('password');
  const displayName = formData.get('displayName');

  if (typeof email !== 'string' || typeof password !== 'string') {
    return { error: 'SERVER_ERROR' };
  }

  let res: Response;
  try {
    res = await fetch(`${API_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        password,
        displayName: typeof displayName === 'string' && displayName ? displayName : undefined,
      }),
    });
  } catch {
    return { error: 'SERVER_ERROR' };
  }

  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: { code?: string } };
    const code = body.error?.code as AuthError | undefined;
    if (code === 'EMAIL_ALREADY_EXISTS') return { error: 'EMAIL_ALREADY_EXISTS' };
    if (code === 'WEAK_PASSWORD') return { error: 'WEAK_PASSWORD' };
    return { error: 'SERVER_ERROR' };
  }

  return { success: true };
}

export async function logoutAction(): Promise<void> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('session')?.value;

  if (sessionToken) {
    try {
      await fetch(`${API_URL}/api/auth/logout`, {
        method: 'POST',
        headers: { Cookie: `session=${sessionToken}` },
      });
    } catch {
      // Clear cookie regardless of API call result
    }
  }

  cookieStore.delete('session');
  redirect('/login');
}

export async function forgotPasswordAction(
  _prevState: ForgotPasswordState,
  formData: FormData,
): Promise<ForgotPasswordState> {
  const email = formData.get('email');
  if (typeof email !== 'string' || !email) return { error: 'SERVER_ERROR' };

  try {
    await fetch(`${API_URL}/api/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
  } catch {
    // Always show success to prevent email enumeration
  }

  // Always return success to prevent email enumeration
  return { success: true };
}

export async function resetPasswordAction(
  _prevState: ResetPasswordState,
  formData: FormData,
): Promise<ResetPasswordState> {
  const token = formData.get('token');
  const password = formData.get('password');

  if (typeof token !== 'string' || typeof password !== 'string' || !token || !password) {
    return { error: 'SERVER_ERROR' };
  }

  let res: Response;
  try {
    res = await fetch(`${API_URL}/api/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, password }),
    });
  } catch {
    return { error: 'SERVER_ERROR' };
  }

  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: { code?: string } };
    const code = body.error?.code as AuthError | undefined;
    if (code === 'TOKEN_EXPIRED') return { error: 'TOKEN_EXPIRED' };
    if (code === 'INVALID_TOKEN') return { error: 'INVALID_TOKEN' };
    return { error: 'SERVER_ERROR' };
  }

  return { success: true };
}
