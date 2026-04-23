// Hardcoded base URL — no user-supplied URLs (SSRF protection)
const OPENAI_BASE = 'https://api.openai.com/v1';
const FETCH_TIMEOUT_MS = 10_000;

export interface ModelInfo {
  id: string;
  name: string;
  supportsVision: boolean;
  supportsStreaming: boolean;
  maxOutputTokens: number | null;
}

interface OpenAIModel {
  id: string;
  object: string;
  owned_by?: string;
}

interface OpenAIListResponse {
  data: OpenAIModel[];
}

export async function fetchOpenAIModels(rawKey: string): Promise<ModelInfo[]> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const res = await fetch(`${OPENAI_BASE}/models`, {
      headers: { Authorization: `Bearer ${rawKey}` },
      signal: controller.signal,
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`OpenAI models API returned ${res.status}: ${text}`);
    }

    const data = (await res.json()) as OpenAIListResponse;
    return (data.data ?? [])
      .filter(
        (m) =>
          m.id.startsWith('gpt-') ||
          m.id.startsWith('chatgpt-') ||
          m.id.startsWith('o1') ||
          m.id.startsWith('o3') ||
          m.id.startsWith('o4'),
      )
      .map((m) => ({
        id: m.id,
        name: m.id,
        supportsVision: m.id.includes('vision') || m.id.includes('gpt-4o') || m.id.includes('gpt-4-turbo'),
        supportsStreaming: true,
        maxOutputTokens: null,
      }));
  } finally {
    clearTimeout(timer);
  }
}
