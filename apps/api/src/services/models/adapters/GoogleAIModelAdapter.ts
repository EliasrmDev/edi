// Hardcoded base URL — no user-supplied URLs (SSRF protection)
const GOOGLE_AI_BASE = 'https://generativelanguage.googleapis.com/v1beta';
const FETCH_TIMEOUT_MS = 10_000;

export interface ModelInfo {
  id: string;
  name: string;
  supportsVision: boolean;
  supportsStreaming: boolean;
  maxOutputTokens: number | null;
}

interface GeminiModel {
  name: string;
  displayName: string;
  inputTokenLimit?: number;
  outputTokenLimit?: number;
  supportedGenerationMethods?: string[];
}

interface GeminiListResponse {
  models: GeminiModel[];
}

export async function fetchGoogleAIModels(rawKey: string): Promise<ModelInfo[]> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const url = `${GOOGLE_AI_BASE}/models?key=${encodeURIComponent(rawKey)}`;
    const res = await fetch(url, { signal: controller.signal });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`Google AI models API returned ${res.status}: ${text}`);
    }

    const data = (await res.json()) as GeminiListResponse;

    return (data.models ?? [])
      .filter((m) => m.supportedGenerationMethods?.includes('generateContent'))
      .map((m) => {
        const id = m.name.replace('models/', '');
        return {
          id,
          name: m.displayName || id,
          supportsVision:
            id.includes('vision') ||
            id.includes('gemini-pro') ||
            id.includes('gemini-1.5') ||
            id.includes('gemini-2'),
          supportsStreaming: m.supportedGenerationMethods?.includes('streamGenerateContent') ?? false,
          maxOutputTokens: m.outputTokenLimit ?? null,
        };
      });
  } finally {
    clearTimeout(timer);
  }
}
