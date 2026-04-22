import type { ReactNode } from 'react';
import Link from 'next/link';
import { Logo } from '@/components/landing/icons';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-gray-50 flex flex-col">
      <header className="px-6 py-5">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-indigo-400 font-semibold text-lg hover:text-violet-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 rounded"
        >
          <Logo />
          EDI
        </Link>
      </header>

      <main id="main-content" className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">{children}</div>
      </main>

      <footer className="px-6 py-5 text-center text-xs text-gray-500">
        <nav aria-label="Pies de página">
          <Link href="/privacy" className="hover:underline focus-visible:ring-2 focus-visible:ring-violet-500 rounded">
            Privacidad
          </Link>
          {' · '}
          <Link href="/terms" className="hover:underline focus-visible:ring-2 focus-visible:ring-violet-500 rounded">
            Términos
          </Link>
          {' · '}
          <Link href="/support" className="hover:underline focus-visible:ring-2 focus-visible:ring-violet-500 rounded">
            Soporte
          </Link>
        </nav>
      </footer>
    </div>
  );
}
