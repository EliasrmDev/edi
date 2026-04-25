import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';

const SESSION_COOKIE = 'session';

const PROTECTED_PREFIXES = ['/dashboard', '/profile', '/credentials', '/account', '/extension-auth'];
const AUTH_PREFIXES = ['/login', '/register'];

export default auth(function middleware(
  req: NextRequest & { auth?: { user?: { apiSession?: string } } | null },
): NextResponse {
  const { pathname } = req.nextUrl;
  const isSessionExpiredRedirect = req.nextUrl.searchParams.get('expired') === '1';
  const sessionToken = req.cookies.get(SESSION_COOKIE)?.value;
  const oauthApiSession = req.auth?.user?.apiSession;
  const oauthError = (req.auth?.user as { apiSession?: string; error?: string } | undefined)?.error;
  const hasIncompleteOAuthSession = !!req.auth?.user && !oauthApiSession;
  const isAuthenticated = !!sessionToken || !!oauthApiSession;
  const hasVerifiedOAuthSession = !!oauthApiSession;

  // Generate nonce early so every NextResponse.next() path can use it.
  // next.config.ts no longer sets a static CSP — this middleware is the sole
  // owner of CSP headers. A static CSP with 'strict-dynamic' but no nonce/hash
  // would block ALL inline scripts (including Next.js hydration).
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
  const isDev = process.env.NODE_ENV === 'development';
  const csp = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ''}`,
    `style-src 'self'${isDev ? " 'unsafe-inline'" : ` 'nonce-${nonce}'`}`,
    `img-src 'self' data: blob: https://lh3.googleusercontent.com`,
    `font-src 'self'`,
    `connect-src 'self' ${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'}${isDev ? ' ws://localhost:* ws://127.0.0.1:*' : ''}`,
    `form-action 'self'`,
    `base-uri 'self'`,
    `frame-ancestors 'none'`,
    `object-src 'none'`,
    `upgrade-insecure-requests`,
  ].join('; ');

  // Forward nonce to the app so server components can read it via headers().
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set('x-nonce', nonce);

  function buildPageResponse(): NextResponse {
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  function applySecurityHeaders(res: NextResponse): NextResponse {
    res.headers.set('Content-Security-Policy', csp);
    res.headers.set('X-Content-Type-Options', 'nosniff');
    res.headers.set('X-Frame-Options', 'DENY');
    res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
    res.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    return res;
  }

  // Protect dashboard routes
  if (PROTECTED_PREFIXES.some((p) => pathname.startsWith(p))) {
    if (!isAuthenticated) {
      const url = new URL('/login', req.url);
      if (oauthError || hasIncompleteOAuthSession) {
        // OAuth completed but API session creation failed — show error on login page
        url.searchParams.set('error', oauthError ?? 'OAuthSigninError');
      } else {
        // Normal unauthenticated redirect: preserve full path + query string
        url.searchParams.set('redirect', pathname + req.nextUrl.search);
      }
      return NextResponse.redirect(url);
    }
  }

  // Redirect authenticated users away from auth pages
  if (AUTH_PREFIXES.some((p) => pathname.startsWith(p))) {
    // If the dashboard explicitly expired the session (API session invalid),
    // always let the user reach the login page regardless of session type.
    // This breaks the /login <-> /dashboard loop that occurs when an OAuth
    // user's API session expires: NextAuth JWT still exists (hasVerifiedOAuthSession
    // is true) but the API rejects the token, so dashboard calls redirect('/login?expired=1').
    // Without this early return the middleware would redirect them back to /dashboard forever.
    if (isSessionExpiredRedirect) {
      const response = buildPageResponse();
      // Also clear a stale raw session cookie when present (non-OAuth expiry case)
      if (sessionToken && !oauthApiSession) {
        response.cookies.delete(SESSION_COOKIE);
      }
      return applySecurityHeaders(response);
    }

    // Only trust verified NextAuth state here. A stale raw session cookie can
    // otherwise trap users in a /login <-> /dashboard redirect loop.
    if (hasVerifiedOAuthSession) {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
  }

  const response = buildPageResponse();

  // Bridge OAuth session into the session cookie for Hono API compatibility
  if (oauthApiSession && !sessionToken) {
    response.cookies.set(SESSION_COOKIE, oauthApiSession, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 30 * 24 * 60 * 60,
    });
  }

  return applySecurityHeaders(response);
});

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|ico)$).*)'],
};
