import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { headers } from 'next/headers';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'EDI — Extensión Chrome para edición de texto y conversión de imágenes',
    template: '%s | EDI',
  },
  description:
    'Extensión Chrome gratuita: editá texto en español con IA (voseo, tuteo, ortografía) y convertí imágenes WebP a JPG/PNG — 100 % local, sin subir archivos.',
  metadataBase: new URL(process.env.WEB_URL ?? 'http://localhost:3000'),
  openGraph: {
    title: 'EDI — Edición de texto y conversión de imágenes en Chrome',
    description:
      'Transformá texto en español y convertí WebP a JPG/PNG directamente en el navegador. Gratis, de código abierto, sin cuenta.',
    locale: 'es_CR',
    type: 'website',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'EDI — Extensión Chrome para edición de texto y conversión de imágenes',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'EDI — Edición de texto y conversión de imágenes en Chrome',
    description:
      'Transformá texto en español y convertí WebP a JPG/PNG directamente en el navegador. Gratis y de código abierto.',
    images: ['/og-image.png'],
  },
  robots: { index: true, follow: true },
  manifest: '/site.webmanifest',
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon-96x96.png', sizes: '96x96', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#6366f1' },
    { media: '(prefers-color-scheme: dark)', color: '#4f46e5' },
  ],
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const nonce = (await headers()).get('x-nonce') ?? undefined;
  return (
    <html lang="es-CR" dir="ltr" suppressHydrationWarning>
      <head>
        {/* nonce is forwarded to Next.js inline bootstrap scripts */}
        {nonce && <meta name="x-nonce" content={nonce} />}
      </head>
      <body className="min-h-dvh bg-gray-50 dark:bg-slate-950 font-sans antialiased transition-colors duration-150">
        <a href="#main-content" className="skip-link">
          Ir al contenido principal
        </a>
        {children}
      </body>
    </html>
  );
}
