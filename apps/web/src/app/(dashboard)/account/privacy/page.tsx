import { Metadata } from 'next';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { PrivacyForm } from './_PrivacyForm';
import type { UserProfile } from '@edi/shared';

export const metadata: Metadata = { title: 'Privacidad' };

const API_URL = process.env.API_URL ?? 'http://localhost:3001';

async function getProfile(): Promise<UserProfile | null> {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.getAll().map((c) => `${c.name}=${c.value}`).join('; ');
  try {
    const res = await fetch(`${API_URL}/api/users/profile`, {
      headers: { Cookie: cookieHeader },
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const body = (await res.json()) as { data?: UserProfile };
    return body.data ?? null;
  } catch {
    return null;
  }
}

export default async function PrivacyPage() {
  const cookieStore = await cookies();
  if (!cookieStore.get('session')) redirect('/login');

  const profile = await getProfile();

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Privacidad</h1>
        <p className="mt-1 text-sm text-gray-500">
          Controlá qué datos guardamos sobre tu uso de EDI.
        </p>
      </div>

      <PrivacyForm initialRetainHistory={profile?.retainHistory ?? true} />
    </div>
  );
}
