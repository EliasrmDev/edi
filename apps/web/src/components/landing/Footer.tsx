import Link from 'next/link';
import { LogoIconSmall } from './icons';

const GITHUB_URL = 'https://github.com/EliasrmDev/edi';

const FOOTER_LINKS = [
  { href: '#features', label: 'Funciones' },
  { href: '#privacy', label: 'Privacidad' },
  { href: '#faq', label: 'FAQ' },
  { href: GITHUB_URL, label: 'GitHub', external: true },
] as const;

export function Footer() {
  return (
    <footer className="bg-[var(--c-text-1)] py-10 text-[var(--c-text-3)] dark:bg-[#020617]">
      <div className="mx-auto flex max-w-[1080px] flex-wrap items-center justify-between gap-4 px-6">
        <Link
          href="/"
          className="flex items-center gap-2 font-bold text-white no-underline hover:text-white hover:no-underline"
          aria-label="EDI — inicio"
        >
          <LogoIconSmall />
          EDI
        </Link>

        <nav className="flex gap-6" aria-label="Navegación de pie de página">
          {FOOTER_LINKS.map(({ href, label, ...rest }) => (
            <a
              key={href}
              href={href}
              className="text-[13px] text-[var(--c-text-3)] hover:text-white hover:no-underline"
              {...('external' in rest
                ? { target: '_blank', rel: 'noopener noreferrer' }
                : {})}
            >
              {label}
              {'external' in rest && <span className="sr-only"> (abre en otra pestaña)</span>}
            </a>
          ))}
        </nav>

        <p className="text-[13px]">
          <span aria-hidden="true">©</span>
          <span className="sr-only">Copyright</span> 2026 EDI. MIT License.
        </p>
      </div>
    </footer>
  );
}
