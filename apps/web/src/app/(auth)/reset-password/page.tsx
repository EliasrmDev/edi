'use client';

import { useActionState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { resetPasswordAction, type ResetPasswordState } from '@/lib/actions/auth';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { errorMessage } from '@/lib/utils';
import { useFormStatus } from 'react-dom';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" loading={pending}>
      Restablecer contraseña
    </Button>
  );
}

function ResetForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const [state, formAction] = useActionState<ResetPasswordState, FormData>(
    resetPasswordAction,
    null,
  );
  const alertRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (state?.error) alertRef.current?.focus();
  }, [state]);

  if (!token) {
    return (
      <Alert variant="error">
        El enlace de recuperación no es válido. Solicitá uno nuevo desde{' '}
        <Link href="/forgot-password" className="font-medium underline">
          esta página
        </Link>.
      </Alert>
    );
  }

  if (state?.success) {
    return (
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
          <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="text-sm text-gray-600">Tu contraseña fue restablecida con éxito.</p>
        <Link
          href="/login"
          className="mt-6 inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          Iniciar sesión
        </Link>
      </div>
    );
  }

  return (
    <>
      {state?.error && (
        <div ref={alertRef} tabIndex={-1}>
          <Alert variant="error">{errorMessage(state.error)}</Alert>
        </div>
      )}
      <form action={formAction} className="space-y-4" noValidate>
        <input type="hidden" name="token" value={token} />
        <PasswordInput
          label="Nueva contraseña"
          name="password"
          autoComplete="new-password"
          required
          showStrength
          description="Mínimo 8 caracteres"
        />
        <PasswordInput
          label="Confirmá la nueva contraseña"
          name="confirmPassword"
          autoComplete="new-password"
          required
        />
        <SubmitButton />
      </form>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
      <h1 className="mb-6 text-2xl font-semibold text-gray-900">Nueva contraseña</h1>
      <Suspense fallback={<div className="text-sm text-gray-500">Cargando...</div>}>
        <ResetForm />
      </Suspense>
      <p className="mt-4 text-center text-sm">
        <Link href="/login" className="text-blue-600 hover:underline">
          ← Volver al inicio de sesión
        </Link>
      </p>
    </div>
  );
}
