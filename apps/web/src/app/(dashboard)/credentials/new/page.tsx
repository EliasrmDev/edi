'use client';

import { useActionState, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
  createCredentialAction,
  type CreateCredentialState,
} from '@/lib/actions/credentials';
import { Input } from '@/components/ui/Input';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { ProviderIcon, providerLabel } from '@/components/ui/ProviderIcon';
import { errorMessage } from '@/lib/utils';
import { useFormStatus } from 'react-dom';
import type { ProviderId } from '@edi/shared';

const PROVIDERS: { id: ProviderId; placeholder: string }[] = [
  { id: 'openai', placeholder: 'sk-...' },
  { id: 'anthropic', placeholder: 'sk-ant-...' },
  { id: 'google-ai', placeholder: 'AIza...' },
];

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full sm:w-auto" loading={pending}>
      Agregar clave
    </Button>
  );
}

export default function NewCredentialPage() {
  const [state, formAction] = useActionState<CreateCredentialState, FormData>(
    createCredentialAction,
    null,
  );
  const alertRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (state?.error) alertRef.current?.focus();
  }, [state]);

  return (
    <div className="max-w-xl">
      <div className="mb-6">
        <Link href="/credentials" className="text-sm text-blue-600 hover:underline">
          ← Volver a claves
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-gray-900">Agregar clave de IA</h1>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        {state?.error && (
          <div ref={alertRef} tabIndex={-1} className="mb-5">
            <Alert variant="error">{errorMessage(state.error)}</Alert>
          </div>
        )}

        <form action={formAction} className="space-y-5" noValidate>
          {/* Provider Selector */}
          <fieldset>
            <legend className="mb-2 block text-sm font-medium text-gray-700">
              Proveedor <span className="text-red-500" aria-hidden="true">*</span>
            </legend>
            <div className="grid grid-cols-3 gap-3">
              {PROVIDERS.map((p) => (
                <label
                  key={p.id}
                  className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border border-gray-200 p-3
                    hover:border-blue-300 has-[:checked]:border-blue-500 has-[:checked]:bg-blue-50 transition-colors"
                >
                  <input
                    type="radio"
                    name="provider"
                    value={p.id}
                    required
                    className="sr-only"
                    defaultChecked={p.id === 'openai'}
                  />
                  <ProviderIcon provider={p.id} size={32} />
                  <span className="text-xs font-medium text-gray-700">{providerLabel(p.id)}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <Input
            label="Etiqueta"
            name="label"
            type="text"
            required
            placeholder="Mi clave de producción"
            maxLength={64}
            description="Un nombre descriptivo para identificar esta clave"
          />

          <PasswordInput
            label="Clave de API"
            name="rawKey"
            required
            placeholder="Pegá tu clave aquí"
            description="Tu clave se cifra antes de guardarse. Nunca la veremos completa."
            autoComplete="off"
          />

          <Input
            label="Fecha de vencimiento"
            name="expiresAt"
            type="date"
            description="Opcional. Recibirás recordatorios antes de que expire."
          />

          {/* Security notice */}
          <div className="flex items-start gap-2 rounded-lg bg-blue-50 border border-blue-100 p-3">
            <svg className="h-4 w-4 shrink-0 text-blue-600 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <p className="text-xs text-blue-700">
              Tu clave se cifra con AES-256-GCM antes de almacenarse. Nunca la veremos completa ni la almacenamos en texto plano.
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <SubmitButton />
            <Link href="/credentials">
              <Button variant="secondary" type="button">Cancelar</Button>
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
