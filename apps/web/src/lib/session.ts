'use server';
import { cookies } from 'next/headers';
import { auth } from '@/lib/auth';

/**
 * Returns the value for the `Authorization` header: "Bearer <token>".
 * Falls back to the NextAuth JWT apiSession for OAuth users whose session
 * cookie hasn't been bridged yet (first SSR request after OAuth sign-in).
 */
export async function getAuthHeader(): Promise<string> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('session')?.value;
  if (sessionToken) {
    return `Bearer ${sessionToken}`;
  }
  // First SSR request after OAuth sign-in: session cookie not yet set
  const oauthSession = await auth();
  if (oauthSession?.user?.apiSession) {
    return `Bearer ${oauthSession.user.apiSession}`;
  }
  return '';
}
