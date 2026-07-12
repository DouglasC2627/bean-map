"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useFavorites } from "@/store/favorites";

/**
 * Loads the signed-in user's favorites from the server into the store, and
 * clears them on sign-out. Favorites require an account, so there is nothing
 * local to merge — the server is always the source of truth.
 */
export function useFavoritesSync() {
  const { status } = useSession();
  const setAll = useFavorites((s) => s.setAll);
  const clear = useFavorites((s) => s.clear);

  useEffect(() => {
    if (status === "authenticated") {
      (async () => {
        try {
          const res = await fetch("/api/favorites");
          if (res.ok) {
            const data = (await res.json()) as {
              favorites?: Array<{ beanSlug: string; addedAt: number }>;
            };
            const map: Record<string, number> = {};
            for (const f of data.favorites ?? []) map[f.beanSlug] = f.addedAt;
            setAll(map);
          }
        } catch {
          // leave the store empty on failure
        }
      })();
    } else if (status === "unauthenticated") {
      clear();
    }
  }, [status, setAll, clear]);
}
