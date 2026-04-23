import type { ProviderId } from '@edi/shared';
import { ProviderError, type ProviderAdapter, type ValidateTextParams } from '../ProviderAdapter.js';

// Hardcoded base URL — no user-supplied URLs (SSRF protection)
const ANTHROPIC_BASE = 'https://api.anthropic.com/v1';
const ANTHROPIC_VERSION = '2023-06-01';
const MODEL = 'claude-haiku-4-5-20251001';
const VERIFY_TIMEOUT_MS = 5_000;
const GENERATE_TIMEOUT_MS = 30_000;

interface AnthropicMessageResponse {
  content: Array<{ type: string; text: string }>;
  usage?: { input_tokens: number; output_tokens: number };
}

interface AnthropicErrorBody {
  error?: { message?: string };
}

export class AnthropicAdapter implements ProviderAdapter {
  readonly providerId: ProviderId = 'anthropic';

  /**
   * Verify key by sending a minimal 1-token message.
   * 200/400 → key is accepted by Anthropic (400 = bad request, not auth failure).
   * 401 → invalid key.
   */
  async verifyKey(rawKey: string): Promise<{ valid: boolean; error?: string }> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), VERIFY_TIMEOUT_MS);

    try {
      const res = await fetch(`${ANTHROPIC_BASE}/messages`, {
        method: 'POST',
        headers: {
          'x-api-key': rawKey,
          'anthropic-version': ANTHROPIC_VERSION,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model: MODEL,
          max_tokens: 1,
          messages: [{ role: 'user', content: 'hi' }],
        }),
        signal: controller.signal,
      });

      // 401 = auth failure; 200 = success; 400 = bad req but key accepted
      if (res.status === 401) {
        return { valid: false, error: 'Invalid or revoked Anthropic API key' };
      }
      if (res.status === 429) {
        // Rate limited — key is valid but quota exhausted
        return { valid: true };
      }
      if (res.status === 200 || res.status === 400) {
        return { valid: true };
      }
      return { valid: false, error: `Unexpected status ${res.status} from Anthropic` };
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return { valid: false, error: 'Verification timed out' };
      }
      return { valid: false, error: 'Could not reach Anthropic API' };
    } finally {
      clearTimeout(timer);
    }
  }

  /**
   * Run a text transformation via claude-haiku-3-5-20251001.
   * - max_tokens: 4096
   * - timeout: 30s
   */
  async validateText(params: ValidateTextParams): Promise<{ result: string; tokensUsed: number }> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), GENERATE_TIMEOUT_MS);

    try {
      const res = await fetch(`${ANTHROPIC_BASE}/messages`, {
        method: 'POST',
        headers: {
          'x-api-key': params.rawKey,
          'anthropic-version': ANTHROPIC_VERSION,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model: MODEL,
          max_tokens: 4096,
          system: params.systemPrompt,
          messages: [{ role: 'user', content: params.text }],
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as AnthropicErrorBody;
        const msg = body.error?.message ?? `Anthropic error ${res.status}`;
        throw new ProviderError('anthropic', res.status, msg);
      }

      const data = (await res.json()) as AnthropicMessageResponse;
      const textBlock = data.content.find((b) => b.type === 'text');

      if (!textBlock?.text) {
        throw new ProviderError('anthropic', 500, 'Empty response content from Anthropic');
      }

      const tokensUsed = (data.usage?.input_tokens ?? 0) + (data.usage?.output_tokens ?? 0);

      return {
        result: textBlock.text.trim(),
        tokensUsed,
      };
    } catch (err) {
      if (err instanceof ProviderError) throw err;
      if (err instanceof Error && err.name === 'AbortError') {
        throw new ProviderError('anthropic', 504, 'Anthropic request timed out after 30s');
      }
      throw new ProviderError('anthropic', 500, 'Failed to reach Anthropic API');
    } finally {
      clearTimeout(timer);
    }
  }
}
