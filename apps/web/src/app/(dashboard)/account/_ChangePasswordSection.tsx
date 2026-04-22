'use client';

import { useActionState, useRef, useEffect } from 'react';
import { useFormStatus } from 'react-dom';
import { changePasswordAction, type UpdateProfileState } from '@/lib/actions/user';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { errorMessage } from '@/lib/utils';

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" loading={pending} className="w-full sm:w-auto">
      {label}
    </Button>
  );
}

export function ChangePasswordSection({ hasPassword }: { hasPassword: boolean }) {
  const [state, formAction] = useActionState<UpdateProfileState, FormData>(
    changePasswordAction,
    null,
  );
  const alertRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (state?.error) alertRef.current?.focus();
  }, [state]);

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="mb-1 text-base font-semibold text-gray-900">
        {hasPassword ? 'Cambiar contraseña' : 'Establecer contraseña'}
      </h2>
      {!hasPassword && (
        <p className="mb-4 text-sm text-gray-500">
          Tu cuenta fue creada con Google o Microsoft. Podés agregar una contraseña para iniciar
          sesión también con tu correo electrónico.
        </p>
      )}
      <form action={formAction} className="space-y-4 mt-4" noValidate>
        {state?.error && (
          <div ref={alertRef} tabIndex={-1}>
            <Alert variant="error">{errorMessage(state.error)}</Alert>
          </div>
        )}
        {state?.success && (
          <Alert variant="success">Contraseña actualizada correctamente.</Alert>
        )}

        {hasPassword && (
          <PasswordInput
            label="Contraseña actual"
            name="currentPassword"
            required
            autoComplete="current-password"
          />
        )}
        <PasswordInput
          label={hasPassword ? 'Nueva contraseña' : 'Contraseña'}
          name="newPassword"
          required
          showStrength
          autoComplete="new-password"
          minLength={12}
          description="Mínimo 12 caracteres"
        />

        <div className="pt-1">
          <SubmitButton label={hasPassword ? 'Cambiar contraseña' : 'Establecer contraseña'} />
        </div>
      </form>
    </section>
  );
}
