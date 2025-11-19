
import type { AuthOptions } from 'next-auth';
import type { Session } from 'next-auth';
import type { JWT } from 'next-auth/jwt';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from './prisma';
import bcrypt from 'bcryptjs';

export const authOptions: AuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Mot de passe', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user || !bcrypt.compareSync(credentials.password, user.password_hash)) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const u: any = user as any;
        token.id = u.id;
        token.role = u.role;
        // plus de clientUid ici
      }
      return token;
    },
    async session({ session, token }: { session: Session; token: JWT }) {
      const updatedSession: Session = {
        ...session,
        user: {
          ...(session.user ?? { name: null, email: null, image: null }),
          id: token.id,
          role: token.role,
        } as Session['user'],
      };
      // plus de clientUid ici
      return updatedSession;
    },
  },
  pages: {
    signIn: '/auth/signin',
  },
  session: { strategy: 'jwt' },
};
