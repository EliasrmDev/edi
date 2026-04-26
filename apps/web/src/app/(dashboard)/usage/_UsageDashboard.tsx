'use client';

import * as React from 'react';
import type { ReactNode } from 'react';
import type { UsageStats } from '@/lib/actions/transform';

// ── Label maps ────────────────────────────────────────────────────────────

const PROVIDER_LABELS: Record<string, string> = {
  openai: 'OpenAI',
  anthropic: 'Anthropic',
  'google-ai': 'Google AI',
  openrouter: 'OpenRouter',
  unknown: 'Local',
};

const TYPE_LABELS: Record<string, string> = {
  uppercase: 'Mayúsculas',
  lowercase: 'Minúsculas',
  'sentence-case': 'Primera mayúscula',
  'remove-formatting': 'Quitar formato',
  'correct-orthography': 'Ortografía',
  'tone-voseo-cr': 'Voseo CR',
  'tone-tuteo': 'Tuteo',
  'tone-ustedeo': 'Ustedeo',
  'copy-writing-cr': 'Copywriting CR',
};

const SOURCE_META: Record<string, { label: string; badge: string }> = {
  'ai-validated': {
    label: 'Validado por IA',
    badge:
      'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400',
  },
  'ai-fallback': {
    label: 'Fallback IA',
    badge:
      'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400',
  },
  local: {
    label: 'Local',
    badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400',
  },
};

// ── Helpers ───────────────────────────────────────────────────────────────

function fmtProvider(p: string | null): string {
  return p ? (PROVIDER_LABELS[p] ?? p) : '—';
}

function fmtType(t: string): string {
  return TYPE_LABELS[t] ?? t;
}

function fmtSource(s: string): { label: string; badge: string } {
  return (
    SOURCE_META[s] ?? {
      label: s,
      badge:
        'bg-gray-100 text-gray-700 dark:bg-slate-700 dark:text-slate-300',
    }
  );
}

function fmtMs(ms: number): string {
  return ms >= 1000 ? `${(ms / 1000).toFixed(1)}s` : `${ms}ms`;
}

function fmtDateTime(iso: string): string {
  const d = new Date(iso);
  const tz = 'America/Costa_Rica';
  return (
    d.toLocaleDateString('es-CR', { day: 'numeric', month: 'short', timeZone: tz }) +
    ' ' +
    d.toLocaleTimeString('es-CR', { hour: '2-digit', minute: '2-digit', timeZone: tz })
  );
}

function fmtShortDate(dateStr: string): string {
  const parts = dateStr.split('-');
  return `${parts[2]}/${parts[1]}`;
}

// ── Card ─────────────────────────────────────────────────────────────────

