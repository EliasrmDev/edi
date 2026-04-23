'use client';

import { useState, useEffect, useCallback } from 'react';
import type { ProviderCredential } from '@edi/shared';
import { Button } from '@/components/ui/Button';
import { ProviderIcon, providerLabel } from '@/components/ui/ProviderIcon';
import {
  getCredentialModels,
  setCredentialModel,
  clearCredentialModel,
  toggleFavoriteModel,
  type ModelInfo,
} from '@/lib/actions/models';

// ── Types ─────────────────────────────────────────────────────────────────────

type ProviderId = 'openai' | 'anthropic' | 'google-ai';
type Tab = 'all' | ProviderId;
type Sort = 'selected-first' | 'az';

interface CredentialState {
  models: ModelInfo[] | null;
  loading: boolean;
  error: string | null;
  selectedModel: string | null;
  favoriteModels: string[];
  toggling: string | null; // modelId currently being activated/deactivated
  togglingFav: string | null; // modelId whose favorite is being toggled
}

// ── Spinner ───────────────────────────────────────────────────────────────────

function Spinner({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className}`} fill="none" viewBox="0 0 24 24" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

// ── SyncIcon ──────────────────────────────────────────────────────────────────

function SyncIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  );
}

// ── Hook ──────────────────────────────────────────────────────────────────────

function useModels(credentials: ProviderCredential[]) {
  const [states, setStates] = useState<Record<string, CredentialState>>(() =>
    Object.fromEntries(
      credentials.map((c) => [
        c.id,
        { models: null, loading: true, error: null, selectedModel: c.selectedModel, favoriteModels: c.favoriteModels, toggling: null, togglingFav: null },
      ]),
    ),
  );

  const patch = useCallback(
    (credId: string, update: Partial<CredentialState>) =>
      setStates((prev) => ({ ...prev, [credId]: { ...prev[credId]!, ...update } })),
    [],
  );

  const loadForCredential = useCallback(
    async (credId: string) => {
      patch(credId, { loading: true, error: null });
      const { data, error } = await getCredentialModels(credId);
      if (error) {
        patch(credId, { loading: false, error });
      } else {
        patch(credId, { loading: false, models: data ?? [] });
      }
    },
    [patch],
  );

  // Auto-load all credentials on mount
  useEffect(() => {
    void Promise.all(credentials.map((c) => loadForCredential(c.id)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const syncCredentials = useCallback(
    async (credIds: string[]) => {
      await Promise.all(credIds.map((id) => loadForCredential(id)));
    },
    [loadForCredential],
  );

  const activateModel = useCallback(
    async (credId: string, modelId: string) => {
      patch(credId, { toggling: modelId });
      const { error } = await setCredentialModel(credId, modelId);
      if (error) {
        patch(credId, { toggling: null, error });
      } else {
        patch(credId, { toggling: null, error: null, selectedModel: modelId });
      }
    },
    [patch],
  );

  const deactivateModel = useCallback(
    async (credId: string) => {
      const state = states[credId];
      if (!state?.selectedModel) return;
      patch(credId, { toggling: state.selectedModel });
      const { error } = await clearCredentialModel(credId);
      if (error) {
        patch(credId, { toggling: null, error });
      } else {
        patch(credId, { toggling: null, error: null, selectedModel: null });
      }
    },
    [patch, states],
  );

  const deactivateAll = useCallback(
    async (credIds: string[]) => {
      await Promise.all(
        credIds
          .filter((id) => states[id]?.selectedModel !== null)
          .map((id) => deactivateModel(id)),
      );
    },
    [states, deactivateModel],
  );

  const toggleFavorite = useCallback(
    async (credId: string, modelId: string) => {
      const state = states[credId];
      if (!state) return;
      const isFav = state.favoriteModels.includes(modelId);
      const action = isFav ? 'remove' : 'add';
      patch(credId, { togglingFav: modelId });
      const { error } = await toggleFavoriteModel(credId, modelId, action);
      if (error) {
        patch(credId, { togglingFav: null, error });
      } else {
        const next = isFav
          ? state.favoriteModels.filter((id) => id !== modelId)
          : [...state.favoriteModels, modelId];
        patch(credId, { togglingFav: null, favoriteModels: next });
      }
    },
    [patch, states],
  );

  return { states, syncCredentials, activateModel, deactivateModel, deactivateAll, toggleFavorite };
}

// ── Main component ─────────────────────────────────────────────────────────────

interface ModelsClientProps {
  credentials: ProviderCredential[];
}

export function ModelsClient({ credentials }: ModelsClientProps) {
  const { states, syncCredentials, activateModel, deactivateModel, deactivateAll, toggleFavorite } =
    useModels(credentials);

  const [activeTab, setActiveTab] = useState<Tab>('all');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<Sort>('selected-first');
  const [syncingProviders, setSyncingProviders] = useState<Set<string>>(new Set());

  // ── Empty state ────────────────────────────────────────────────────────────

  if (credentials.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 bg-white py-16 text-center">
        <svg
          className="mx-auto mb-4 h-10 w-10 text-gray-300"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18"
          />
        </svg>
        <p className="text-sm font-medium text-gray-500">No hay claves de IA configuradas.</p>
        <p className="mt-1 text-xs text-gray-400">
          Agregá una clave en{' '}
          <a href="/credentials" className="text-blue-600 hover:underline">
            Claves de IA
          </a>{' '}
          para poder seleccionar modelos.
        </p>
      </div>
    );
  }

  // ── Derived data ───────────────────────────────────────────────────────────

  // Unique providers present in credentials
  const providers = [...new Set(credentials.map((c) => c.provider as ProviderId))].sort();

  // Credentials visible in active tab
  const tabCredentials =
    activeTab === 'all' ? credentials : credentials.filter((c) => c.provider === activeTab);

  // Counts per tab: { enabled, total }
  function tabCounts(tab: Tab): { enabled: number; total: number | null } {
    const creds = tab === 'all' ? credentials : credentials.filter((c) => c.provider === tab);
    const anyLoading = creds.some((c) => states[c.id]?.loading);
    if (anyLoading) return { enabled: 0, total: null };
    const enabled = creds.filter((c) => states[c.id]?.selectedModel !== null).length;
    const total = creds.reduce((acc, c) => acc + (states[c.id]?.models?.length ?? 0), 0);
    return { enabled, total };
  }

  function countLabel(tab: Tab) {
    const { enabled, total } = tabCounts(tab);
    if (total === null) return '…';
    return `${enabled}/${total}`;
  }

  // ── Actions ────────────────────────────────────────────────────────────────

  async function handleSync() {
    const ids = tabCredentials.map((c) => c.id);
    setSyncingProviders((prev) => new Set([...prev, activeTab]));
    await syncCredentials(ids);
    setSyncingProviders((prev) => {
      const next = new Set(prev);
      next.delete(activeTab);
      return next;
    });
  }

  async function handleDeactivateAll() {
    const ids = tabCredentials.map((c) => c.id);
    await deactivateAll(ids);
  }

  const isSyncing = syncingProviders.has(activeTab);
  const syncLabel =
    activeTab === 'all'
      ? 'Sync Todo'
      : `Sync ${providerLabel(activeTab as ProviderId)}`;

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      {/* ── Tabs ── */}
      <div className="flex flex-wrap items-center gap-1 rounded-xl border border-gray-200 bg-white p-1.5 shadow-sm">
        {(['all', ...providers] as Tab[]).map((tab) => {
          const isActive = activeTab === tab;
          const label = tab === 'all' ? 'Todos' : providerLabel(tab as ProviderId);
          return (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={
                'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ' +
                (isActive
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900')
              }
            >
              {tab !== 'all' && (
                <ProviderIcon provider={tab as ProviderId} size={16} />
              )}
              {label}
              <span
                className={
                  'rounded-full px-1.5 py-0.5 text-xs font-semibold ' +
                  (isActive ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500')
                }
              >
                {countLabel(tab)}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Action bar ── */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Search */}
        <div className="relative flex-1 min-w-[180px]">
          <svg
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
          </svg>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar modelos…"
            className="h-9 w-full rounded-lg border border-gray-300 bg-white pl-9 pr-3 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
            aria-label="Buscar modelos"
          />
        </div>

        {/* Sort toggle */}
        <button
          type="button"
          onClick={() => setSort((s) => (s === 'selected-first' ? 'az' : 'selected-first'))}
          className="flex h-9 items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 text-sm font-medium text-gray-600 transition-colors hover:border-gray-400 hover:bg-gray-50"
          title={sort === 'selected-first' ? 'Ordenado: Seleccionados primero' : 'Ordenado: A-Z'}
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
          </svg>
          {sort === 'selected-first' ? 'Seleccionados primero' : 'A-Z'}
        </button>

        {/* Sync */}
        <Button
          variant="secondary"
          size="sm"
          onClick={() => { void handleSync(); }}
          disabled={isSyncing}
          className="h-9 gap-1.5"
        >
          {isSyncing ? <Spinner className="h-4 w-4" /> : <SyncIcon />}
          {syncLabel}
        </Button>

        {/* Deactivate all */}
        <Button
          variant="secondary"
          size="sm"
          onClick={() => { void handleDeactivateAll(); }}
          className="h-9 gap-1.5 text-red-600 hover:border-red-300 hover:bg-red-50"
        >
          Desactivar todos
        </Button>
      </div>

      {/* ── Credential sections ── */}
      {tabCredentials.map((cred) => {
        const state = states[cred.id];
        if (!state) return null;

        const q = search.toLowerCase();
        const filtered = (state.models ?? []).filter(
          (m) =>
            !q ||
            m.id.toLowerCase().includes(q) ||
            m.name.toLowerCase().includes(q),
        );

        const sorted = (() => {
          const favs = filtered.filter((m) => state.favoriteModels.includes(m.id));
          const rest = filtered.filter((m) => !state.favoriteModels.includes(m.id));
          const byName = (a: ModelInfo, b: ModelInfo) => a.name.localeCompare(b.name);
          const bySelectedThenName = (a: ModelInfo, b: ModelInfo) => {
            const aA = state.selectedModel === a.id ? 1 : 0;
            const bA = state.selectedModel === b.id ? 1 : 0;
            return bA - aA || byName(a, b);
          };
          const sortFn = sort === 'selected-first' ? bySelectedThenName : byName;
          return [...favs.sort(sortFn), ...rest.sort(sortFn)];
        })();

        return (
          <div
            key={cred.id}
            className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"
          >
            {/* Credential header */}
            <div className="flex items-center justify-between gap-4 border-b border-gray-100 px-5 py-3.5">
              <div className="flex items-center gap-3 min-w-0">
                <ProviderIcon provider={cred.provider} size={24} />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-gray-900">{cred.label}</p>
                  <p className="text-xs text-gray-400 font-mono">{cred.maskedKey}</p>
                </div>
                {cred.isExpired && (
                  <span className="shrink-0 rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-600 border border-red-100">
                    Expirada
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {state.selectedModel && (
                  <span className="hidden sm:inline-flex max-w-[160px] truncate items-center rounded-full bg-blue-50 border border-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                    {state.selectedModel}
                  </span>
                )}
                {/* Per-credential sync */}
                <button
                  type="button"
                  onClick={() => { void syncCredentials([cred.id]); }}
                  disabled={state.loading}
                  className="flex h-7 w-7 items-center justify-center rounded-md text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 disabled:opacity-40"
                  title="Recargar modelos"
                  aria-label="Recargar modelos"
                >
                  {state.loading ? <Spinner className="h-3.5 w-3.5" /> : <SyncIcon className="h-3.5 w-3.5" />}
                </button>
                <span className="text-xs text-gray-400">
                  {state.loading
                    ? '…'
                    : `${state.models?.length ?? 0} ${(state.models?.length ?? 0) === 1 ? 'modelo' : 'modelos'}`}
                </span>
              </div>
            </div>

            {/* Error */}
            {state.error && (
              <div className="border-b border-red-100 bg-red-50 px-5 py-2.5">
                <p className="text-sm text-red-600">{state.error}</p>
              </div>
            )}

            {/* Loading skeleton */}
            {state.loading && (
              <div className="flex items-center justify-center gap-2 py-10 text-gray-400">
                <Spinner />
                <span className="text-sm">Cargando modelos…</span>
              </div>
            )}

            {/* Empty after filter */}
            {!state.loading && state.models !== null && sorted.length === 0 && (
              <div className="px-5 py-8 text-center text-sm text-gray-400">
                {search
                  ? `Sin resultados para "${search}"`
                  : 'No se encontraron modelos para esta clave.'}
              </div>
            )}

            {/* Model rows */}
            {!state.loading && sorted.length > 0 && (
              <div className="divide-y divide-gray-50">
                {sorted.map((model) => {
                  const isActive = state.selectedModel === model.id;
                  const isToggling = state.toggling === model.id;
                  const isFav = state.favoriteModels.includes(model.id);
                  const isTogglingFav = state.togglingFav === model.id;

                  return (
                    <div
                      key={model.id}
                      className={`flex items-center justify-between gap-4 px-5 py-3 transition-colors ${
                        isActive ? 'bg-blue-50/60' : isFav ? 'bg-amber-50/40' : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-gray-900">{model.name}</p>
                        <p className="truncate font-mono text-xs text-gray-400">{model.id}</p>
                        <div className="mt-1 flex flex-wrap gap-1.5">
                          {model.supportsVision && (
                            <span className="inline-flex items-center rounded border border-purple-100 bg-purple-50 px-1.5 py-0.5 text-xs text-purple-700">
                              Visión
                            </span>
                          )}
                          {model.supportsStreaming && (
                            <span className="inline-flex items-center rounded border border-green-100 bg-green-50 px-1.5 py-0.5 text-xs text-green-700">
                              Streaming
                            </span>
                          )}
                          {model.maxOutputTokens !== null && (
                            <span className="inline-flex items-center rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-600">
                              {model.maxOutputTokens.toLocaleString('es')} tokens
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center gap-2">
                        {/* Favorite star */}
                        <button
                          type="button"
                          onClick={() => { void toggleFavorite(cred.id, model.id); }}
                          disabled={isTogglingFav}
                          className={`flex h-7 w-7 items-center justify-center rounded-md transition-colors disabled:opacity-40 ${
                            isFav
                              ? 'text-amber-400 hover:text-amber-500'
                              : 'text-gray-300 hover:text-amber-400'
                          }`}
                          title={isFav ? 'Quitar de favoritos' : 'Agregar a favoritos'}
                          aria-label={isFav ? 'Quitar de favoritos' : 'Agregar a favoritos'}
                        >
                          {isTogglingFav ? (
                            <Spinner className="h-4 w-4" />
                          ) : (
                            <svg
                              className="h-4 w-4"
                              viewBox="0 0 24 24"
                              fill={isFav ? 'currentColor' : 'none'}
                              stroke="currentColor"
                              strokeWidth={2}
                              aria-hidden="true"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                            </svg>
                          )}
                        </button>

                        {/* Activate / En uso */}
                        {isToggling ? (
                          <div className="flex h-8 w-20 items-center justify-center">
                            <Spinner className="h-4 w-4 text-gray-400" />
                          </div>
                        ) : isActive ? (
                          <button
                            type="button"
                            onClick={() => { void deactivateModel(cred.id); }}
                            className="inline-flex items-center gap-1 rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold text-white transition-colors hover:bg-blue-700"
                            title="Clic para desactivar"
                          >
                            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3} aria-hidden="true">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                            En uso
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => { void activateModel(cred.id, model.id); }}
                            disabled={!!state.toggling}
                            className="inline-flex items-center rounded-full border border-green-300 bg-green-50 px-3 py-1 text-xs font-semibold text-green-700 transition-colors hover:border-green-400 hover:bg-green-100 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            Activar
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

