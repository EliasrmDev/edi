'use server';

import { getAuthHeader } from '@/lib/session';

const API_URL = process.env.API_URL ?? 'http://localhost:3001';

export type ApiTransformation =
  | 'tone-voseo-cr'
  | 'tone-tuteo'
  | 'tone-ustedeo'
  | 'correct-orthography';

export interface TransformResult {
  result?: string;
  source?: string;
  warnings?: Array<{ code: string; message: string }>;
  error?: string;
}

export async function transformTextAction(
  text: string,
  transformation: ApiTransformation,
): Promise<TransformResult> {
  const authHeader = await getAuthHeader();

  let res: Response;
  try {
    res = await fetch(`${API_URL}/api/transform`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authHeader,
      },
      body: JSON.stringify({
        text,
        transformation,
        locale: 'es-CR',
        requestAIValidation: true,
      }),
    });
  } catch {
    return { error: 'NETWORK_ERROR' };
  }

  if (res.status === 401) return { error: 'NOT_AUTHENTICATED' };
  if (res.status === 429) return { error: 'QUOTA_EXCEEDED' };

  const body = (await res.json().catch(() => ({}))) as {
    data?: { result?: string; source?: string; warnings?: Array<{ code: string; message: string }> };
    error?: { code?: string };
  };

  if (!res.ok) {
    return { error: body.error?.code ?? 'SERVER_ERROR' };
  }

  return {
    result: body.data?.result,
    source: body.data?.source,
    warnings: body.data?.warnings,
  };
}
