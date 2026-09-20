import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";

export default {
  providers: [Google],
  pages: {
    signIn: "/login",
  },
  // JWT, not database sessions: middleware runs on the Edge runtime and can't reach
  // Postgres to validate a database session token, so the session must be self-contained.
  session: { strategy: "jwt" },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider !== "google") return false;
      return user.email === process.env.OWNER_EMAIL;
    },
    async jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
    async session({ session, token }) {
      if (session.user) session.user.id = token.id as string;
      return session;
    },
  },
} satisfies NextAuthConfig;
