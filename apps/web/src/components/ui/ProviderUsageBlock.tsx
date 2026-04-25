'use client';

import * as React from 'react';
import { getProviderUsageAction, type ProviderUsageInfo } from '@/lib/actions/credentials';

interface ProviderUsageBlockProps {
  credentialId: string;
}

function UsageSkeleton() {
  return (
    <div className="flex items-center gap-2 animate-pulse">
      <div className="h-2 w-24 rounded bg-gray-200 dark:bg-slate-700" />
    </div>
  );
}

function formatUsd(value: number): string {
  return value.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 4 });
}

function UsageContent({ usage }: { usage: ProviderUsageInfo }) {
  if (!usage.supported) {
    return (
      <a
        href={usage.unavailableUrl ?? '#'}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors"
      >
        Ver consumo en el panel del proveedor
        <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2 10L10 2M10 2H5.5M10 2v4.5" />
        </svg>
      </a>
    );
  }

  const used = usage.creditsUsed ?? 0;
  const limit = usage.creditsLimit;
  const remaining = usage.creditsRemaining;
  const pct = limit && limit > 0 ? Math.min(100, (used / limit) * 100) : null;

  const barColor =
    pct === null ? 'bg-indigo-500' :
    pct >= 90 ? 'bg-red-500' :
    pct >= 70 ? 'bg-amber-500' :
    'bg-indigo-500';

  return (
    <div className="space-y-1.5">
      {pct !== null && (
        <div className="w-full h-1.5 rounded-full bg-gray-100 dark:bg-slate-700 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${barColor}`}
            style={{ width: `${pct}%` }}
            role="progressbar"
            aria-valuenow={Math.round(pct)}
            aria-valuemin={0}
            aria-valuemax={100}
          />
        </div>
      )}

      <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-gray-600 dark:text-slate-300">
        <span>
          <span className="font-medium text-gray-500 dark:text-slate-400">Gastado: </span>
          {formatUsd(used)}
          {usage.isFreeTier && <span className="ml-1 text-emerald-600 dark:text-emerald-400">(Free tier)</span>}
        </span>

        {limit !== null && limit !== undefined && (
          <span>
            <span className="font-medium text-gray-500 dark:text-slate-400">Límite: </span>
            {formatUsd(limit)}
          </span>
        )}

        {remaining !== null && remaining !== undefined && (
          <span>
            <span className="font-medium text-gray-500 dark:text-slate-400">Disponible: </span>
            {formatUsd(remaining)}
          </span>
        )}
      </div>
    </div>
  );
}

export function ProviderUsageBlock({ credentialId }: ProviderUsageBlockProps) {
  const [mounted, setMounted] = React.useState(false);
  const [usage, setUsage] = React.useState<ProviderUsageInfo | null | 'loading'>('loading');

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    if (!mounted) return;
    let cancelled = false;
    getProviderUsageAction(credentialId).then((data) => {
      if (!cancelled) setUsage(data);
    }).catch(() => {
      if (!cancelled) setUsage(null);
    });
    return () => { cancelled = true; };
  }, [credentialId, mounted]);

  // Avoid SSR — this component is client-only to prevent hydration mismatches
  if (!mounted) return null;

  return (
    <div className="mt-4 border-t border-gray-100 dark:border-slate-700/60 pt-3">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-slate-500">Consumo del proveedor</p>

      {usage === 'loading' ? (
        <UsageSkeleton />
      ) : usage === null ? (
        <p className="text-xs text-gray-400 dark:text-slate-500">No se pudo cargar el consumo</p>
      ) : (
        <UsageContent usage={usage} />
      )}
    </div>
  );
}
