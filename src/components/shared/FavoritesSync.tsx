"use client";

import { useFavoritesSync } from "@/lib/use-favorites-sync";

/** Headless mount point for the favorites merge-on-login sync. */
export function FavoritesSync() {
  useFavoritesSync();
  return null;
}
