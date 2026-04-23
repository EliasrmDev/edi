'use client';

import { useCallback, useEffect, useState } from 'react';

interface Props {
  extId: string;
  token: string;
  expiresAt: number;
  email: string;
  displayName: string | null;
}

type ChromeRuntime = {
  sendMessage: (
    extensionId: string,
    message: unknown,
    callback: (response: unknown) => void,
  ) => void;
  lastError?: { message?: string };
};

function sendMessageToExtension(
  runtime: ChromeRuntime,
  extId: string,
  payload: unknown,
): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      runtime.sendMessage(extId, payload, () => {
        if (runtime.lastError) {
          reject(new Error(runtime.lastError.message ?? 'Unknown error'));
          return;
        }
        resolve();
      });
    } catch (err) {
      reject(err instanceof Error ? err : new Error(String(err)));
    }
  });
}

export function ExtensionAuthHandoff({ extId, token, expiresAt, email, displayName }: Props) {
  const [status, setStatus] = useState<'sending' | 'done' | 'error'>('sending');
  const [errorMsg, setErrorMsg] = useState('');

  const runSync = useCallback(async () => {
    setStatus('sending');
    setErrorMsg('');

    const chromeRuntime = (
      window as Window & { chrome?: { runtime?: ChromeRuntime } }
    ).chrome?.runtime;

    if (!chromeRuntime?.sendMessage) {
      setStatus('error');
      setErrorMsg(
        'chrome.runtime.sendMessage no disponible — la extensión no está activa o no tiene externally_connectable configurado.',
      );
      return;
    }

    const msg = {
      type: 'STORE_AUTH_TOKEN',
      payload: { token, expiresAt, email, displayName },
    };

    const attempt = async (attemptsLeft: number): Promise<void> => {
      try {
        await sendMessageToExtension(chromeRuntime, extId, msg);
        setStatus('done');
        setTimeout(() => window.close(), 1000);
      } catch (err) {
        if (attemptsLeft > 1) {
          await new Promise((r) => setTimeout(r, 1200));
          return attempt(attemptsLeft - 1);
        }
        const rawErr = err instanceof Error ? err.message : String(err);
        console.error('[EDI extension-auth] sendMessage failed:', rawErr, 'extId:', extId);
        setStatus('error');
        setErrorMsg(rawErr);
      }
    };

    await attempt(3);
  }, [extId, token, expiresAt, email, displayName]);

  useEffect(() => {
    void runSync();
  }, [runSync]);

  return (
    <div className="flex flex-col items-center gap-4 py-8 text-center">
      {status === 'sending' && (
        <>
          <div
            className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600"
            role="status"
            aria-label="Conectando con la extensión"
          />
          <p className="text-sm text-gray-600">Sincronizando sesión con EDI…</p>
        </>
      )}

      {status === 'done' && (
        <>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
            <svg
              className="h-6 w-6 text-green-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="font-medium text-gray-900">¡Sesión sincronizada!</p>
          <p className="text-sm text-gray-500">Esta ventana se cerrará automáticamente.</p>
        </>
      )}

      {status === 'error' && (
        <>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
            <svg
              className="h-6 w-6 text-red-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <p className="font-medium text-gray-900">No se pudo sincronizar</p>
          <p className="max-w-xs rounded bg-gray-100 px-3 py-2 font-mono text-xs text-gray-600 break-all">
            {errorMsg || 'Error desconocido'}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => void runSync()}
              className="mt-2 rounded-lg px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              Reintentar
            </button>
            <button
              onClick={() => window.close()}
              className="mt-2 rounded-lg px-4 py-2 text-sm font-medium text-indigo-600 hover:bg-indigo-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              Cerrar
            </button>
          </div>
        </>
      )}
    </div>
  );
}
