import type { Metadata } from 'next';
import { getCredentials } from '@/lib/actions/credentials';
import { ModelsClient } from './_ModelsClient';

export const metadata: Metadata = { title: 'Modelos de IA' };

export default async function ModelsPage() {
  const credentials = await getCredentials();

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-slate-100">Modelos de IA</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
          Seleccioná el modelo que cada clave de IA usará en las transformaciones.
        </p>
      </div>

      <ModelsClient credentials={credentials} />
    </div>
  );
}
