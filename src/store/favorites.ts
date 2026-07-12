"use client";

import { create } from "zustand";

/**
 * Favorites now require an account, so this store simply mirrors the signed-in
 * user's server-side favorites (loaded by `use-favorites-sync`). It is empty
 * and `loaded: false` until a session is present — there is no localStorage
 * persistence, since favoriting is gated behind sign-in.
 */
interface FavoritesState {
  /** Bean slug → time added (ms), for "date added" sorting. */
  favorites: Record<string, number>;
  /** True once the server list has been fetched for the current session. */
  loaded: boolean;

  setAll: (favorites: Record<string, number>) => void;
  add: (slug: string, addedAt?: number) => void;
  remove: (slug: string) => void;
  clear: () => void;
}

export const useFavorites = create<FavoritesState>((set) => ({
  favorites: {},
  loaded: false,

  setAll: (favorites) => set({ favorites, loaded: true }),

  add: (slug, addedAt = Date.now()) =>
    set((s) =>
      s.favorites[slug]
        ? s
        : { favorites: { ...s.favorites, [slug]: addedAt } },
    ),

  remove: (slug) =>
    set((s) => {
      if (!s.favorites[slug]) return s;
      const next = { ...s.favorites };
      delete next[slug];
      return { favorites: next };
    }),

  clear: () => set({ favorites: {}, loaded: false }),
}));

/** Convenience selector: is a given bean slug currently favorited? */
export function useIsFavorite(slug: string): boolean {
  return useFavorites((s) => Boolean(s.favorites[slug]));
}
