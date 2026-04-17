import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { headers } from 'next/headers';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'EDI Text Intelligence',
    template: '%s | EDI Text Intelligence',
  },
  description:
    'Edición inteligente de texto en español con localización para Costa Rica — voseo, tono, ortografía.',
  metadataBase: new URL(process.env.WEB_URL ?? 'http://localhost:3000'),
  openGraph: {
    title: 'EDI Text Intelligence',
    description: 'Edición inteligente de texto en español con localización para Costa Rica.',
    locale: 'es_CR',
    type: 'website',
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const nonce = (await headers()).get('x-nonce') ?? undefined;
  return (
    <html lang="es-CR" dir="ltr">
      <head>
        {/* nonce is forwarded to Next.js inline bootstrap scripts */}
        {nonce && <meta name="x-nonce" content={nonce} />}
      </head>
      <body className="min-h-dvh bg-gray-50 font-sans antialiased">
        <a href="#main-content" className="skip-link">
          Ir al contenido principal
        </a>
        {children}
      </body>
    </html>
  );
}
