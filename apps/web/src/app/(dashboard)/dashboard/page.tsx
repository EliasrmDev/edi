import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/actions/user';
import { getCredentials } from '@/lib/actions/credentials';

export const metadata: Metadata = { title: 'Inicio' };

export default async function DashboardPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser) redirect('/login?expired=1');

  const credentials = await getCredentials();

  const profile = currentUser.profile;
  const user = currentUser.user;
  const displayName = profile?.displayName ?? user?.email?.split('@')[0] ?? 'Usuario';

  const activeCredentials = credentials.filter((c) => c.isActive && !c.isExpired);
  const expiringCredentials = credentials.filter((c) => {
    if (!c.expiresAt || c.isExpired) return false;
    const days = Math.ceil(
      (new Date(c.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
    );
    return days <= 7;
  });

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-slate-100">
          ¡Hola, {displayName}!
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
          Bienvenido a EDI Text Intelligence.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-8">
        <StatCard
          label="Claves activas"
          value={String(activeCredentials.length)}
          href="/credentials"
          icon={
            <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          }
        />
        <StatCard
          label="Proveedor por defecto"
          value={activeCredentials[0]?.provider ?? '—'}
          href="/credentials"
          icon={
            <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          }
        />
        <StatCard
          label="Tono por defecto"
          value={toneLabel(profile?.defaultTone)}
          href="/profile"
          icon={
            <svg className="h-5 w-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
            </svg>
          }
        />
      </div>

      {/* Alerts */}
      {expiringCredentials.length > 0 && (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-800/50 dark:bg-amber-950/40">
          <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
            ⚠️ Tenés {expiringCredentials.length} clave{expiringCredentials.length > 1 ? 's' : ''} por expirar en los próximos 7 días.
          </p>
          <Link href="/credentials" className="mt-1 block text-sm text-amber-700 dark:text-amber-400 underline">
            Ver claves
          </Link>
        </div>
      )}

      {/* Quick Actions */}
      <section aria-labelledby="quick-actions-heading">
        <h2 id="quick-actions-heading" className="mb-4 text-base font-semibold text-gray-900 dark:text-slate-100">
          Acciones rápidas
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <QuickAction
            href="/credentials/new"
            label="Agregar clave de IA"
            description="Conectá OpenAI, Anthropic o Google AI"
          />
          <QuickAction
            href="/profile"
            label="Configurar tono"
            description="Establecé voseo, tuteo o ustedeo"
          />
          <QuickAction
            href="/account/privacy"
            label="Controlar privacidad"
            description="Gestioná tus datos y preferencias"
          />
        </div>
      </section>

      {/* Extension Install Hint */}
      <section className="mt-8 rounded-xl border border-blue-100 bg-blue-50 p-5 dark:border-blue-800/50 dark:bg-blue-950/40" aria-labelledby="extension-hint">
        <h2 id="extension-hint" className="text-sm font-semibold text-blue-900 dark:text-blue-300">
          Extensión para Chrome
        </h2>
        <p className="mt-1 text-sm text-blue-700 dark:text-blue-400">
          Instalá la extensión de EDI en Chrome para transformar texto directamente en cualquier campo de texto.
        </p>
      </section>
    </div>
  );
}

function toneLabel(tone?: string): string {
  const labels: Record<string, string> = {
    'voseo-cr': 'Voseo (CR)',
    tuteo: 'Tuteo',
    ustedeo: 'Ustedeo',
  };
  return (tone ? labels[tone] : undefined) ?? 'No configurado';
}

function StatCard({
  label,
  value,
  href,
  icon,
}: {
  label: string;
  value: string;
  href: string;
  icon: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm hover:border-blue-200 hover:shadow-md transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-blue-600 dark:hover:shadow-slate-900/40"
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-50 dark:bg-slate-700">
        {icon}
      </div>
      <div>
        <p className="text-xs text-gray-500 dark:text-slate-400">{label}</p>
        <p className="text-lg font-semibold text-gray-900 dark:text-slate-100 capitalize">{value}</p>
      </div>
    </Link>
  );
}

function QuickAction({
  href,
  label,
  description,
}: {
  href: string;
  label: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-start gap-3 rounded-xl border border-gray-200 bg-white p-4 hover:border-blue-200 hover:shadow-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-blue-600"
    >
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950/60">
        <svg className="h-4 w-4 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
      </div>
      <div>
        <p className="text-sm font-medium text-gray-900 dark:text-slate-100">{label}</p>
        <p className="text-xs text-gray-500 dark:text-slate-400">{description}</p>
      </div>
    </Link>
  );
}

import * as React from 'react';
