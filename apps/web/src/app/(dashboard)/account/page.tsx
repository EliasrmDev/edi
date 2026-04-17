'use client';

import { useActionState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useFormStatus } from 'react-dom';
import { changePasswordAction, type UpdateProfileState } from '@/lib/actions/user';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { errorMessage } from '@/lib/utils';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" loading={pending} className="w-full sm:w-auto">
      Cambiar contraseña
    </Button>
  );
}

function ChangePasswordForm() {
  const [state, formAction] = useActionState<UpdateProfileState, FormData>(
    changePasswordAction,
    null,
  );
  const alertRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (state?.error) alertRef.current?.focus();
  }, [state]);

  return (
    <form action={formAction} className="space-y-4" noValidate>
      {state?.error && (
        <div ref={alertRef} tabIndex={-1}>
          <Alert variant="error">{errorMessage(state.error)}</Alert>
        </div>
      )}
      {state?.success && (
        <Alert variant="success">Contraseña actualizada correctamente.</Alert>
      )}

      <PasswordInput
        label="Contraseña actual"
        name="currentPassword"
        required
        autoComplete="current-password"
      />
      <PasswordInput
        label="Nueva contraseña"
        name="newPassword"
        required
        showStrength
        autoComplete="new-password"
        description="Mínimo 8 caracteres"
      />

      <div className="pt-1">
        <SubmitButton />
      </div>
    </form>
  );
}

export default function AccountPage() {
  return (
    <div className="max-w-xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Cuenta</h1>
        <p className="mt-1 text-sm text-gray-500">
          Gestioná la seguridad y privacidad de tu cuenta.
        </p>
      </div>

      {/* Change password */}
      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-base font-semibold text-gray-900">Cambiar contraseña</h2>
        <ChangePasswordForm />
      </section>

      {/* Danger zone */}
      <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="px-6 py-4">
          <h2 className="text-base font-semibold text-gray-900">Zona peligrosa</h2>
        </div>

        <div className="divide-y divide-gray-100 border-t border-gray-100">
          <div className="flex items-center justify-between px-6 py-4">
            <div>
              <p className="text-sm font-medium text-gray-900">Privacidad y exportación de datos</p>
              <p className="text-sm text-gray-500">
                Controlá qué datos guardamos y exportá tu información.
              </p>
            </div>
            <Link href="/account/privacy">
              <Button variant="secondary" className="shrink-0">Gestionar</Button>
            </Link>
          </div>

          <div className="flex items-center justify-between px-6 py-4">
            <div>
              <p className="text-sm font-medium text-red-700">Eliminar cuenta</p>
              <p className="text-sm text-gray-500">
                Elimina todas tus claves de IA, perfil y datos de uso de forma permanente.
              </p>
            </div>
            <Link href="/account/delete">
              <Button variant="danger" className="shrink-0">Eliminar cuenta</Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
