import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { ExtensionAuthHandoff } from './_ExtensionAuthHandoff';

export const dynamic = 'force-dynamic';

const INTERNAL_API_URL = process.env.API_URL ?? 'http://localhost:3001';

// Chrome extension IDs are 32 lowercase characters from the alphabet subset a-p
const EXT_ID_RE = /^[a-p]{32}$/;

interface PageProps {
  searchParams: Promise<{ extId?: string }>;
}

export default async function ExtensionAuthPage({ searchParams }: PageProps) {
  const { extId } = await searchParams;

  if (!extId || !EXT_ID_RE.test(extId)) {
    redirect('/dashboard');
  }

  const cookieStore = await cookies();
  const token = cookieStore.get('session')?.value;
  if (!token) {
    redirect('/dashboard');
  }

  // Fetch user info server-side so it can be stored alongside the token
  let email = '';
  let displayName: string | null = null;
  try {
    const meRes = await fetch(`${INTERNAL_API_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    if (meRes.ok) {
      const body = (await meRes.json()) as {
        data?: { user?: { email?: string; displayName?: string | null } };
      };
      email = body.data?.user?.email ?? '';
      displayName = body.data?.user?.displayName ?? null;
    }
  } catch {
    // Non-fatal — proceed without user info; popup will show generic state
  }

  // expiresAt matches the default API session duration (SESSION_DURATION_HOURS = 24h)
  const expiresAt = Date.now() + 24 * 60 * 60 * 1000;

  return (
    <ExtensionAuthHandoff
      extId={extId}
      token={token}
      expiresAt={expiresAt}
      email={email}
      displayName={displayName}
    />
  );
}
