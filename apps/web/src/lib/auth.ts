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
          issuer: process.env.AUTH_MICROSOFT_ENTRA_ID_ISSUER,
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
          const res = await fetch(`${INTERNAL_API_URL}/api/auth/oauth/signin`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              provider: account.provider,
              providerAccountId: account.providerAccountId,
              email: user.email,
              displayName: user.name ?? null,
            }),
          });
          if (!res.ok) {
            token.error = 'OAuthSigninError';
            return token;
          }
          const body = (await res.json()) as {
            data: { userId: string; sessionToken: string };
          };
          token.id = body.data.userId;
          token.apiSession = body.data.sessionToken;
        } catch {
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
