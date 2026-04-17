import type { ReactNode } from 'react';
import Link from 'next/link';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/actions/user';
import { logoutAction } from '@/lib/actions/auth';

interface NavItem {
  href: string;
  label: string;
  icon: ReactNode;
}

const navItems: NavItem[] = [
  {
    href: '/dashboard',
    label: 'Inicio',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    href: '/profile',
    label: 'Perfil',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
  {
    href: '/credentials',
    label: 'Claves de IA',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
      </svg>
    ),
  },
  {
    href: '/account',
    label: 'Cuenta',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
];

function getPathnameFromHeaders(headersList: Headers): string {
  const referer = headersList.get('referer') ?? '';
  try {
    return new URL(referer).pathname;
  } catch {
    return '';
  }
}

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const currentUser = await getCurrentUser();
  if (!currentUser) redirect('/login');

  const { user, profile } = currentUser;
  const displayName = profile.displayName ?? user.email.split('@')[0] ?? 'Usuario';
  const avatarInitial = (profile.displayName ?? user.email)[0]?.toUpperCase() ?? 'U';

  const headersList = await headers();
  const currentPath = getPathnameFromHeaders(headersList);

  return (
    <div className="min-h-dvh bg-gray-50">
      {/* Desktop Sidebar */}
      <aside className="fixed left-0 top-0 hidden h-full w-60 flex-col bg-gray-900 lg:flex">
        <div className="flex h-16 items-center border-b border-gray-800 px-5">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-white font-semibold text-base hover:text-blue-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
          >
            <svg className="h-6 w-6 text-blue-400" viewBox="0 0 28 28" fill="currentColor" aria-hidden="true">
              <rect x="0" y="0" width="28" height="28" rx="7" />
              <text x="6" y="21" fontSize="16" fontWeight="700" fill="white" fontFamily="system-ui">E</text>
            </svg>
            EDI
          </Link>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4" aria-label="Navegación principal">
          {navItems.map((item) => {
            const isActive = currentPath === item.href || currentPath.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? 'page' : undefined}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors
                  ${isActive
                    ? 'bg-gray-800 text-white'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                  } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500`}
              >
                {item.icon}
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-gray-800 p-4">
          <div className="flex items-center gap-3 mb-3">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white text-sm font-semibold"
              aria-hidden="true"
            >
              {avatarInitial}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{displayName}</p>
              <p className="text-xs text-gray-400 truncate">{user.email}</p>
            </div>
          </div>
          <form action={logoutAction}>
            <button
              type="submit"
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-400 hover:bg-gray-800 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Cerrar sesión
            </button>
          </form>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-gray-200 bg-white px-4 lg:hidden">
        <Link href="/dashboard" className="flex items-center gap-2 text-blue-600 font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded">
          <svg className="h-6 w-6" viewBox="0 0 28 28" fill="currentColor" aria-hidden="true">
            <rect x="0" y="0" width="28" height="28" rx="7" />
            <text x="6" y="21" fontSize="16" fontWeight="700" fill="white" fontFamily="system-ui">E</text>
          </svg>
          EDI
        </Link>
        <div className="flex items-center gap-3">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white text-sm font-semibold"
            aria-label={`Avatar de ${displayName}`}
          >
            {avatarInitial}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="lg:pl-60">
        <main id="main-content" className="px-4 py-6 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Nav */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200 bg-white lg:hidden"
        aria-label="Navegación móvil"
      >
        <div className="grid grid-cols-4">
          {navItems.map((item) => {
            const isActive = currentPath === item.href || currentPath.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? 'page' : undefined}
                className={`flex flex-col items-center gap-1 py-3 text-xs font-medium transition-colors
                  ${isActive ? 'text-blue-600' : 'text-gray-500 hover:text-gray-900'}
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500`}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Mobile padding for bottom nav */}
      <div className="h-16 lg:hidden" aria-hidden="true" />
    </div>
  );
}
