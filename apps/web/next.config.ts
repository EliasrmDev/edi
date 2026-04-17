import type { NextConfig } from 'next';

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

const nextConfig: NextConfig = {
  transpilePackages: ['@edi/shared'],
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    remotePatterns: [], // no external images
  },
  headers: async () => [
    {
      source: '/(.*)',
      headers: [
        {
          key: 'Strict-Transport-Security',
          value: 'max-age=63072000; includeSubDomains; preload',
        },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        {
          key: 'Permissions-Policy',
          value: 'camera=(), microphone=(), geolocation=()',
        },
        // CSP — note: Next.js 15 nonce support reads x-nonce from middleware.
        // For nonce-per-request, see middleware.ts which overrides this per-request.
        {
          key: 'Content-Security-Policy',
          value: [
            "default-src 'self'",
            `script-src 'self' 'strict-dynamic'`,
            `style-src 'self'`,
            `img-src 'self' data: blob:`,
            `font-src 'self'`,
            `connect-src 'self' ${apiUrl}`,
            `form-action 'self'`,
            `base-uri 'self'`,
            `frame-ancestors 'none'`,
            `object-src 'none'`,
            `upgrade-insecure-requests`,
          ].join('; '),
        },
      ],
    },
  ],
};

export default nextConfig;
