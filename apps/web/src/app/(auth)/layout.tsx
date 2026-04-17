import type { ReactNode } from 'react';
import Link from 'next/link';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-gray-50 flex flex-col">
      <header className="px-6 py-5">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-blue-600 font-semibold text-lg hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
        >
          <svg className="h-7 w-7" viewBox="0 0 28 28" fill="currentColor" aria-hidden="true">
            <rect x="0" y="0" width="28" height="28" rx="7" />
            <text x="6" y="21" fontSize="16" fontWeight="700" fill="white" fontFamily="system-ui">
              E
            </text>
          </svg>
          EDI
        </Link>
      </header>

      <main id="main-content" className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">{children}</div>
      </main>

      <footer className="px-6 py-5 text-center text-xs text-gray-500">
        <nav aria-label="Pies de página">
          <Link href="/privacy" className="hover:underline focus-visible:ring-2 focus-visible:ring-blue-500 rounded">
            Privacidad
          </Link>
          {' · '}
          <Link href="/terms" className="hover:underline focus-visible:ring-2 focus-visible:ring-blue-500 rounded">
            Términos
          </Link>
          {' · '}
          <Link href="/support" className="hover:underline focus-visible:ring-2 focus-visible:ring-blue-500 rounded">
            Soporte
          </Link>
        </nav>
      </footer>
    </div>
  );
}
