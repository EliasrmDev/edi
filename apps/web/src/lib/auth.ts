import NextAuth from 'next-auth';
import type { DefaultSession } from 'next-auth';
import Google from 'next-auth/providers/google';
import MicrosoftEntraID from 'next-auth/providers/microsoft-entra-id';

declare module 'next-auth' {
  interface Session {
    user: { id: string; apiSession?: string } & DefaultSession['user'];
  }
  interface JWT {
    id?: string;
    apiSession?: string;
    error?: string;
  }
}

const INTERNAL_API_URL = process.env.API_URL ?? 'http://localhost:3001';

const providers = [
  Google({
    clientId: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  }),
  ...(process.env.AUTH_MICROSOFT_ENTRA_ID_ID
    ? [
        MicrosoftEntraID({
          clientId: process.env.AUTH_MICROSOFT_ENTRA_ID_ID,
          clientSecret: process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET!,
          // The 'common' endpoint returns tokens whose 'iss' claim contains the
          // user's real tenant ID (e.g. .../REAL-GUID/v2.0), but OIDC discovery
          // for 'common' advertises the literal template "{tenantid}/v2.0".
          // Jose's strict iss check always fails. Fix: disable ID-token validation
          // and use the Graph userinfo endpoint to read the profile instead.
          idToken: false,
          authorization: {
            url: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
            params: { scope: 'openid profile email' },
          },
          token: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
          userinfo: 'https://graph.microsoft.com/oidc/userinfo',
          profile(profile: {
            sub: string;
            name?: string;
            email?: string;
            preferred_username?: string;
            picture?: string;
          }) {
            return {
              id: profile.sub,
              name: profile.name ?? null,
              email: (profile.email ?? profile.preferred_username ?? null) as string,
              image: profile.picture ?? null,
            };
          },
        }),
      ]
    : []),
];

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers,
  secret: process.env.AUTH_SECRET,
  trustHost: true,
  session: { strategy: 'jwt', maxAge: 30 * 24 * 60 * 60 },
  cookies: {
    sessionToken: {
      name:
        process.env.NODE_ENV === 'production'
          ? '__Secure-next-auth.session-token'
          : 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax' as const,
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        domain:
          process.env.NODE_ENV === 'production'
            ? process.env.AUTH_COOKIE_DOMAIN
            : undefined,
      },
    },
  },
  callbacks: {
    async jwt({ token, user, account }) {
      // Only on initial OAuth sign-in (account is present on first callback)
      if (account && user?.email) {
        try {
          const internalSecret = process.env.OAUTH_INTERNAL_SECRET;
          const res = await fetch(`${INTERNAL_API_URL}/api/auth/oauth/signin`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(internalSecret ? { 'x-internal-secret': internalSecret } : {}),
            },
            body: JSON.stringify({
              provider: account.provider,
              providerAccountId: account.providerAccountId,
              email: user.email,
              displayName: user.name ?? null,
            }),
          });
          if (!res.ok) {
            if (process.env.NODE_ENV === 'development') {
              const text = await res.text().catch(() => '(no body)');
              console.error(
                `[auth] oauth/signin failed: ${res.status} ${res.statusText} — ${text}`,
              );
            }
            token.error = 'OAuthSigninError';
            return token;
          }
          const body = (await res.json()) as {
            data: { userId: string; sessionToken: string };
          };
          token.id = body.data.userId;
          token.apiSession = body.data.sessionToken;
        } catch (err) {
          if (process.env.NODE_ENV === 'development') {
            console.error('[auth] oauth/signin network error:', err);
          }
          token.error = 'OAuthSigninError';
        }
      }
      return token;
    },
    session({ session, token }) {
      if (typeof token.id === 'string') session.user.id = token.id;
      if (typeof token.apiSession === 'string') session.user.apiSession = token.apiSession;
      return session;
    },
  },
  pages: { signIn: '/login', error: '/login' },
  debug: process.env.NODE_ENV === 'development' && process.env.AUTH_DEBUG !== 'false',
});
