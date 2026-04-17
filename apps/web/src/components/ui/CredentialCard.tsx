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
  verifying?: boolean;
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
  verifying = false,
}: CredentialCardProps) {
  const status = getStatus(credential);

  return (
    <article
      className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
      aria-label={`Credencial ${providerLabel(credential.provider)}: ${credential.label}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <ProviderIcon provider={credential.provider} size={36} />
          <div>
            <p className="font-medium text-gray-900">{credential.label}</p>
            <p className="text-xs text-gray-500">{providerLabel(credential.provider)}</p>
          </div>
        </div>
        <Badge variant={status.variant}>{status.label}</Badge>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-y-2 text-xs text-gray-600">
        <span className="font-medium text-gray-500">Clave</span>
        <span className="font-mono">{credential.maskedKey}</span>

        <span className="font-medium text-gray-500">Verificada</span>
        <span>{formatDate(credential.lastVerifiedAt)}</span>

        <span className="font-medium text-gray-500">Último uso</span>
        <span>{formatDate(credential.lastUsedAt)}</span>

        {credential.expiresAt && (
          <>
            <span className="font-medium text-gray-500">Expira</span>
            <span>{formatDate(credential.expiresAt)}</span>
          </>
        )}
      </div>

      <div className="mt-4 flex gap-2 border-t border-gray-100 pt-4">
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
