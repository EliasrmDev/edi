'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { DownloadIconSmall, LogoIcon } from './icons';

const CHROME_STORE_URL =
  'https://chromewebstore.google.com/detail/ddpmgmfjgahalfnfmiokdjpheefndjbm?utm_source=edi-web';

const NAV_LINKS = [
  { href: '#features', label: 'Funciones' },
  { href: '#how-it-works', label: 'Cómo funciona' },
  { href: '#privacy', label: 'Privacidad' },
  { href: '#faq', label: 'FAQ' },
] as const;

export function Navbar() {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  const close = useCallback(() => {
    setOpen(false);
    toggleRef.current?.focus();
  }, []);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && open) close();
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, close]);

  return (
    <nav
      className="sticky top-0 z-50 border-b border-[var(--c-border)] bg-white/90 backdrop-blur-md dark:bg-[#0f172a]/92"
      aria-label="Navegación principal"
    >
      <div className="mx-auto flex h-15 max-w-[1080px] items-center justify-between px-6">
        <Link
          href="/"
          className="flex items-center gap-2.5 text-[17px] font-bold text-[var(--c-text-1)] no-underline hover:no-underline"
          aria-label="EDI — inicio"
        >
          <LogoIcon className="shrink-0" />
          EDI
        </Link>

        {/* Mobile toggle */}
        <button
          ref={toggleRef}
          className="hidden flex-col justify-center gap-[5px] rounded-md border-none bg-transparent p-1.5 max-sm:flex"
          aria-expanded={open}
          aria-controls="nav-menu"
          aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
          onClick={() => setOpen((v) => !v)}
          style={{ width: 36, height: 36 }}
        >
          <span
            className="block h-0.5 w-full rounded-sm bg-[var(--c-text-1)] transition-transform"
            style={open ? { transform: 'translateY(7px) rotate(45deg)' } : undefined}
          />
          <span
            className="block h-0.5 w-full rounded-sm bg-[var(--c-text-1)] transition-opacity"
            style={open ? { opacity: 0 } : undefined}
          />
          <span
            className="block h-0.5 w-full rounded-sm bg-[var(--c-text-1)] transition-transform"
            style={open ? { transform: 'translateY(-7px) rotate(-45deg)' } : undefined}
          />
        </button>

        {/* Desktop links */}
        <div
          ref={menuRef}
          id="nav-menu"
          role="list"
          className={`flex gap-7 max-sm:absolute max-sm:inset-x-0 max-sm:top-15 max-sm:z-50 max-sm:flex-col max-sm:gap-0 max-sm:border-b max-sm:border-[var(--c-border)] max-sm:bg-white max-sm:py-2 max-sm:shadow-lg dark:max-sm:bg-[#1e293b] ${
            open ? 'max-sm:flex' : 'max-sm:hidden'
          }`}
        >
          {NAV_LINKS.map(({ href, label }) => (
            <a
              key={href}
              href={href}
              role="listitem"
              className="text-sm font-medium text-[var(--c-text-2)] hover:text-[var(--c-text-1)] hover:no-underline max-sm:px-6 max-sm:py-3 max-sm:text-[15px] max-sm:hover:bg-[var(--c-bg)]"
              onClick={() => setOpen(false)}
            >
              {label}
            </a>
          ))}
        </div>

        {/* CTA */}
        <a
          href={CHROME_STORE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--color-primary)] px-4.5 py-2 text-sm font-semibold text-white no-underline hover:bg-[var(--color-primary-dark)] hover:text-white hover:no-underline max-sm:hidden"
        >
          <DownloadIconSmall />
          Agregar a Chrome
        </a>
      </div>
    </nav>
  );
}
