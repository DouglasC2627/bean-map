"use client";

import { create } from "zustand";

interface SearchUiStore {
  open: boolean;
  setOpen: (v: boolean) => void;
}

/** Open-state for the ⌘K search, shared by the trigger (TopNav) and the dialog. */
export const useSearchUi = create<SearchUiStore>((set) => ({
  open: false,
  setOpen: (open) => set({ open }),
}));
