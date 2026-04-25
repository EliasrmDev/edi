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
    async jwt({ token, user }) {
      if (user?.id) token.id = user.id
      return token
    },
    session({ session, token }) {
      if (token.id) session.user.id = token.id as string
      return session
    },
  },
  pages: { signIn: '/login', error: '/login' },
  debug: process.env.NODE_ENV === 'development' && process.env.AUTH_DEBUG !== 'false',
});
