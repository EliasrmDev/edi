'use client';

import { useActionState, useTransition, useRef, useEffect, useState } from 'react';
import Link from 'next/link';
import type { ProviderCredential } from '@edi/shared';
import {
  deleteCredentialAction,
  verifyCredentialAction,
  type DeleteCredentialState,
  type VerifyCredentialState,
} from '@/lib/actions/credentials';
import { CredentialCard } from '@/components/ui/CredentialCard';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { Dialog } from '@/components/ui/Dialog';

interface CredentialsClientProps {
  credentials: ProviderCredential[];
  successMessage?: string;
}

export function CredentialsClient({ credentials, successMessage }: CredentialsClientProps) {
  const [deleteState, deleteAction] = useActionState<DeleteCredentialState, FormData>(
    deleteCredentialAction,
    null,
  );
  const [verifyState, verifyAction] = useActionState<VerifyCredentialState, FormData>(
    verifyCredentialAction,
    null,
  );
  const [isVerifyPending, startVerifyTransition] = useTransition();
  const [, startDeleteTransition] = useTransition();
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [showSuccessMsg, setShowSuccessMsg] = useState(!!successMessage);
  const [showDeleteError, setShowDeleteError] = useState(false);
  const [showVerifyError, setShowVerifyError] = useState(false);
  const [showVerifySuccess, setShowVerifySuccess] = useState(false);
  const alertRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (deleteState?.error || verifyState?.error || verifyState?.success) {
      alertRef.current?.focus();
    }
    if (verifyState?.error || verifyState?.success) {
      setVerifyingId(null);
    }
  }, [deleteState, verifyState]);

  useEffect(() => {
    if (!successMessage) return;
    setShowSuccessMsg(true);
    const t = setTimeout(() => setShowSuccessMsg(false), 5000);
    return () => clearTimeout(t);
  }, [successMessage]);

  useEffect(() => {
    if (!deleteState?.error) return;
    setShowDeleteError(true);
    const t = setTimeout(() => setShowDeleteError(false), 5000);
    return () => clearTimeout(t);
  }, [deleteState]);

  useEffect(() => {
    if (!verifyState?.error) return;
    setShowVerifyError(true);
    const t = setTimeout(() => setShowVerifyError(false), 5000);
    return () => clearTimeout(t);
  }, [verifyState]);

  useEffect(() => {
    if (!verifyState?.success || isVerifyPending) return;
    setShowVerifySuccess(true);
    const t = setTimeout(() => setShowVerifySuccess(false), 5000);
    return () => clearTimeout(t);
  }, [verifyState, isVerifyPending]);

  function handleVerify(id: string) {
    setVerifyingId(id);
    const fd = new FormData();
    fd.set('credentialId', id);
    startVerifyTransition(() => verifyAction(fd));
  }

  if (credentials.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 py-16 text-center">
        <svg className="h-12 w-12 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
        </svg>
        <h2 className="text-base font-medium text-gray-900">No tenés claves configuradas</h2>
        <p className="mt-1 text-sm text-gray-500">Agregá tu primera clave de IA para empezar.</p>
        <Link href="/credentials/new">
          <Button className="mt-6">Agregar clave</Button>
        </Link>
      </div>
    );
  }

  return (
    <div>
      {(showSuccessMsg || showDeleteError || showVerifyError || showVerifySuccess) && (
        <div ref={alertRef} tabIndex={-1} className="mb-5">
          {showSuccessMsg && <Alert variant="success">{successMessage === 'created' ? 'Clave agregada correctamente.' : 'Clave eliminada.'}</Alert>}
          {showDeleteError && <Alert variant="error">Error al eliminar la clave.</Alert>}
          {showVerifyError && <Alert variant="error">{verifyState?.error}</Alert>}
          {showVerifySuccess && !isVerifyPending  && <Alert variant="success">¡Clave verificada correctamente!</Alert>}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {credentials.map((credential) => (
          <CredentialCard
            key={credential.id}
            credential={credential}
            onVerify={handleVerify}
            onDelete={(id) => setDeleteTarget(id)}
            verifying={isVerifyPending && verifyingId === credential.id}
          />
        ))}
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteTarget !== null}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        title="¿Eliminar credencial?"
        description="Esta acción es irreversible. La clave cifrada será eliminada permanentemente."
        confirmLabel="Eliminar"
        confirmVariant="danger"
        onConfirm={() => {
          if (!deleteTarget) return;
          const fd = new FormData();
          fd.set('credentialId', deleteTarget);
          startDeleteTransition(() => deleteAction(fd));
          setDeleteTarget(null);
        }}
      />
    </div>
  );
}
