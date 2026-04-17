'use client';

import { useActionState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { forgotPasswordAction, type ForgotPasswordState } from '@/lib/actions/auth';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { useFormStatus } from 'react-dom';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" loading={pending}>
      Enviar enlace de recuperación
    </Button>
  );
}

export default function ForgotPasswordPage() {
  const [state, formAction] = useActionState<ForgotPasswordState, FormData>(
    forgotPasswordAction,
    null,
  );
  const successRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (state?.success) successRef.current?.focus();
  }, [state]);

  if (state?.success) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm text-center" ref={successRef} tabIndex={-1}>
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
          <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <h1 className="text-xl font-semibold text-gray-900">Revisá tu correo</h1>
        <p className="mt-2 text-sm text-gray-600">
          Si existe una cuenta con ese correo, te enviamos un enlace para restablecer tu contraseña.
        </p>
        <Link href="/login" className="mt-6 inline-block text-sm text-blue-600 hover:underline">
          Volver al inicio de sesión
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
      <h1 className="text-2xl font-semibold text-gray-900">Recuperar contraseña</h1>
      <p className="mt-1.5 text-sm text-gray-500">
        Ingresá tu correo y te enviamos un enlace para restablecer tu contraseña.
      </p>

      {state?.error && (
        <div className="mt-4">
          <Alert variant="error">Ocurrió un error. Por favor intentá de nuevo.</Alert>
        </div>
      )}

      <form action={formAction} className="mt-6 space-y-4" noValidate>
        <Input
          label="Correo electrónico"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="vos@ejemplo.com"
        />
        <SubmitButton />
      </form>

      <p className="mt-4 text-center text-sm">
        <Link href="/login" className="text-blue-600 hover:underline">
          ← Volver al inicio de sesión
        </Link>
      </p>
    </div>
  );
}
