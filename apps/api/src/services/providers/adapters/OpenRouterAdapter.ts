import type { ProviderId } from '@edi/shared';
import { ProviderError, type ProviderAdapter, type ValidateTextParams } from '../ProviderAdapter.js';

// Hardcoded base URL — no user-supplied URLs (SSRF protection)
const OPENROUTER_BASE = 'https://openrouter.ai/api/v1';
const VERIFY_TIMEOUT_MS = 5_000;
const GENERATE_TIMEOUT_MS = 30_000;

// OpenRouter uses the OpenAI-compatible response shape
interface OpenRouterChatResponse {
  choices: Array<{
    message: { content: string };
  }>;
  usage?: { total_tokens: number };
}

interface OpenRouterErrorBody {
  error?: { message?: string };
}

export class OpenRouterAdapter implements ProviderAdapter {
  readonly providerId: ProviderId = 'openrouter';

  /**
   * Verify the key by calling the /auth/key endpoint.
   * 200 → valid. 401/403 → invalid. Timeout/other → error.
   */
  async verifyKey(rawKey: string): Promise<{ valid: boolean; error?: string }> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), VERIFY_TIMEOUT_MS);

    try {
      const res = await fetch(`${OPENROUTER_BASE}/auth/key`, {
        headers: { Authorization: `Bearer ${rawKey}` },
        signal: controller.signal,
      });

      if (res.status === 200) return { valid: true };
      if (res.status === 401 || res.status === 403) {
        return { valid: false, error: 'Invalid or revoked OpenRouter API key' };
      }
      return { valid: false, error: `Unexpected status ${res.status} from OpenRouter` };
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return { valid: false, error: 'Verification timed out' };
      }
      return { valid: false, error: 'Could not reach OpenRouter API' };
    } finally {
      clearTimeout(timer);
    }
  }

  /**
   * Run a text transformation via OpenRouter's OpenAI-compatible /chat/completions endpoint.
   * - Default model: openai/gpt-4o-mini
   * - temperature: 0.3
   * - max_tokens: 4096
   * - timeout: 30s
   */
  async validateText(params: ValidateTextParams): Promise<{ result: string; tokensUsed: number }> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), GENERATE_TIMEOUT_MS);

    try {
      const res = await fetch(`${OPENROUTER_BASE}/chat/completions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${params.rawKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://edi.app',
          'X-Title': 'EDI',
        },
        body: JSON.stringify({
          model: params.model ?? 'openai/gpt-4o-mini',
          max_tokens: 4096,
          temperature: 0.3,
          messages: [
            { role: 'system', content: params.systemPrompt },
            { role: 'user', content: params.text },
          ],
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as OpenRouterErrorBody;
        const msg = body.error?.message ?? `OpenRouter error ${res.status}`;
        throw new ProviderError('openrouter', res.status, msg);
      }

      const data = (await res.json()) as OpenRouterChatResponse;
      const content = data.choices[0]?.message?.content;

      if (!content) {
        throw new ProviderError('openrouter', 500, 'Empty response content from OpenRouter');
      }

      return {
        result: content.trim(),
        tokensUsed: data.usage?.total_tokens ?? 0,
      };
    } catch (err) {
      if (err instanceof ProviderError) throw err;
      if (err instanceof Error && err.name === 'AbortError') {
        throw new ProviderError('openrouter', 408, 'Request timed out');
      }
      throw new ProviderError('openrouter', 500, 'Unexpected error calling OpenRouter');
    } finally {
      clearTimeout(timer);
    }
  }
}
