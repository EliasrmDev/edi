'use client';

import { useActionState, useState } from 'react';
import { useFormStatus } from 'react-dom';
import {
  requestDeletionAction,
  cancelDeletionAction,
  type DeletionState,
} from '@/lib/actions/user';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';

function ConfirmButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="danger" loading={pending} className="w-full sm:w-auto">
      Confirmar eliminación
    </Button>
  );
}

function CancelButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="secondary" loading={pending} className="w-full sm:w-auto">
      Cancelar eliminación
    </Button>
  );
}

export default function DeleteAccountPage() {
  const [step, setStep] = useState<1 | 2>(1);
  const [requestState, requestAction] = useActionState<DeletionState, FormData>(
    requestDeletionAction,
    null,
  );
  const [cancelState, cancelAction] = useActionState<DeletionState, FormData>(
    cancelDeletionAction,
    null,
  );

  const requestSucceeded = requestState?.success === true;

  if (requestSucceeded) {
    return (
      <div className="max-w-xl">
        <Alert variant="success" title="Solicitud recibida">
          Tu cuenta está programada para eliminación en 30 días. Recibirás un correo de
          confirmación. Durante este período podés cancelar la solicitud desde la configuración de
          tu cuenta.
        </Alert>

        <div className="mt-6">
          <form action={cancelAction} noValidate>
            {cancelState?.error && (
              <Alert variant="error" className="mb-4">
                {cancelState.error}
              </Alert>
            )}
            <CancelButton />
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-slate-100">Eliminar cuenta</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
          Esta acción no se puede deshacer fácilmente. Leé con atención.
        </p>
      </div>

      {step === 1 && (
        <div className="space-y-4">
          <div className="rounded-xl border border-red-200 bg-red-50 p-5 dark:border-red-800/50 dark:bg-red-950/40">
            <h2 className="mb-3 font-semibold text-red-800 dark:text-red-300">¿Qué se elimina?</h2>
            <ul className="space-y-1.5 text-sm text-red-700 dark:text-red-400">
              {[
                'Todas tus claves de API cifradas',
                'Tu perfil y preferencias',
                'Todos los registros de uso de IA',
                'Tu historial de transformaciones (si lo tenés activado)',
                'El acceso a la extensión de Chrome',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <svg className="mt-0.5 h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-800/50 dark:bg-amber-950/40">
            <p className="text-sm text-amber-800 dark:text-amber-300">
              <strong>Período de gracia:</strong> Tu cuenta se eliminará definitivamente después de
              30 días. Durante ese tiempo podés reactivarla iniciando sesión.
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="danger" onClick={() => setStep(2)}>
              Quiero eliminar mi cuenta
            </Button>
            <a href="/account">
              <Button variant="secondary">Cancelar</Button>
            </a>
          </div>
        </div>
      )}

      {step === 2 && (
        <form action={requestAction} className="space-y-5" noValidate>
          {requestState?.error && (
            <Alert variant="error">{requestState.error}</Alert>
          )}

          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <p className="mb-4 text-sm text-gray-700 dark:text-slate-300">
              Para confirmar, escribí{' '}
              <code className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-sm font-medium dark:bg-slate-700 dark:text-slate-200">
                ELIMINAR
              </code>{' '}
              en el campo de abajo:
            </p>
            <Input
              label='Confirmación'
              name="confirmation"
              type="text"
              required
              placeholder="ELIMINAR"
              autoComplete="off"
              description='Escribí exactamente "ELIMINAR" en mayúsculas'
            />
          </div>

          <div className="flex gap-3">
            <ConfirmButton />
            <Button variant="secondary" type="button" onClick={() => setStep(1)}>
              Volver
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
