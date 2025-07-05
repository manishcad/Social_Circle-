
import NextAuth from "next-auth";
import EmailProvider from "next-auth/providers/email";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import prisma from "../../../lib/prisma";
import { compare } from "bcryptjs";

export const authOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    EmailProvider({
      sendVerificationRequest: async ({ identifier, url }) => {
        const resend = new (await import("resend")).Resend(process.env.RESEND_API_KEY);

        await resend.emails.send({
          from: process.env.EMAIL_FROM,
          to: identifier,
          subject: "Sign in to your account",
          html: `<p>Click <a href="${url}">here</a> to sign in.</p>`,
        });
      },
    }),

    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: {},
        password: {},
      },
      async authorize(credentials) {
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user || !user.password) throw new Error("Invalid credentials");

        if (!user.emailVerified) throw new Error("Please verify your email.");

        const isValid = await compare(credentials.password, user.password);
        if (!isValid) throw new Error("Invalid credentials");

        return user;
      },
    }),
  ],
  session: { strategy: "jwt" },
  pages: {
    signIn: "/auth",
    verifyRequest: "/verify-email",
  },
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub;
        session.user.emailVerified = token.emailVerified;
        session.user.image = token.image;
        session.user.name = token.name;
      }
      return session;
    },
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.emailVerified = user.emailVerified;
        token.image = user.image;
        token.name = user.name;
      }
      
      // Handle session updates
      if (trigger === "update" && session) {
        token.image = session.user.image;
        token.name = session.user.name;
      }
      
      return token;
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
