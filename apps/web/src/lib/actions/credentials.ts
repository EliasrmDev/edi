'use server';

import { redirect } from 'next/navigation';
import type { ProviderCredential, ProviderId } from '@edi/shared';
import { getAuthHeader } from '@/lib/session';

const API_URL = process.env.API_URL ?? 'http://localhost:3001';

export type CredentialError =
  | 'INVALID_KEY_FORMAT'
  | 'INVALID_API_KEY'
  | 'PROVIDER_NOT_SUPPORTED'
  | 'DUPLICATE_CREDENTIAL'
  | 'SERVER_ERROR';

export type CreateCredentialState = { error?: CredentialError } | null;
export type DeleteCredentialState = { error?: string } | null;
export type VerifyCredentialState = { error?: string; success?: boolean } | null;

export async function getCredentials(): Promise<ProviderCredential[]> {
  const cookie = await getAuthHeader();
  if (!cookie) return [];

  try {
    const res = await fetch(`${API_URL}/api/credentials`, {
      headers: { Authorization: cookie },
      cache: 'no-store',
    });
    if (!res.ok) return [];
    const body = (await res.json()) as { data?: ProviderCredential[] };
    return body.data ?? [];
  } catch {
    return [];
  }
}

export async function createCredentialAction(
  _prevState: CreateCredentialState,
  formData: FormData,
): Promise<CreateCredentialState> {
  const provider = formData.get('provider') as ProviderId | null;
  const rawKey = formData.get('rawKey');
  const label = formData.get('label');
  const expiresAt = formData.get('expiresAt');

  if (!provider || typeof rawKey !== 'string' || typeof label !== 'string') {
    return { error: 'SERVER_ERROR' };
  }

  const cookie = await getAuthHeader();

  let res: Response;
  try {
    res = await fetch(`${API_URL}/api/credentials`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: cookie },
      body: JSON.stringify({
        provider,
        rawKey,
        label,
        expiresAt:
          typeof expiresAt === 'string' && expiresAt ? new Date(expiresAt).toISOString() : undefined,
      }),
    });
  } catch {
    return { error: 'SERVER_ERROR' };
  }

  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    const code = body.error as CredentialError | undefined;
    if (code === 'INVALID_KEY_FORMAT') return { error: 'INVALID_KEY_FORMAT' };
    if (code === 'INVALID_API_KEY') return { error: 'INVALID_API_KEY' };
    if (code === 'DUPLICATE_CREDENTIAL') return { error: 'DUPLICATE_CREDENTIAL' };
    return { error: 'SERVER_ERROR' };
  }

  redirect('/credentials?success=created');
}

export async function deleteCredentialAction(
  _prevState: DeleteCredentialState,
  formData: FormData,
): Promise<DeleteCredentialState> {
  const credentialId = formData.get('credentialId');
  if (typeof credentialId !== 'string' || !credentialId) return { error: 'SERVER_ERROR' };

  const cookie = await getAuthHeader();

  let res: Response;
  try {
    res = await fetch(`${API_URL}/api/credentials/${credentialId}`, {
      method: 'DELETE',
      headers: { Authorization: cookie },
    });
  } catch {
    return { error: 'SERVER_ERROR' };
  }

  if (!res.ok) return { error: 'SERVER_ERROR' };
  redirect('/credentials?success=deleted');
}

export async function verifyCredentialAction(
  _prevState: VerifyCredentialState,
  formData: FormData,
): Promise<VerifyCredentialState> {
  const credentialId = formData.get('credentialId');
  if (typeof credentialId !== 'string' || !credentialId) return { error: 'SERVER_ERROR' };

  const cookie = await getAuthHeader();

  let res: Response;
  try {
    res = await fetch(`${API_URL}/api/credentials/${credentialId}/verify`, {
      method: 'POST',
      headers: { Authorization: cookie },
    });
  } catch {
    return { error: 'SERVER_ERROR' };
  }

  if (!res.ok) return { error: 'Verification failed. Check the key is still valid.' };
  return { success: true };
}

export async function activateCredentialAction(credentialId: string): Promise<{ error?: string }> {
  const cookie = await getAuthHeader();
  try {
    const res = await fetch(`${API_URL}/api/credentials/${credentialId}/activate`, {
      method: 'PATCH',
      headers: { Authorization: cookie },
    });
    if (!res.ok) return { error: 'SERVER_ERROR' };
    return {};
  } catch {
    return { error: 'SERVER_ERROR' };
  }
}

export type ToggleEnabledState = { error?: string; credential?: ProviderCredential } | null;

export async function toggleEnabledAction(credentialId: string): Promise<ToggleEnabledState> {
  const cookie = await getAuthHeader();
  try {
    const res = await fetch(`${API_URL}/api/credentials/${credentialId}/toggle-enabled`, {
      method: 'PATCH',
      headers: { Authorization: cookie },
    });
    if (!res.ok) return { error: 'SERVER_ERROR' };
    const body = (await res.json()) as { data?: ProviderCredential };
    return { credential: body.data };
  } catch {
    return { error: 'SERVER_ERROR' };
  }
}
