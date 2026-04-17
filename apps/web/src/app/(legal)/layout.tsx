import type { ReactNode } from 'react';
import Link from 'next/link';

export default function LegalLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-white">
      <header className="border-b border-gray-100 px-6 py-4">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-blue-600 font-semibold hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
          >
            EDI Text Intelligence
          </Link>
          <nav className="flex gap-4 text-sm text-gray-600" aria-label="Navegación legal">
            <Link href="/privacy" className="hover:text-gray-900 focus-visible:ring-2 focus-visible:ring-blue-500 rounded">Privacidad</Link>
            <Link href="/terms" className="hover:text-gray-900 focus-visible:ring-2 focus-visible:ring-blue-500 rounded">Términos</Link>
            <Link href="/support" className="hover:text-gray-900 focus-visible:ring-2 focus-visible:ring-blue-500 rounded">Soporte</Link>
          </nav>
        </div>
      </header>

      <main id="main-content" className="mx-auto max-w-3xl px-6 py-10">
        {children}
      </main>

      <footer className="border-t border-gray-100 px-6 py-6 text-center text-xs text-gray-500">
        © {new Date().getFullYear()} EDI Text Intelligence.
        {' '}
        <Link href="/login" className="hover:underline">Iniciar sesión</Link>
        {' · '}
        <Link href="/register" className="hover:underline">Crear cuenta</Link>
      </footer>
    </div>
  );
}
