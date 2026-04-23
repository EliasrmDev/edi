import type { Metadata } from 'next';
import { getCredentials } from '@/lib/actions/credentials';
import { TextEditorClient } from './_TextEditorClient';

export const metadata: Metadata = { title: 'Editor de texto' };

export default async function TransformPage() {
  const credentials = await getCredentials();
  const activeCredential = credentials.find((c) => c.isActive && !c.isExpired) ?? null;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Editor de texto</h1>
        <p className="mt-1 text-sm text-gray-500">
          Transformá tu texto con formato, tono y corrección ortográfica con IA.
        </p>
      </div>
      <div className="max-w-3xl">
        <TextEditorClient activeCredential={activeCredential} allCredentials={credentials} />
      </div>
    </div>
  );
}
