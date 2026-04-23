// Hardcoded base URL — no user-supplied URLs (SSRF protection)
const ANTHROPIC_BASE = 'https://api.anthropic.com/v1';
const ANTHROPIC_VERSION = '2023-06-01';
const FETCH_TIMEOUT_MS = 10_000;

export interface ModelInfo {
  id: string;
  name: string;
  supportsVision: boolean;
  supportsStreaming: boolean;
  maxOutputTokens: number | null;
}

interface AnthropicModel {
  id: string;
  display_name: string;
  type: string;
}

interface AnthropicListResponse {
  data: AnthropicModel[];
  has_more?: boolean;
  last_id?: string;
}

export async function fetchAnthropicModels(rawKey: string): Promise<ModelInfo[]> {
  const allModels: AnthropicModel[] = [];
  let afterId: string | undefined;

  do {
    const url = afterId
      ? `${ANTHROPIC_BASE}/models?limit=100&after_id=${encodeURIComponent(afterId)}`
      : `${ANTHROPIC_BASE}/models?limit=100`;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    try {
      const res = await fetch(url, {
        headers: {
          'x-api-key': rawKey,
          'anthropic-version': ANTHROPIC_VERSION,
        },
        signal: controller.signal,
      });

      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`Anthropic models API returned ${res.status}: ${text}`);
      }

      const data = (await res.json()) as AnthropicListResponse;
      allModels.push(...(data.data ?? []));
      afterId = data.has_more ? (data.last_id ?? undefined) : undefined;
    } finally {
      clearTimeout(timer);
    }
  } while (afterId);

  return allModels.map((m) => ({
    id: m.id,
    name: m.display_name || m.id,
    supportsVision:
      m.id.includes('claude-3') ||
      m.id.includes('claude-sonnet') ||
      m.id.includes('claude-opus') ||
      m.id.includes('claude-haiku-3'),
    supportsStreaming: true,
    maxOutputTokens: null,
  }));
}
