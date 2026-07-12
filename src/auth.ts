import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { getDb, isDbConfigured, schema } from "@/db";

// The adapter persists users/accounts. It is only wired when a database is
// configured, so importing this module never touches the DB otherwise — the
// app stays buildable and runnable without any backend env.
const adapter = isDbConfigured()
  ? DrizzleAdapter(getDb(), {
      usersTable: schema.users,
      accountsTable: schema.accounts,
      sessionsTable: schema.sessions,
      verificationTokensTable: schema.verificationTokens,
    })
  : undefined;

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter,
  // Trust the deployment host (Vercel/self-hosted) for callback URLs.
  trustHost: true,
  // A real AUTH_SECRET is required for sign-in to be secure (see .env.example).
  // The fallback only lets the session endpoint respond cleanly (empty session)
  // when auth is unconfigured — sign-in is impossible without OAuth creds anyway,
  // so it keeps the app running in local-only mode instead of 500-ing.
  secret: process.env.AUTH_SECRET ?? "beanmap-unconfigured-fallback-secret",
  // JWT sessions (no DB session lookups); the adapter still records the user
  // and OAuth account rows on first sign-in.
  session: { strategy: "jwt" },
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID,
      clientSecret: process.env.AUTH_GITHUB_SECRET,
    }),
  ],
  callbacks: {
    // Carry the user id onto the JWT on sign-in, then expose it on the session
    // so API routes can scope queries by userId.
    jwt({ token, user }) {
      if (user?.id) token.id = user.id;
      return token;
    },
    session({ session, token }) {
      if (token.id && session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
});