function Card({
  title,
  children,
  className = '',
}: {
  title?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800 ${className}`}
    >
      {title && (
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-slate-500">
          {title}
        </h2>
      )}
      {children}
    </div>
  );
}

// ── Quota bar ─────────────────────────────────────────────────────────────

function QuotaBar({
  used,
  limit,
  label,
  resetAt,
}: {
  used: number;
  limit: number;
  label: string;
  resetAt: string;
}) {
  const pct = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;
  const barColor =
    pct >= 90
      ? 'bg-red-500'
      : pct >= 70
        ? 'bg-amber-500'
        : 'bg-indigo-500';
  const textColor =
    pct >= 90
      ? 'text-red-500'
      : pct >= 70
        ? 'text-amber-500'
        : 'text-gray-400 dark:text-slate-500';

  const barFillRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    if (barFillRef.current) barFillRef.current.style.width = `${pct}%`;
  }, [pct]);

  // Computed client-side to avoid server (UTC) vs client (UTC-6) date formatting mismatch.
  const [resetLabel, setResetLabel] = React.useState('');
  React.useEffect(() => {
    const tz = 'America/Costa_Rica';
    const resetDate = new Date(resetAt);
    const now = new Date();
    const dayFmt = new Intl.DateTimeFormat('es-CR', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' });
    const isToday = dayFmt.format(resetDate) === dayFmt.format(now);
    setResetLabel(
      isToday
        ? `Reinicia hoy ${resetDate.toLocaleTimeString('es-CR', { hour: '2-digit', minute: '2-digit', timeZone: tz })}`
        : `Reinicia ${resetDate.toLocaleDateString('es-CR', { day: 'numeric', month: 'short', timeZone: tz })}`,
    );
  }, [resetAt]);

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-sm text-gray-600 dark:text-slate-300">{label}</span>
        <span className="text-sm font-semibold text-gray-900 dark:text-slate-100">
          {used}{' '}
          <span className="font-normal text-gray-400 dark:text-slate-500">
            / {limit}
          </span>
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-slate-700">
        <div
          ref={barFillRef}
          className={`h-2 rounded-full transition-all duration-500 ${barColor}`}
          role="progressbar"
          aria-valuenow={used}
          aria-valuemin={0}
          aria-valuemax={limit}
          aria-label={label}
        />
      </div>
      <p className={`mt-1 text-xs ${textColor}`}>
        {pct}% usado{resetLabel ? ` · ${resetLabel}` : ''}
      </p>
    </div>
  );
}

// ── Stat card ─────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string | number;
  sub?: string;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-slate-500">
        {label}
      </p>
      <p className="text-2xl font-bold text-gray-900 dark:text-slate-100">
        {value}
      </p>
      {sub && (
        <p className="mt-0.5 text-xs text-gray-400 dark:text-slate-500">{sub}</p>
      )}
    </div>
  );
}

// ── Bar list ──────────────────────────────────────────────────────────────

function BarFill({ pct }: { pct: number }) {
  const ref = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    if (ref.current) ref.current.style.width = `${pct}%`;
  }, [pct]);
  return (
    <div
      ref={ref}
      className="h-1.5 rounded-full bg-indigo-500 transition-all duration-500"
    />
  );
}

function BarList({
  items,
  total,
}: {
  items: { label: string; count: number; sub?: string }[];
  total: number;
}) {
  if (items.length === 0) {
    return (
      <p className="py-4 text-center text-sm text-gray-400 dark:text-slate-500">
        Sin datos
      </p>
    );
  }

  const max = Math.max(...items.map((i) => i.count), 1);

  return (
    <ul className="space-y-3" role="list">
      {items.map((item) => {
        const barPct = Math.round((item.count / max) * 100);
        const sharePct = total > 0 ? Math.round((item.count / total) * 100) : 0;
        return (
          <li key={item.label}>
            <div className="mb-1 flex items-center justify-between gap-2">
              <span className="max-w-[200px] truncate text-sm text-gray-700 dark:text-slate-200">
                {item.label}
              </span>
              <span className="shrink-0 text-sm font-medium text-gray-900 dark:text-slate-100">
                {item.count}
                <span className="ml-1.5 text-xs font-normal text-gray-400 dark:text-slate-500">
                  {sharePct}%
                </span>
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-slate-700">
              <BarFill pct={barPct} />
            </div>
            {item.sub && (
              <p className="mt-0.5 text-xs text-gray-400 dark:text-slate-500">
                {item.sub}
              </p>
            )}
          </li>
        );
      })}
    </ul>
  );
}

// ── Daily chart ───────────────────────────────────────────────────────────

interface DayData {
  date: string;
  requestCount: number;
  totalTokens: number;
  localCount: number;
  aiCount: number;
}

function DayBar({ day, isToday, maxCount }: { day: DayData; isToday: boolean; maxCount: number }) {
  const isEmpty = day.requestCount === 0;
  const totalHeightPct = Math.round((day.requestCount / maxCount) * 100);
  const aiSharePct = day.requestCount > 0
    ? Math.round((day.aiCount / day.requestCount) * 100)
    : 0;
  const localSharePct = 100 - aiSharePct;
  const barHeight = isEmpty ? '2px' : `${Math.max(totalHeightPct, 6)}%`;

  const emptyRef = React.useRef<HTMLDivElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const aiRef = React.useRef<HTMLDivElement>(null);
  const localRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (emptyRef.current) emptyRef.current.style.height = barHeight;
    if (containerRef.current) containerRef.current.style.height = barHeight;
    if (aiRef.current) aiRef.current.style.height = `${aiSharePct}%`;
    if (localRef.current) localRef.current.style.height = `${localSharePct}%`;
  }, [barHeight, aiSharePct, localSharePct]);

  const tooltipParts = [
    `${fmtShortDate(day.date)}: ${day.requestCount} req`,
    day.aiCount > 0 ? `${day.aiCount} IA` : null,
    day.localCount > 0 ? `${day.localCount} local` : null,
    day.totalTokens > 0 ? `${day.totalTokens} tokens` : null,
  ].filter(Boolean).join(' · ');

  return (
    <div
      className="group relative flex flex-1 items-end"
      title={tooltipParts}
    >
      {isEmpty ? (
        <div
          ref={emptyRef}
          className="w-full rounded-sm bg-gray-100 dark:bg-slate-700"
        />
      ) : (
        <div
          ref={containerRef}
          className="flex w-full flex-col overflow-hidden rounded-sm transition-all duration-300"
        >
          {day.aiCount > 0 && (
            <div
              ref={aiRef}
              className={`w-full shrink-0 ${isToday ? 'bg-indigo-700' : 'bg-indigo-400 dark:bg-indigo-500 group-hover:bg-indigo-500 dark:group-hover:bg-indigo-400'}`}
            />
          )}
          {day.localCount > 0 && (
            <div
              ref={localRef}
              className={`w-full shrink-0 ${isToday ? 'bg-teal-500' : 'bg-teal-400 dark:bg-teal-500 group-hover:bg-teal-500 dark:group-hover:bg-teal-400'}`}
            />
          )}
        </div>
      )}
    </div>
  );
}

function DailyChart({
  data,
  serverDateStr,
}: {
  data: UsageStats['dailyActivity'];
  // Passed from the server component so both server and client use the same anchor date,
  // preventing hydration mismatches when the component renders near a UTC midnight boundary.
  serverDateStr: string;
}) {
  const todayStr = serverDateStr;

  // Build last 30 days, filling gaps with 0
  const today = new Date(`${serverDateStr}T12:00:00Z`); // noon UTC to avoid DST edge cases
  const days = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(today);
    d.setUTCDate(d.getUTCDate() - (29 - i));
    const key = d.toISOString().slice(0, 10);
    const found = data.find((r) => r.date === key);
    return {
      date: key,
      requestCount: found?.requestCount ?? 0,
      totalTokens: found?.totalTokens ?? 0,
      localCount: found?.localCount ?? 0,
      aiCount: found?.aiCount ?? 0,
    };
  });

  const maxCount = Math.max(...days.map((d) => d.requestCount), 1);

  return (
    <div>
      <div
        className="flex h-24 items-end gap-px"
        role="img"
        aria-label="Gráfico de actividad diaria de los últimos 30 días"
      >
        {days.map((day) => (
          <DayBar
            key={day.date}
            day={day}
            isToday={day.date === todayStr}
            maxCount={maxCount}
          />
        ))}
      </div>
      <div className="mt-2 flex justify-between text-xs text-gray-400 dark:text-slate-500">
        <span>{fmtShortDate(days[0]!.date)}</span>
        <span>{fmtShortDate(days[14]!.date)}</span>
        <span>{fmtShortDate(days[29]!.date)}</span>
      </div>
      {/* Legend */}
      <div className="mt-3 flex gap-4">
        <span className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-slate-400">
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-indigo-400 dark:bg-indigo-500" />
          IA
        </span>
        <span className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-slate-400">
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-teal-400 dark:bg-teal-500" />
          Local
        </span>
        <span className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-slate-400">
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-gray-100 dark:bg-slate-700" />
          Sin actividad
        </span>
      </div>
    </div>
  );
}

// ── Recent activity table ─────────────────────────────────────────────────

function RecentTable({ records }: { records: UsageStats['recentRecords'] }) {
  if (records.length === 0) {
    return (
      <p className="py-4 text-center text-sm text-gray-400 dark:text-slate-500">
        Sin actividad reciente
      </p>
    );
  }

  return (
    <div className="-mx-6 overflow-x-auto">
      <table className="w-full text-sm" role="table">
        <thead>
          <tr className="border-b border-gray-100 dark:border-slate-700">
            <th className="px-6 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-slate-500">
              Fecha
            </th>
            <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-slate-500">
              Tipo
            </th>
            <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-slate-500">
              Proveedor
            </th>
            <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-slate-500">
              Origen
            </th>
            <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-slate-500">
              Tokens
            </th>
            <th className="px-6 py-2 text-right text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-slate-500">
              Tiempo
            </th>
          </tr>
        </thead>
        <tbody>
          {records.map((r) => {
            const { label, badge } = fmtSource(r.source);
            return (
              <tr
                key={r.id}
                className="border-b border-gray-50 transition-colors last:border-0 hover:bg-gray-50 dark:border-slate-700/50 dark:hover:bg-slate-700/30"
              >
                <td className="whitespace-nowrap px-6 py-2.5 text-xs text-gray-500 dark:text-slate-400">
                  {fmtDateTime(r.createdAt)}
                </td>
                <td className="whitespace-nowrap px-3 py-2.5 text-gray-700 dark:text-slate-200">
                  {fmtType(r.transformationType)}
                </td>
                <td className="px-3 py-2.5 text-gray-500 dark:text-slate-400">
                  {fmtProvider(r.provider)}
                </td>
                <td className="px-3 py-2.5">
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${badge}`}
                  >
                    {label}
                  </span>
                </td>
                <td className="px-3 py-2.5 text-right text-gray-500 dark:text-slate-400">
                  {r.tokensUsed != null
                    ? r.tokensUsed.toLocaleString('es-CR')
                    : '—'}
                </td>
                <td className="whitespace-nowrap px-6 py-2.5 text-right text-gray-500 dark:text-slate-400">
                  {fmtMs(r.processingMs)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ── Main dashboard ────────────────────────────────────────────────────────

export function UsageDashboard({ stats, serverDateStr }: { stats: UsageStats | null; serverDateStr: string }) {
  if (!stats) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <p className="text-center text-sm text-gray-500 dark:text-slate-400">
          No se pudieron cargar las estadísticas. Intentá recargar la página.
        </p>
      </div>
    );
  }

  const { quota, summary, byProvider, byType, bySource, dailyActivity, recentRecords } =
    stats;

  const providerItems = byProvider.map((r) => ({
    label: fmtProvider(r.provider),
    count: r.requestCount,
    sub:
      r.totalTokens > 0
        ? `${r.totalTokens.toLocaleString('es-CR')} tokens`
        : undefined,
  }));

  const typeItems = byType.map((r) => ({
    label: fmtType(r.transformationType),
    count: r.requestCount,
  }));

  const sourceItems = bySource.map((r) => ({
    label: fmtSource(r.source).label,
    count: r.requestCount,
  }));

  const fallbackPct =
    summary.totalAiRequests > 0
      ? `${Math.round((summary.totalFallbacks / summary.totalAiRequests) * 100)}% de requests IA`
      : 'sin requests IA';

  return (
    <div className="space-y-6">
      {/* Cuota de IA */}
      {quota ? (
        <Card title="Cuota de IA">
          <div className="grid gap-5 sm:grid-cols-2">
            <QuotaBar
              label="Uso diario"
              used={quota.dailyUsed}
              limit={quota.dailyLimit}
              resetAt={quota.resetDailyAt}
            />
            <QuotaBar
              label="Uso mensual"
              used={quota.monthlyUsed}
              limit={quota.monthlyLimit}
              resetAt={quota.resetMonthlyAt}
            />
          </div>
        </Card>
      ) : (
        <Card title="Cuota de IA">
          <p className="text-sm text-gray-400 dark:text-slate-500">
            Sin registro de cuota. Contacta al soporte.
          </p>
        </Card>
      )}

      {/* Resumen */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Total requests"
          value={summary.totalRequests.toLocaleString('es-CR')}
          sub="histórico total"
        />
        <StatCard
          label="Tokens usados"
          value={
            summary.totalTokens > 0
              ? summary.totalTokens.toLocaleString('es-CR')
              : '—'
          }
          sub="histórico total"
        />
        <StatCard
          label="Latencia prom."
          value={summary.avgProcessingMs > 0 ? fmtMs(summary.avgProcessingMs) : '—'}
          sub="procesamiento IA"
        />
        <StatCard
          label="Fallbacks IA"
          value={summary.totalFallbacks}
          sub={fallbackPct}
        />
      </div>

      {/* Por proveedor + Por tipo */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Por proveedor">
          <BarList items={providerItems} total={summary.totalRequests} />
        </Card>
        <Card title="Por tipo de transformación">
          <BarList items={typeItems} total={summary.totalRequests} />
        </Card>
      </div>

      {/* Por origen + Actividad diaria */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Por origen">
          <BarList items={sourceItems} total={summary.totalRequests} />
        </Card>
        <Card title="Actividad diaria — últimos 30 días">
          <DailyChart data={dailyActivity} serverDateStr={serverDateStr} />
          {dailyActivity.length > 0 && (
            <div className="mt-3 flex items-center gap-4 text-xs text-gray-400 dark:text-slate-500">
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-2.5 w-2.5 rounded-sm bg-indigo-400 dark:bg-indigo-500" />
                Días previos
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-2.5 w-2.5 rounded-sm bg-indigo-600" />
                Hoy
              </span>
            </div>
          )}
        </Card>
      </div>

      {/* Actividad reciente */}
      <Card title="Actividad reciente">
        <RecentTable records={recentRecords} />
      </Card>
    </div>
  );
}
