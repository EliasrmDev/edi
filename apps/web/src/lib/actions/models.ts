'use server';

import { getAuthHeader } from '@/lib/session';

const API_URL = process.env['API_URL'] ?? 'http://localhost:3001';

export interface ModelInfo {
  id: string;
  name: string;
  supportsVision: boolean;
  supportsStreaming: boolean;
  maxOutputTokens: number | null;
}

export async function getCredentialModels(
  credentialId: string,
): Promise<{ data?: ModelInfo[]; error?: string }> {
  try {
    const authHeader = await getAuthHeader();
    if (!authHeader) return { error: 'No autenticado' };

    const res = await fetch(`${API_URL}/api/credentials/${encodeURIComponent(credentialId)}/models`, {
      headers: { Authorization: authHeader },
      cache: 'no-store',
    });

    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { message?: string };
      return { error: body.message ?? `Error ${res.status}` };
    }

    const json = (await res.json()) as { data: ModelInfo[] };
    return { data: json.data };
  } catch {
    return { error: 'Error al obtener modelos' };
  }
}

export async function setCredentialModel(
  credentialId: string,
  modelId: string,
): Promise<{ error?: string }> {
  try {
    const authHeader = await getAuthHeader();
    if (!authHeader) return { error: 'No autenticado' };

    const res = await fetch(`${API_URL}/api/credentials/${encodeURIComponent(credentialId)}/model`, {
      method: 'PATCH',
      headers: {
        Authorization: authHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ modelId }),
    });

    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { message?: string };
      return { error: body.message ?? `Error ${res.status}` };
    }

    return {};
  } catch {
    return { error: 'Error al guardar modelo' };
  }
}

export async function clearCredentialModel(
  credentialId: string,
): Promise<{ error?: string }> {
  try {
    const authHeader = await getAuthHeader();
    if (!authHeader) return { error: 'No autenticado' };

    const res = await fetch(`${API_URL}/api/credentials/${encodeURIComponent(credentialId)}/model`, {
      method: 'DELETE',
      headers: { Authorization: authHeader },
    });

    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { message?: string };
      return { error: body.message ?? `Error ${res.status}` };
    }

    return {};
  } catch {
    return { error: 'Error al desactivar modelo' };
  }
}

export async function toggleFavoriteModel(
  credentialId: string,
  modelId: string,
  action: 'add' | 'remove',
): Promise<{ error?: string }> {
  try {
    const authHeader = await getAuthHeader();
    if (!authHeader) return { error: 'No autenticado' };

    const res = await fetch(
      `${API_URL}/api/credentials/${encodeURIComponent(credentialId)}/model-favorites`,
      {
        method: 'PATCH',
        headers: {
          Authorization: authHeader,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ modelId, action }),
      },
    );

    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { message?: string };
      return { error: body.message ?? `Error ${res.status}` };
    }

    return {};
  } catch {
    return { error: 'Error al actualizar favorito' };
  }
}
