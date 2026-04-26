'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
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
  const [selectedLocale, setSelectedLocale] = useState<string>(profile?.preferredLocale ?? 'es-CR');
  const [successVisible, setSuccessVisible] = useState(false);

  useEffect(() => {
    if (profile?.preferredLocale) setSelectedLocale(profile.preferredLocale);
  }, [profile?.preferredLocale]);

  useEffect(() => {
    if (!state) return;
    alertRef.current?.focus();
    if (state.success) {
      setSuccessVisible(true);
      const t = setTimeout(() => setSuccessVisible(false), 5000);
      return () => clearTimeout(t);
    }
  }, [state]);

  return (
    <form action={formAction} className="space-y-5" noValidate>
      {state?.success && successVisible && (
        <div ref={alertRef} tabIndex={-1}>
          <Alert variant="success">Perfil actualizado.</Alert>
        </div>
      )}
      {state?.error && (
        <div ref={alertRef} tabIndex={-1}>
          <Alert variant="error">{errorMessage(state.error)}</Alert>
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

      <div>
        <label htmlFor="preferredLocale" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-slate-300">
          Localización preferida
        </label>
        <select
          id="preferredLocale"
          name="preferredLocale"
          value={selectedLocale}
          onChange={(e) => setSelectedLocale(e.target.value)}
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
