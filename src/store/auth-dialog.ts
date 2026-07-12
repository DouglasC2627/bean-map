"use client";

import { create } from "zustand";

/**
 * Tiny global UI store for the sign-in dialog, so any component (the account
 * avatar, the favorite heart, note prompts) can open the same branded dialog.
 */
interface AuthDialogState {
  open: boolean;
  setOpen: (open: boolean) => void;
}

export const useAuthDialog = create<AuthDialogState>((set) => ({
  open: false,
  setOpen: (open) => set({ open }),
}));

/** Imperative helper for non-hook call sites. */
export function openSignIn() {
  useAuthDialog.getState().setOpen(true);
}
