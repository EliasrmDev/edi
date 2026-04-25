'use client';

import { useActionState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { loginAction, signInWithGoogleAction, signInWithMicrosoftAction, type LoginState } from '@/lib/actions/auth';
import { Input } from '@/components/ui/Input';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { errorMessage } from '@/lib/utils';
import { useFormStatus } from 'react-dom';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" loading={pending}>
      Iniciar sesión
    </Button>
  );
}

export default function LoginPage() {
  const [state, formAction] = useActionState<LoginState, FormData>(loginAction, null);
  const alertRef = useRef<HTMLDivElement>(null);
  const searchParams = useSearchParams();
  const passwordChanged = searchParams.get('success') === 'password-changed';
  const redirect = searchParams.get('redirect') ?? '';
  // NextAuth puts OAuth errors in ?error= (e.g. OAuthSigninError, AccessDenied)
  const oauthError = searchParams.get('error');

  useEffect(() => {
    if (state?.error || oauthError) {
      alertRef.current?.focus();
    }
  }, [state, oauthError]);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
      <h1 className="text-2xl font-semibold text-gray-900">Iniciá sesión</h1>
      <p className="mt-1.5 text-sm text-gray-500">
        ¿No tenés cuenta?{' '}
        <Link href="/register" className="text-blue-600 hover:underline font-medium">
          Registrate gratis
        </Link>
      </p>

      {passwordChanged && (
        <div className="mt-4">
          <Alert variant="success">
            Tu contraseña fue configurada. Iniciá sesión con tu correo electrónico o con Google.
          </Alert>
        </div>
      )}

      {(state?.error || oauthError) && (
        <div className="mt-4" ref={alertRef} tabIndex={-1}>
          <Alert variant="error">{errorMessage(state?.error ?? oauthError ?? '')}</Alert>
        </div>
      )}

      <form action={formAction} className="mt-6 space-y-4" noValidate>
        <input type="hidden" name="redirectTo" value={redirect} />
        <Input
          label="Correo electrónico"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="vos@ejemplo.com"
        />
        <PasswordInput
          label="Contraseña"
          name="password"
          autoComplete="current-password"
          required
          placeholder="Tu contraseña"
        />

        <div className="flex items-center justify-end">
          <Link
            href="/forgot-password"
            className="text-sm text-blue-600 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
          >
            ¿Olvidaste tu contraseña?
          </Link>
        </div>

        <SubmitButton />
      </form>

      {/* Divider */}
      <div className="relative my-4">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-white px-3 text-gray-400">o continuá con</span>
        </div>
      </div>

      {/* OAuth buttons */}
      <div className="space-y-2">
        <form action={signInWithGoogleAction}>
          <input type="hidden" name="redirectTo" value={redirect} />
          <button
            type="submit"
            className="flex w-full items-center justify-center gap-3 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continuar con Google
          </button>
        </form>
        <form action={signInWithMicrosoftAction}>
          <input type="hidden" name="redirectTo" value={redirect} />
          <button
            type="submit"
            className="flex w-full items-center justify-center gap-3 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 23 23" width="18" height="18" aria-hidden="true">
              <path fill="#f3f3f3" d="M0 0h23v23H0z"/>
              <path fill="#f35325" d="M1 1h10v10H1z"/>
              <path fill="#81bc06" d="M12 1h10v10H12z"/>
              <path fill="#05a6f0" d="M1 12h10v10H1z"/>
              <path fill="#ffba08" d="M12 12h10v10H12z"/>
            </svg>
            Continuar con Microsoft
          </button>
        </form>
      </div>
    </div>
  );
}
