import type { ProviderId } from '@edi/shared';
import { ProviderError, type ProviderAdapter, type ProviderUsageData, type ValidateTextParams } from '../ProviderAdapter.js';

// Hardcoded base URL — no user-supplied URLs (SSRF protection)
const GOOGLE_AI_BASE = 'https://generativelanguage.googleapis.com/v1beta';
const MODEL = 'gemini-2.5-flash';
const VERIFY_TIMEOUT_MS = 5_000;
const GENERATE_TIMEOUT_MS = 30_000;

interface GoogleGenerateResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
  }>;
  usageMetadata?: { totalTokenCount?: number };
}

interface GoogleErrorBody {
  error?: { message?: string; status?: string };
}

export class GoogleAIAdapter implements ProviderAdapter {
  readonly providerId: ProviderId = 'google-ai';

  /**
   * Verify key by listing models.
   * 200 → valid. 400/403 with API key error → invalid.
   */
  async verifyKey(rawKey: string): Promise<{ valid: boolean; error?: string }> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), VERIFY_TIMEOUT_MS);

    try {
      const url = `${GOOGLE_AI_BASE}/models?key=${encodeURIComponent(rawKey)}`;
      const res = await fetch(url, { signal: controller.signal });

      if (res.status === 200) return { valid: true };

      if (res.status === 400 || res.status === 403) {
        const body = (await res.json().catch(() => ({}))) as GoogleErrorBody;
        const status = body.error?.status ?? '';
        if (status === 'INVALID_ARGUMENT' || status === 'PERMISSION_DENIED') {
          return { valid: false, error: 'Invalid or unauthorized Google AI API key' };
        }
      }

      return { valid: false, error: `Unexpected status ${res.status} from Google AI` };
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return { valid: false, error: 'Verification timed out' };
      }
      return { valid: false, error: 'Could not reach Google AI API' };
    } finally {
      clearTimeout(timer);
    }
  }

  /**
   * Run a text transformation via gemini-1.5-flash.
   * - max_tokens: 4096
   * - temperature: 0.3
   * - timeout: 30s
   */
  async validateText(params: ValidateTextParams): Promise<{ result: string; tokensUsed: number }> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), GENERATE_TIMEOUT_MS);

    const modelId = params.model ?? MODEL;
    const url = `${GOOGLE_AI_BASE}/models/${encodeURIComponent(modelId)}:generateContent?key=${encodeURIComponent(params.rawKey)}`;

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: params.systemPrompt }],
          },
          contents: [
            {
              role: 'user',
              parts: [{ text: params.text }],
            },
          ],
          generationConfig: {
            maxOutputTokens: 4096,
            temperature: 0.3,
          },
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as GoogleErrorBody;
        const msg = body.error?.message ?? `Google AI error ${res.status}`;
        throw new ProviderError('google-ai', res.status, msg);
      }

      const data = (await res.json()) as GoogleGenerateResponse;
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!text) {
        throw new ProviderError('google-ai', 500, 'Empty response content from Google AI');
      }

      return {
        result: text.trim(),
        tokensUsed: data.usageMetadata?.totalTokenCount ?? 0,
      };
    } catch (err) {
      if (err instanceof ProviderError) throw err;
      if (err instanceof Error && err.name === 'AbortError') {
        throw new ProviderError('google-ai', 504, 'Google AI request timed out after 30s');
      }
      throw new ProviderError('google-ai', 500, 'Failed to reach Google AI API');
    } finally {
      clearTimeout(timer);
    }
  }

  async getUsage(_rawKey: string): Promise<ProviderUsageData> {
    // Google AI Studio does not expose a per-key billing/usage API via the same credentials
    return { supported: false, unavailableUrl: 'https://aistudio.google.com/app/usage' };
  }
}
