import type { Metadata } from 'next';
import Link from 'next/link';
import { getCredentials } from '@/lib/actions/credentials';
import { Button } from '@/components/ui/Button';
import { CredentialsClient } from './_CredentialsClient';

export const metadata: Metadata = { title: 'Claves de IA' };

export default async function CredentialsPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string }>;
}) {
  const { success } = await searchParams;
  const credentials = await getCredentials();

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Claves de IA</h1>
          <p className="mt-1 text-sm text-gray-500">
            Gestioná tus claves cifradas de OpenAI, Anthropic, Google AI y OpenRouter.
          </p>
        </div>
        <Link href="/credentials/new">
          <Button size="sm">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Agregar clave
          </Button>
        </Link>
      </div>

      <CredentialsClient credentials={credentials} successMessage={success} />
    </div>
  );
}
