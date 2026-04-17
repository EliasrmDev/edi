import type { Metadata } from 'next';
import Link from 'next/link';
import { Alert } from '@/components/ui/Alert';

export const metadata: Metadata = { title: 'Verificar correo' };

const API_URL = process.env.API_URL ?? 'http://localhost:3001';

async function verifyToken(token: string): Promise<{ success: boolean; code?: string }> {
  try {
    const res = await fetch(`${API_URL}/api/auth/verify-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
      cache: 'no-store',
    });
    if (res.ok) return { success: true };
    const body = (await res.json().catch(() => ({}))) as { error?: { code?: string } };
    return { success: false, code: body.error?.code };
  } catch {
    return { success: false, code: 'SERVER_ERROR' };
  }
}

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm text-center">
        <h1 className="text-xl font-semibold text-gray-900">Enlace inválido</h1>
        <p className="mt-2 text-sm text-gray-600">
          Este enlace de verificación no es válido. Revisá tu correo o solicitá uno nuevo.
        </p>
        <Link href="/login" className="mt-6 inline-block text-sm text-blue-600 hover:underline">
          Ir al inicio de sesión
        </Link>
      </div>
    );
  }

  const result = await verifyToken(token);

  if (result.success) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
          <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-xl font-semibold text-gray-900">¡Correo verificado!</h1>
        <p className="mt-2 text-sm text-gray-600">
          Tu cuenta está activa. Podés iniciar sesión ahora.
        </p>
        <Link
          href="/login"
          className="mt-6 inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          Iniciar sesión
        </Link>
      </div>
    );
  }

  const isExpired = result.code === 'TOKEN_EXPIRED';

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
      <h1 className="text-xl font-semibold text-gray-900">Verificación fallida</h1>
      <div className="mt-4">
        <Alert variant="error">
          {isExpired
            ? 'El enlace de verificación expiró. Iniciá sesión y solicitá uno nuevo.'
            : 'El enlace de verificación no es válido o ya fue usado.'}
        </Alert>
      </div>
      <div className="mt-6 flex flex-col items-center gap-3">
        <Link href="/login" className="text-sm text-blue-600 hover:underline">
          Ir al inicio de sesión
        </Link>
      </div>
    </div>
  );
}
