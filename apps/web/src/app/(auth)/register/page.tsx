'use client';

import { useActionState, useRef, useEffect, useState } from 'react';
import Link from 'next/link';
import { registerAction, type RegisterState } from '@/lib/actions/auth';
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
      Crear cuenta
    </Button>
  );
}

export default function RegisterPage() {
  const [state, formAction] = useActionState<RegisterState, FormData>(registerAction, null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [localError, setLocalError] = useState('');
  const alertRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (state?.error) alertRef.current?.focus();
  }, [state]);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    if (password !== confirmPassword) {
      e.preventDefault();
      setLocalError('Las contraseñas no coinciden.');
      alertRef.current?.focus();
    } else {
      setLocalError('');
    }
  }

  if (state?.success) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
          <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-xl font-semibold text-gray-900">¡Verificá tu correo!</h1>
        <p className="mt-2 text-sm text-gray-600">
          Te enviamos un enlace de verificación. Revisá tu bandeja de entrada y seguí las instrucciones.
        </p>
        <Link
          href="/login"
          className="mt-6 inline-block text-sm text-blue-600 hover:underline"
        >
          Volver al inicio de sesión
        </Link>
      </div>
    );
  }

  const displayError = localError || (state?.error ? errorMessage(state.error) : undefined);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
      <h1 className="text-2xl font-semibold text-gray-900">Creá tu cuenta</h1>
      <p className="mt-1.5 text-sm text-gray-500">
        ¿Ya tenés una?{' '}
        <Link href="/login" className="text-blue-600 hover:underline font-medium">
          Iniciá sesión
        </Link>
      </p>

      {displayError && (
        <div className="mt-4" ref={alertRef} tabIndex={-1}>
          <Alert variant="error">{displayError}</Alert>
        </div>
      )}

      <form action={formAction} onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
        <Input
          label="Correo electrónico"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="vos@ejemplo.com"
        />
        <Input
          label="Nombre para mostrar"
          name="displayName"
          type="text"
          autoComplete="name"
          placeholder="Opcional"
          description="Cómo querés que te llamemos en la app"
        />
        <PasswordInput
          label="Contraseña"
          name="password"
          autoComplete="new-password"
          required
          showStrength
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          description="Mínimo 8 caracteres"
        />
        <PasswordInput
          label="Confirmá tu contraseña"
          name="confirmPassword"
          autoComplete="new-password"
          required
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          error={confirmPassword && password !== confirmPassword ? 'Las contraseñas no coinciden' : undefined}
        />

        <SubmitButton />
      </form>

      <p className="mt-4 text-center text-xs text-gray-500">
        Al registrarte aceptás nuestros{' '}
        <Link href="/terms" className="text-blue-600 hover:underline">Términos</Link>
        {' '}y{' '}
        <Link href="/privacy" className="text-blue-600 hover:underline">Política de privacidad</Link>.
      </p>
    </div>
  );
}
