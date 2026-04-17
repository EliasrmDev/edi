'use client';

import { useActionState, useOptimistic, useTransition } from 'react';
import { useFormStatus } from 'react-dom';
import {
  updatePrivacyAction,
  exportDataAction,
  type PrivacyState,
  type DeletionState,
} from '@/lib/actions/user';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import * as Switch from '@radix-ui/react-switch';

interface PrivacyFormProps {
  initialRetainHistory: boolean;
}

function ExportButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="secondary" loading={pending} className="shrink-0">
      Exportar mis datos
    </Button>
  );
}

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" loading={pending} className="w-full sm:w-auto">
      Guardar preferencias
    </Button>
  );
}

export function PrivacyForm({ initialRetainHistory }: PrivacyFormProps) {
  const [privacyState, privacyAction] = useActionState<PrivacyState, FormData>(
    updatePrivacyAction,
    null,
  );
  const [exportState, exportAction] = useActionState<DeletionState, FormData>(
    exportDataAction,
    null,
  );
  const [, startTransition] = useTransition();
  const [optimisticHistory, setOptimisticHistory] = useOptimistic(initialRetainHistory);

  return (
    <div className="space-y-6">
      {/* History toggle */}
      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-1 text-base font-semibold text-gray-900">Historial de transformaciones</h2>
        <p className="mb-4 text-sm text-gray-500">
          Cuando está activo, guardamos un registro de las transformaciones que realizás con la
          extensión para poderte mostrar estadísticas de uso.
        </p>

        {privacyState?.error && (
          <Alert variant="error" className="mb-4">{privacyState.error}</Alert>
        )}
        {privacyState?.success && (
          <Alert variant="success" className="mb-4">Preferencias guardadas.</Alert>
        )}

        <form
          action={(formData) => {
            startTransition(() => {
              setOptimisticHistory(formData.get('retainHistory') === 'on');
            });
            return privacyAction(formData);
          }}
          className="space-y-4"
          noValidate
        >
          <div className="flex items-center gap-3">
            <Switch.Root
              id="retain-history"
              name="retainHistory"
              value="on"
              defaultChecked={optimisticHistory}
              className="relative h-6 w-11 cursor-pointer rounded-full bg-gray-200 transition-colors
                data-[state=checked]:bg-blue-600 focus-visible:outline focus-visible:outline-2
                focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              <Switch.Thumb
                className="block h-5 w-5 translate-x-0.5 rounded-full bg-white shadow-sm ring-0
                  transition-transform data-[state=checked]:translate-x-5.5"
              />
            </Switch.Root>
            <label htmlFor="retain-history" className="cursor-pointer text-sm text-gray-700">
              {optimisticHistory ? 'Historial activado' : 'Historial desactivado'}
            </label>
          </div>

          <div>
            <SaveButton />
          </div>
        </form>
      </section>

      {/* Export data */}
      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-1 text-base font-semibold text-gray-900">Exportar tus datos</h2>
        <p className="mb-4 text-sm text-gray-500">
          Descargá una copia de todos tus datos: perfil, historial y configuración. Recibirás el
          archivo por correo electrónico.
        </p>

        {exportState?.error && (
          <Alert variant="error" className="mb-3">{exportState.error}</Alert>
        )}
        {exportState?.success && (
          <Alert variant="success" className="mb-3">
            Solicitud recibida. Recibirás el archivo por correo en los próximos minutos.
          </Alert>
        )}

        <form action={exportAction} noValidate>
          <ExportButton />
        </form>
      </section>
    </div>
  );
}
