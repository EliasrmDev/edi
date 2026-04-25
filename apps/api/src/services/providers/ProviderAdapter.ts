import type { ProviderId, TransformationType, ToneType } from '@edi/shared';
import { OpenAIAdapter } from './adapters/OpenAIAdapter.js';
import { AnthropicAdapter } from './adapters/AnthropicAdapter.js';
import { GoogleAIAdapter } from './adapters/GoogleAIAdapter.js';
import { OpenRouterAdapter } from './adapters/OpenRouterAdapter.js';

/**
 * Normalised usage data returned by a provider's usage API.
 * `supported: false` means this provider has no per-key usage API;
 * `unavailableUrl` links the user to their dashboard instead.
 */
export type ProviderUsageData =
  | {
      supported: true;
      creditsUsed: number;        // USD spent
      creditsLimit: number | null; // null = no limit / pay-as-you-go
      creditsRemaining: number | null;
      isFreeTier: boolean;
    }
  | {
      supported: false;
      unavailableUrl: string;     // link to provider's own dashboard
    };

export interface ValidateTextParams {
  rawKey: string;
  text: string;
  transformation: TransformationType;
  tone: ToneType | undefined;
  locale: string;
  systemPrompt: string;
  model?: string;
}

/**
 * Typed error from an AI provider.
 * Carries the provider identity and HTTP status code for proper error handling.
 */
export class ProviderError extends Error {
  constructor(
    public readonly provider: ProviderId,
    public readonly statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = 'ProviderError';
  }
}

/**
 * Common interface for all AI provider adapters.
 * Adapters are the ONLY callers of external AI APIs.
 * All URLs are hardcoded — no user-supplied URLs accepted (SSRF protection).
 */
export interface ProviderAdapter {
  readonly providerId: ProviderId;

  /**
   * Verify that an API key is accepted by the provider.
   * Makes a minimal, low-cost test call.
   */
  verifyKey(rawKey: string): Promise<{ valid: boolean; error?: string }>;

  /**
   * Run an AI text transformation.
   * Returns the transformed text and token count.
   */
  validateText(params: ValidateTextParams): Promise<{ result: string; tokensUsed: number }>;

  /**
   * Fetch current usage/credits for the given API key from the provider.
   * Returns normalised ProviderUsageData; never throws (errors are returned as supported:false).
   */
  getUsage(rawKey: string): Promise<ProviderUsageData>;
}

/**
 * Factory — returns the concrete adapter for the given provider.
 */
export function getAdapter(provider: ProviderId): ProviderAdapter {
  switch (provider) {
    case 'openai':
      return new OpenAIAdapter();
    case 'anthropic':
      return new AnthropicAdapter();
    case 'google-ai':
      return new GoogleAIAdapter();
    case 'openrouter':
      return new OpenRouterAdapter();
    default: {
      const _exhaustive: never = provider;
      throw new Error(`Unknown provider: ${String(_exhaustive)}`);
    }
  }
}
