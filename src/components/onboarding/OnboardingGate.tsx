"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef } from "react";
import { parseAsString, useQueryState } from "nuqs";
import type { CoffeeBean } from "@/types";
import { useBeanMap } from "@/store";
import { hasSeenOnboarding, useOnboarding } from "@/store/onboarding";

/**
 * The tour proper is only fetched once it is actually going to run, following
 * the `SearchCommand` → `SearchCommandDialog` split. Everything above this
 * line is the whole cost the map page pays for onboarding on a return visit.
 */
const OnboardingTour = dynamic(
  () => import("./OnboardingTour").then((m) => m.OnboardingTour),
  { ssr: false },
);

/**
 * Search params that mean the visitor arrived with intent — a shared link, or
 * one of the `?region=<cc>` chips in `HomeIntro`. Auto-starting a tour over
 * someone's deep link would throw away the state they came for.
 *
 * Deliberately defined here rather than alongside the step definitions: this
 * module is eagerly loaded on the map page, and importing anything from
 * `onboarding-steps.ts` would drag the whole step table — and the store
 * closures it holds — out of the lazy chunk and into the initial bundle.
 */
const URL_STATE_KEYS = [
  "bean",
  "region",
  "processing",
  "roast",
  "altMin",
  "altMax",
  "flavorNotes",
  "lng",
  "lat",
  "zoom",
];

function hasUrlState(search: string): boolean {
  const params = new URLSearchParams(search);
  return URL_STATE_KEYS.some((k) => params.has(k));
}

interface Props {
  beans: CoffeeBean[];
}

export function OnboardingGate({ beans }: Props) {
  const open = useOnboarding((s) => s.open);
  const start = useOnboarding((s) => s.start);
  const isMapLoaded = useBeanMap((s) => s.isMapLoaded);

  // `tour` is a one-shot command, not app state, so it deliberately stays out
  // of `urlParsers` — nothing should restore it or sync it back.
  //
  // Parsed as a string and tested for presence rather than with
  // `parseAsBoolean`, which only recognises the literal "true" — so the
  // friendlier `?tour=1` this app links to would have parsed as false.
  const [tourParam, setTourParam] = useQueryState(
    "tour",
    parseAsString.withOptions({ history: "replace", shallow: true }),
  );

  const autoStartDecided = useRef(false);

  useEffect(() => {
    // Waiting on the map matters for both correctness and LCP: before `load`
    // the visitor is looking at the MapBackdrop, and there is nothing to
    // spotlight. When NEXT_PUBLIC_MAPBOX_TOKEN is unset this never fires, so
    // the tour correctly never runs.
    if (!isMapLoaded) return;

    // An explicit request always wins — over the seen flag and over the
    // deep-link suppression below. Checked before `autoStartDecided` so that
    // the footer link still works when the visitor is already on the map and
    // this component never remounts. Clearing the param keeps the URL
    // shareable and makes the effect idempotent.
    if (tourParam !== null) {
      void setTourParam(null);
      // Also closes the auto-start path: clearing the param re-runs this
      // effect, and a first-time visitor arriving on `?tour=1` would
      // otherwise fall through below and `start()` a second time, snapping
      // the tour back to step 0.
      autoStartDecided.current = true;
      start();
      return;
    }

    if (autoStartDecided.current) return;
    autoStartDecided.current = true;

    // Storage is read here rather than during render: the map page is
    // statically generated, so a render-time read would hydrate mismatched.
    if (hasSeenOnboarding()) return;
    if (hasUrlState(window.location.search)) return;
    start();
  }, [isMapLoaded, tourParam, setTourParam, start]);

  // Unmounting on close is load-bearing: it is what runs the tour's cleanup,
  // which puts the filters, selection and camera back as they were.
  if (!open) return null;
  return <OnboardingTour beans={beans} />;
}
