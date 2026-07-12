"use client";

import { SessionProvider } from "next-auth/react";

/**
 * Client wrapper for next-auth's SessionProvider. Mounted in the locale layout
 * so `useSession()` works in TopNav's UserMenu and the favorites-sync hook.
 * Fetches the session on the client, so the server layout stays statically
 * rendered (no cookie access on the server).
 */
export function SessionProviderWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SessionProvider>{children}</SessionProvider>;
}
