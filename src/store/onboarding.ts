"use client";

import { create } from "zustand";

/**
 * Tiny global UI store for the map onboarding tour, mirroring
 * `src/store/auth-dialog.ts`: the tour is mounted once (by `OnboardingGate`
 * inside `MapView`) and can be started from anywhere.
 *
 * Only the index lives here. Which steps that index refers to is decided by
 * `OnboardingTour`, because the mobile tour is a subset of the desktop one.
 */
interface OnboardingState {
  open: boolean;
  step: number;
  start: () => void;
  setStep: (step: number) => void;
  close: () => void;
}

export const useOnboarding = create<OnboardingState>((set) => ({
  open: false,
  step: 0,
  start: () => set({ open: true, step: 0 }),
  setStep: (step) => set({ step }),
  close: () => set({ open: false, step: 0 }),
}));

/** Imperative helper for non-hook call sites. */
export function startOnboarding() {
  useOnboarding.getState().start();
}

/**
 * Persistence for "this browser has already been shown the tour".
 *
 * Deliberately localStorage and not the database: there is no user-preferences
 * table, and — like every other feature except favorites and notes — this has
 * to work signed out. Key naming, the `typeof window` guard and the try/catch
 * on every access follow the existing convention in `src/lib/search.ts` and
 * `src/components/brewing/BrewCalculator.tsx`.
 */
const STORAGE_KEY = "beanmap.onboarding";

/**
 * Bump when the tour changes enough that people who saw the old one should be
 * shown the new one. A stored record from an older version re-triggers.
 */
export const ONBOARDING_VERSION = 1;

interface OnboardingRecord {
  seen: boolean;
  version: number;
  completedAt: string;
}

/**
 * Must only be called from an effect, never during render: the map page is
 * statically generated, so reading storage while rendering would produce a
 * hydration mismatch (this is why `BrewTimer` restores its sound preference in
 * an effect rather than in a lazy `useState` initializer).
 */
export function hasSeenOnboarding(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw) as Partial<OnboardingRecord>;
    return parsed.seen === true && parsed.version === ONBOARDING_VERSION;
  } catch {
    return false;
  }
}

export function markOnboardingSeen() {
  if (typeof window === "undefined") return;
  try {
    const record: OnboardingRecord = {
      seen: true,
      version: ONBOARDING_VERSION,
      completedAt: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
  } catch {
    // Private mode / storage disabled — the tour just shows again next visit.
  }
}
