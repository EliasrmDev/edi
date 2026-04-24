// Hardcoded base URL — no user-supplied URLs (SSRF protection)
const OPENROUTER_BASE = 'https://openrouter.ai/api/v1';
const FETCH_TIMEOUT_MS = 10_000;

export interface ModelInfo {
  id: string;
  name: string;
  supportsVision: boolean;
  supportsStreaming: boolean;
  maxOutputTokens: number | null;
}

interface OpenRouterModel {
  id: string;
  name?: string;
  context_length?: number;
  top_provider?: {
    max_completion_tokens?: number | null;
  };
  architecture?: {
    modality?: string;           // e.g. "text->text", "text+image->text"
    input_modalities?: string[];
    output_modalities?: string[];
  };
}

interface OpenRouterListResponse {
  data: OpenRouterModel[];
}

export async function fetchOpenRouterModels(rawKey: string): Promise<ModelInfo[]> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const res = await fetch(`${OPENROUTER_BASE}/models`, {
      headers: {
        Authorization: `Bearer ${rawKey}`,
        'HTTP-Referer': 'https://edi.app',
        'X-Title': 'EDI',
      },
      signal: controller.signal,
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`OpenRouter models API returned ${res.status}: ${text}`);
    }

    const data = (await res.json()) as OpenRouterListResponse;
    return (data.data ?? [])
      .filter((m) => {
        // Primary: use modality string (e.g. "text->text", "text+image->text") when available
        const modality = m.architecture?.modality;
        if (modality) {
          return modality.includes('->text');
        }
        // Fallback: check output_modalities array
        const outputModalities = m.architecture?.output_modalities ?? [];
        const hasTextOutput = outputModalities.length === 0 || outputModalities.includes('text');
        // Exclude known non-chat model id patterns
        const isEmbedding = m.id.includes('embed') || m.id.includes('embedding');
        const isModeration = m.id.includes('moderat');
        return hasTextOutput && !isEmbedding && !isModeration;
      })
      .map((m) => ({
        id: m.id,
        name: m.name ?? m.id,
        supportsVision:
          (m.architecture?.input_modalities ?? []).includes('image') ||
          m.architecture?.modality?.includes('image') === true ||
          m.id.includes('vision') ||
          m.id.includes('gpt-4o'),
        supportsStreaming: true,
        maxOutputTokens: m.top_provider?.max_completion_tokens ?? null,
      }));
  } finally {
    clearTimeout(timer);
  }
}
