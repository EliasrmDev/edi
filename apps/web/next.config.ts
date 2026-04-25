import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@edi/shared'],
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
    ],
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
        // CSP is set per-request in middleware.ts with a unique nonce.
        // A static CSP here with 'strict-dynamic' and no nonce would block
        // all inline scripts (including Next.js hydration) on any path the
        // middleware returns early on. Do NOT add a CSP here.
      ],
    },
  ],
};

export default nextConfig;
