'use client';

import { useActionState, useEffect, useRef } from 'react';
import { updateProfileAction, type UpdateProfileState } from '@/lib/actions/user';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { errorMessage } from '@/lib/utils';
import { useFormStatus } from 'react-dom';
import type { UserProfile } from '@edi/shared';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" loading={pending}>
      Guardar cambios
    </Button>
  );
}

interface ProfileFormProps {
  profile: UserProfile | null;
}

export function ProfileForm({ profile }: ProfileFormProps) {
  const [state, formAction] = useActionState<UpdateProfileState, FormData>(
    updateProfileAction,
    null,
  );
  const alertRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (state) alertRef.current?.focus();
  }, [state]);

  return (
    <form action={formAction} className="space-y-5" noValidate>
      {state && (
        <div ref={alertRef} tabIndex={-1}>
          <Alert variant={state.success ? 'success' : 'error'}>
            {state.success ? 'Perfil actualizado.' : errorMessage(state.error ?? 'SERVER_ERROR')}
          </Alert>
        </div>
      )}

      <Input
        label="Nombre para mostrar"
        name="displayName"
        type="text"
        defaultValue={profile?.displayName ?? ''}
        placeholder="Tu nombre"
        description="Cómo aparecés en la app"
        maxLength={64}
      />

      <fieldset>
        <legend className="mb-2 block text-sm font-medium text-gray-700 dark:text-slate-300">Tono por defecto</legend>
        <div className="space-y-2">
          {[
            { value: 'voseo-cr', label: 'Voseo', description: 'vos sabés, vos tenés' },
            { value: 'tuteo', label: 'Tuteo', description: 'tú sabes, tú tienes' },
            { value: 'ustedeo', label: 'Ustedeo', description: 'usted sabe, usted tiene' },
          ].map((tone) => (
            <label
              key={tone.value}
              className="flex cursor-pointer items-start gap-3 rounded-lg border border-gray-200 p-3 hover:bg-gray-50 has-[:checked]:border-blue-500 has-[:checked]:bg-blue-50
                dark:border-slate-600 dark:hover:bg-slate-700/50 dark:has-[:checked]:border-blue-400 dark:has-[:checked]:bg-blue-950/40"
            >
              <input
                type="radio"
                name="defaultTone"
                value={tone.value}
                defaultChecked={profile?.defaultTone === tone.value}
                className="mt-0.5 accent-blue-600"
              />
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-slate-100">{tone.label}</p>
                <p className="text-xs text-gray-500 font-mono dark:text-slate-400">{tone.description}</p>
              </div>
            </label>
          ))}
        </div>
      </fieldset>

      <div>
        <label htmlFor="preferredLocale" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-slate-300">
          Localización preferida
        </label>
        <select
          id="preferredLocale"
          name="preferredLocale"
          defaultValue={profile?.preferredLocale ?? 'es-CR'}
          className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500
            dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:focus:ring-blue-400"
        >
          <option value="es-CR">Español (Costa Rica)</option>
          <option value="es-419">Español (Latinoamérica)</option>
          <option value="es">Español (General)</option>
        </select>
      </div>

      <div className="pt-2">
        <SubmitButton />
      </div>
    </form>
  );
}
