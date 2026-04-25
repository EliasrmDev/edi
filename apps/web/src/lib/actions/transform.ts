'use server';

import { getAuthHeader } from '@/lib/session';
import type { CopyConfig } from '@edi/shared';

const API_URL = process.env.API_URL ?? 'http://localhost:3001';

export type ApiTransformation =
  | 'tone-voseo-cr'
  | 'tone-tuteo'
  | 'tone-ustedeo'
  | 'correct-orthography'
  | 'copy-writing-cr';

export interface TransformResult {
  result?: string;
  source?: string;
  warnings?: Array<{ code: string; message: string }>;
  error?: string;
}

export interface UsageStats {
  quota: {
    dailyUsed: number;
    dailyLimit: number;
    monthlyUsed: number;
    monthlyLimit: number;
    resetDailyAt: string;
    resetMonthlyAt: string;
  } | null;
  summary: {
    totalRequests: number;
    totalAiRequests: number;
    totalFallbacks: number;
    totalTokens: number;
    avgProcessingMs: number;
  };
  byProvider: { provider: string; requestCount: number; totalTokens: number }[];
  byType: { transformationType: string; requestCount: number }[];
  bySource: { source: string; requestCount: number }[];
  dailyActivity: { date: string; requestCount: number; totalTokens: number; localCount: number; aiCount: number }[];
  recentRecords: {
    id: string;
    provider: string | null;
    transformationType: string;
    source: string;
    tokensUsed: number | null;
    processingMs: number;
    createdAt: string;
  }[];
}

export async function transformTextAction(
  text: string,
  transformation: ApiTransformation,
  verbalMode?: 'indicativo' | 'imperativo',
  copyConfig?: CopyConfig,
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
        ...(verbalMode ? { verbalMode } : {}),
        ...(copyConfig ? { copyConfig } : {}),
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

export async function getUsageStats(): Promise<UsageStats | null> {
  const authHeader = await getAuthHeader();
  try {
    const res = await fetch(`${API_URL}/api/transform/usage-stats`, {
      headers: { Authorization: authHeader },
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const body = (await res.json()) as { data?: UsageStats };
    return body.data ?? null;
  } catch {
    return null;
  }
}

export async function recordLocalUsageAction(
  transformationType: string,
  processingMs: number,
  clientHint?: string,
): Promise<void> {
  try {
    const authHeader = await getAuthHeader();
    await fetch(`${API_URL}/api/transform/record-local`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authHeader,
      },
      body: JSON.stringify({
        transformationType,
        processingMs,
        ...(clientHint ? { clientHint } : {}),
      }),
    });
  } catch {
    // best-effort — never throw
  }
}
