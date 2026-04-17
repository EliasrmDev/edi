'use client';

import { useActionState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { loginAction, type LoginState } from '@/lib/actions/auth';
import { Input } from '@/components/ui/Input';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { errorMessage } from '@/lib/utils';
import { useFormStatus } from 'react-dom';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" loading={pending}>
      Iniciar sesión
    </Button>
  );
}

export default function LoginPage() {
  const [state, formAction] = useActionState<LoginState, FormData>(loginAction, null);
  const alertRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (state?.error) {
      alertRef.current?.focus();
    }
  }, [state]);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
      <h1 className="text-2xl font-semibold text-gray-900">Iniciá sesión</h1>
      <p className="mt-1.5 text-sm text-gray-500">
        ¿No tenés cuenta?{' '}
        <Link href="/register" className="text-blue-600 hover:underline font-medium">
          Registrate gratis
        </Link>
      </p>

      {state?.error && (
        <div className="mt-4" ref={alertRef} tabIndex={-1}>
          <Alert variant="error">{errorMessage(state.error)}</Alert>
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
        <PasswordInput
          label="Contraseña"
          name="password"
          autoComplete="current-password"
          required
          placeholder="Tu contraseña"
        />

        <div className="flex items-center justify-end">
          <Link
            href="/forgot-password"
            className="text-sm text-blue-600 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
          >
            ¿Olvidaste tu contraseña?
          </Link>
        </div>

        <SubmitButton />
      </form>
    </div>
  );
}
