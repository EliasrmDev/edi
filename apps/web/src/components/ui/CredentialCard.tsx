'use client';

import * as React from 'react';
import type { ProviderCredential } from '@edi/shared';
import { Badge } from './Badge';
import { Button } from './Button';
import { ProviderIcon, providerLabel } from './ProviderIcon';

interface CredentialCardProps {
  credential: ProviderCredential;
  onVerify?: (id: string) => void;
  onDelete?: (id: string) => void;
  onToggleEnabled?: (id: string) => void;
  verifying?: boolean;
  togglingEnabled?: boolean;
}

function getStatus(credential: ProviderCredential): {
  label: string;
  variant: 'success' | 'warning' | 'error' | 'neutral';
} {
  if (!credential.isActive) return { label: 'Inactiva', variant: 'neutral' };
  if (credential.isExpired) return { label: 'Expirada', variant: 'error' };

  if (credential.expiresAt) {
    const daysUntilExpiry = Math.ceil(
      (new Date(credential.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
    );
    if (daysUntilExpiry <= 7) {
      return { label: `Expira en ${daysUntilExpiry}d`, variant: 'warning' };
    }
  }

  return { label: 'Activa', variant: 'success' };
}

function formatDate(date: Date | string | null): string {
  if (!date) return '—';
  return new Intl.DateTimeFormat('es-CR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date));
}

export function CredentialCard({
  credential,
  onVerify,
  onDelete,
  onToggleEnabled,
  verifying = false,
  togglingEnabled = false,
}: CredentialCardProps) {
  const status = getStatus(credential);

  return (
    <article
      className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm grid grid-rows-[auto_1fr_auto] focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2 dark:border-slate-700 dark:bg-slate-800 dark:focus-within:ring-offset-slate-900"
      aria-label={`Credencial ${providerLabel(credential.provider)}: ${credential.label}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <ProviderIcon provider={credential.provider} size={36} />
          <div>
            <p className="font-medium text-gray-900 dark:text-slate-100">{credential.label}</p>
            <p className="text-xs text-gray-500 dark:text-slate-400">{providerLabel(credential.provider)}</p>
          </div>
        </div>
        <Badge variant={status.variant}>{status.label}</Badge>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-y-2 text-xs text-gray-600 dark:text-slate-300">
        <span className="font-medium text-gray-500 dark:text-slate-400">Clave</span>
        <span className="font-mono">{credential.maskedKey}</span>

        <span className="font-medium text-gray-500 dark:text-slate-400">Verificada</span>
        <span>{formatDate(credential.lastVerifiedAt)}</span>

        <span className="font-medium text-gray-500 dark:text-slate-400">Último uso</span>
        <span>{formatDate(credential.lastUsedAt)}</span>

        {credential.expiresAt && (
          <>
            <span className="font-medium text-gray-500 dark:text-slate-400">Expira</span>
            <span>{formatDate(credential.expiresAt)}</span>
          </>
        )}
      </div>

      {/* Modelos section */}
      <div className="mt-4 border-t border-gray-100 dark:border-slate-700/60 pt-3">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-slate-500">Modelos</p>
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-600 dark:text-slate-300">Habilitada como opción de IA</span>
          <button
            type="button"
            role="switch"
            aria-checked={credential.isEnabled}
            onClick={() => onToggleEnabled?.(credential.id)}
            disabled={togglingEnabled}
            aria-label={credential.isEnabled ? 'Deshabilitar credencial' : 'Habilitar credencial'}
            className={
              'relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-slate-800 disabled:opacity-50 ' +
              (credential.isEnabled ? 'bg-indigo-600 dark:bg-indigo-500' : 'bg-gray-200 dark:bg-slate-600')
            }
          >
            <span
              className={
                'pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition-transform ' +
                (credential.isEnabled ? 'translate-x-4' : 'translate-x-0')
              }
            />
          </button>
        </div>
        {!credential.isEnabled && (
          <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">Oculta de las opciones de uso</p>
        )}
      </div>

      <div className="mt-4 flex gap-2 border-t border-gray-100 dark:border-slate-700/60 pt-4">
        {onVerify && (
          <Button
            variant="secondary"
            size="sm"
            loading={verifying}
            onClick={() => onVerify(credential.id)}
            disabled={credential.isExpired}
          >
            Verificar
          </Button>
        )}
        {onDelete && (
          <Button
            variant="danger"
            size="sm"
            onClick={() => onDelete(credential.id)}
          >
            Eliminar
          </Button>
        )}
      </div>
    </article>
  );
}
