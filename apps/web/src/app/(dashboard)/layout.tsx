import type { ReactNode } from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/actions/user';
import { logoutAction } from '@/lib/actions/auth';
import { DashboardSidebarLinks, DashboardMobileLinks } from '@/components/ui/DashboardNavLinks';



export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const currentUser = await getCurrentUser();
  if (!currentUser) redirect('/login?expired=1');

  const { user, profile } = currentUser;
  const displayName = profile.displayName ?? user.email.split('@')[0] ?? 'Usuario';
  const avatarInitial = (profile.displayName ?? user.email)[0]?.toUpperCase() ?? 'U';

  return (
    <div className="min-h-dvh bg-gray-50 dark:bg-slate-950">
      {/* Desktop Sidebar */}
      <aside className="fixed left-0 top-0 hidden h-full w-60 flex-col bg-gray-900 lg:flex">
        <div className="flex h-16 items-center border-b border-gray-800 px-5">
          <Link
            href="/editor"
            className="flex items-center gap-2 text-white font-semibold text-base hover:text-blue-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
          >
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="22" height="22" rx="6" fill="url(#grad)"/>
              <defs>
                <linearGradient id="grad" x1="0" y1="0" x2="22" y2="22">
                  <stop offset="0%" stopColor="#818cf8"/>
                  <stop offset="100%" stopColor="#6366f1"/>
                </linearGradient>
              </defs>
              <path d="M4 7 L7.5 15 L11 9.5 L14.5 15 L18 7"
                    transform="rotate(90 11 11)"
                    stroke="white" strokeWidth="2.2" strokeLinecap="round"
                    strokeLinejoin="round" fill="none"/>
            </svg>
            EDI
          </Link>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4" aria-label="Navegación principal">
          <DashboardSidebarLinks />
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
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-gray-200 bg-white px-4 dark:border-slate-700 dark:bg-slate-900 lg:hidden">
        <Link href="/editor" className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded">
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
        className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200 bg-white dark:border-slate-700 dark:bg-slate-900 lg:hidden"
        aria-label="Navegación móvil"
      >
        <div className="flex overflow-x-auto [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
          <DashboardMobileLinks />
        </div>
      </nav>

      {/* Mobile padding for bottom nav */}
      <div className="h-16 lg:hidden" aria-hidden="true" />
    </div>
  );
}
