import NextAuth from 'next-auth';
import type { DefaultSession } from 'next-auth';
import Google from 'next-auth/providers/google';
import MicrosoftEntraID from 'next-auth/providers/microsoft-entra-id';
import type { MicrosoftEntraIDProfile } from 'next-auth/providers/microsoft-entra-id';

declare module 'next-auth' {
  interface Session {
    user: { id: string; apiSession?: string; error?: string } & DefaultSession['user'];
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
          issuer: process.env.AUTH_MICROSOFT_ENTRA_ID_ISSUER,
          profile(profile: MicrosoftEntraIDProfile) {
            return {
              id: profile.sub,
              name: profile.name ?? profile.preferred_username,
              email: profile.email ?? profile.preferred_username,
              image: null,
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
            const text = await res.text().catch(() => '(no body)');
            console.error(
              `[auth] oauth/signin failed: ${res.status} ${res.statusText} — ${text}`,
            );
            token.error = 'OAuthSigninError';
            return token;
          }
          const body = (await res.json()) as {
            data: { userId: string; sessionToken: string };
          };
          token.id = body.data.userId;
          token.apiSession = body.data.sessionToken;
        } catch (err) {
          console.error('[auth] oauth/signin network error:', err);
          token.error = 'OAuthSigninError';
        }
      }
      return token;
    },
    session({ session, token }) {
      if (typeof token.id === 'string') session.user.id = token.id;
      if (typeof token.apiSession === 'string') session.user.apiSession = token.apiSession;
      if (typeof token.error === 'string') session.user.error = token.error;
      return session;
    },
  },
  pages: { signIn: '/login', error: '/login' },
  debug: process.env.NODE_ENV === 'development' && process.env.AUTH_DEBUG !== 'false',
});