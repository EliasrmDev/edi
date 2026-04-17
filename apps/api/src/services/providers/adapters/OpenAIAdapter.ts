import type { ProviderId } from '@edi/shared';
import { ProviderError, type ProviderAdapter, type ValidateTextParams } from '../ProviderAdapter.js';

// Hardcoded base URL — no user-supplied URLs (SSRF protection)
const OPENAI_BASE = 'https://api.openai.com/v1';
const VERIFY_TIMEOUT_MS = 5_000;
const GENERATE_TIMEOUT_MS = 30_000;

// OpenAI API response shapes (minimal — only fields we use)
interface OpenAIChatResponse {
  choices: Array<{
    message: { content: string };
  }>;
  usage?: { total_tokens: number };
}

interface OpenAIErrorBody {
  error?: { message?: string };
}

export class OpenAIAdapter implements ProviderAdapter {
  readonly providerId: ProviderId = 'openai';

  /**
   * Verify the key by listing models.
   * 200 → valid. 401/403 → invalid. Timeout/other → error.
   */
  async verifyKey(rawKey: string): Promise<{ valid: boolean; error?: string }> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), VERIFY_TIMEOUT_MS);

    try {
      const res = await fetch(`${OPENAI_BASE}/models`, {
        headers: { Authorization: `Bearer ${rawKey}` },
        signal: controller.signal,
      });

      if (res.status === 200) return { valid: true };
      if (res.status === 401 || res.status === 403) {
        return { valid: false, error: 'Invalid or revoked API key' };
      }
      return { valid: false, error: `Unexpected status ${res.status} from provider` };
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return { valid: false, error: 'Verification timed out' };
      }
      return { valid: false, error: 'Could not reach OpenAI API' };
    } finally {
      clearTimeout(timer);
    }
  }

  /**
   * Run a text transformation via gpt-4o-mini.
   * - model: gpt-4o-mini (cost-effective for text correction)
   * - temperature: 0.3 (consistent corrections)
   * - max_tokens: 4096
   * - timeout: 30s
   */
  async validateText(params: ValidateTextParams): Promise<{ result: string; tokensUsed: number }> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), GENERATE_TIMEOUT_MS);

    try {
      const res = await fetch(`${OPENAI_BASE}/chat/completions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${params.rawKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
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
        const body = (await res.json().catch(() => ({}))) as OpenAIErrorBody;
        const msg = body.error?.message ?? `OpenAI error ${res.status}`;
        throw new ProviderError('openai', res.status, msg);
      }

      const data = (await res.json()) as OpenAIChatResponse;
      const content = data.choices[0]?.message?.content;

      if (!content) {
        throw new ProviderError('openai', 500, 'Empty response content from OpenAI');
      }

      return {
        result: content.trim(),
        tokensUsed: data.usage?.total_tokens ?? 0,
      };
    } catch (err) {
      if (err instanceof ProviderError) throw err;
      if (err instanceof Error && err.name === 'AbortError') {
        throw new ProviderError('openai', 504, 'OpenAI request timed out after 30s');
      }
      throw new ProviderError('openai', 500, 'Failed to reach OpenAI API');
    } finally {
      clearTimeout(timer);
    }
  }
}
