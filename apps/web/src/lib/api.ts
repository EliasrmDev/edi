export type ApiError = {
  code: string;
  message: string;
  details?: Record<string, unknown>;
};

export type ApiResult<T> =
  | { data: T; error: null }
  | { data: null; error: ApiError };

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export async function apiClient<T>(
  endpoint: string,
  options?: RequestInit,
): Promise<ApiResult<T>> {
  const url = `${API_URL}${endpoint}`;

  const mergedHeaders = new Headers({
    'Content-Type': 'application/json',
    'X-Request-ID': crypto.randomUUID(),
  });
  if (options?.headers) {
    new Headers(options.headers).forEach((v, k) => mergedHeaders.set(k, v));
  }

  let response: Response;
  try {
    response = await fetch(url, {
      credentials: 'include',
      ...options,
      headers: mergedHeaders,
    });
  } catch {
    return {
      data: null,
      error: { code: 'NETWORK_ERROR', message: 'Network request failed' },
    };
  }

  if (response.status === 401) {
    if (typeof window !== 'undefined') {
      window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
    }
    return {
      data: null,
      error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
    };
  }

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    return {
      data: null,
      error: { code: 'PARSE_ERROR', message: 'Failed to parse response' },
    };
  }

  if (!response.ok) {
    const err = body as { error?: { code?: string; message?: string } };
    return {
      data: null,
      error: {
        code: err.error?.code ?? 'SERVER_ERROR',
        message: err.error?.message ?? 'An error occurred',
      },
    };
  }

  const successBody = body as { data: T };
  return { data: successBody.data, error: null };
}
