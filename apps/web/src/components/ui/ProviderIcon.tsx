import * as React from 'react';
import type { ProviderId } from '@edi/shared';

interface ProviderIconProps {
  provider: ProviderId;
  className?: string;
  size?: number;
}

export function ProviderIcon({ provider, className, size = 32 }: ProviderIconProps) {
  const iconMap: Record<ProviderId, React.ReactNode> = {
    openai: <OpenAIIcon size={size} />,
    anthropic: <AnthropicIcon size={size} />,
    'google-ai': <GoogleAIIcon size={size} />,
  };

  return (
    <span
      className={className}
      role="img"
      aria-label={providerLabel(provider)}
    >
      {iconMap[provider]}
    </span>
  );
}

export function providerLabel(provider: ProviderId): string {
  const labels: Record<ProviderId, string> = {
    openai: 'OpenAI',
    anthropic: 'Anthropic',
    'google-ai': 'Google AI',
  };
  return labels[provider];
}

function OpenAIIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect width="32" height="32" rx="8" fill="#10a37f" />
      <path
        d="M22.2 13.4a5.4 5.4 0 00-.46-4.44 5.46 5.46 0 00-5.87-2.62 5.4 5.4 0 00-4.07-1.82 5.46 5.46 0 00-5.2 3.77 5.4 5.4 0 00-3.63 2.63 5.47 5.47 0 00.67 6.4 5.4 5.4 0 00.46 4.44 5.46 5.46 0 005.87 2.62 5.4 5.4 0 004.07 1.82 5.46 5.46 0 005.2-3.77 5.4 5.4 0 003.63-2.63 5.47 5.47 0 00-.67-6.4zm-8.1 11.36a4.04 4.04 0 01-2.6-.94l.13-.07 4.3-2.49a.72.72 0 00.36-.62v-6.08l1.82 1.05a.07.07 0 010 .05v5.03a4.06 4.06 0 01-4.01 4.07zm-8.63-3.73a4.03 4.03 0 01-.49-2.72l.13.08 4.3 2.49a.72.72 0 00.72 0l5.25-3.03v2.1a.07.07 0 01-.03.06L10.97 22a4.06 4.06 0 01-5.5-1zm-1.12-9.4a4.03 4.03 0 012.1-1.78v5.1a.71.71 0 00.36.62l5.25 3.03-1.82 1.05a.07.07 0 01-.07 0l-4.34-2.51a4.07 4.07 0 01-1.48-5.51zm14.97 3.49l-5.25-3.03 1.82-1.05a.07.07 0 01.07 0l4.34 2.51a4.06 4.06 0 01-.63 7.32V18.9a.71.71 0 00-.35-.62zm1.81-2.74l-.13-.08-4.3-2.49a.72.72 0 00-.72 0L10.75 13.3v-2.1a.07.07 0 01.03-.06L15.12 8.8a4.06 4.06 0 016.04 4.23v-.05zm-11.37 3.74l-1.82-1.05a.07.07 0 010-.05V9.97a4.06 4.06 0 016.67-3.12l-.13.07-4.3 2.49a.72.72 0 00-.36.62l-.06 6.05zm.99-2.14l2.34-1.35 2.34 1.35v2.68l-2.34 1.35-2.34-1.35V14.02z"
        fill="white"
      />
    </svg>
  );
}

function AnthropicIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect width="32" height="32" rx="8" fill="#D97757" />
      <path
        d="M18.9 8h-3.08L10 24h3.08l1.23-3.1h5.37L20.9 24H24L18.9 8zm-3.7 10.18L16.36 13l1.16 5.18h-2.32z"
        fill="white"
      />
    </svg>
  );
}

function GoogleAIIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect width="32" height="32" rx="8" fill="#4285F4" />
      <path
        d="M22.56 16.24c0-.53-.05-1.04-.14-1.53H16v2.9h3.68a3.15 3.15 0 01-1.36 2.07v1.71h2.2c1.28-1.18 2.04-2.92 2.04-5.15z"
        fill="white"
      />
      <path
        d="M16 23a7.83 7.83 0 005.44-1.99l-2.21-1.71a4.95 4.95 0 01-7.37-2.6H9.57v1.77A8 8 0 0016 23z"
        fill="#34A853"
      />
      <path
        d="M11.86 16.7a4.83 4.83 0 010-3.07V11.86H9.57a8 8 0 000 7.61l2.29-1.77z"
        fill="#FBBC05"
      />
      <path
        d="M16 11.13a4.33 4.33 0 013.05 1.19l2.28-2.28A7.7 7.7 0 0016 8a8 8 0 00-6.43 3.86l2.29 1.77A4.77 4.77 0 0116 11.13z"
        fill="#EA4335"
      />
    </svg>
  );
}


