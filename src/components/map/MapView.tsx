"use client";

import dynamic from "next/dynamic";
import { Suspense } from "react";
import { useTranslations } from "next-intl";
import type { CoffeeBean, BrewingMethod, FlavorNotesData } from "@/types";
import { BeanPanel } from "@/components/bean/BeanPanel";
import { FilterPanel } from "@/components/filter/FilterPanel";
import { UrlStateSync } from "@/components/shared/UrlStateSync";
import { ComparisonTray } from "@/components/compare/ComparisonTray";
import { FlavorWheelOverlay } from "@/components/map/FlavorWheelOverlay";

/**
 * Branded backdrop rendered *behind* the map and left permanently in the DOM.
 * Its large display text paints at first-paint and stays put, so it becomes a
 * stable LCP element (~FCP) instead of LCP waiting several seconds for
 * Mapbox's own DOM. The opaque map covers it once loaded.
 *
 * Deliberately a <p>, not an <h1>: this is loading copy that a visitor sees
 * for a second or two, and it used to be the map page's only heading — which
 * made "Loading the interactive map…" the most descriptive text a crawler
 * could find here. The page's real <h1> now lives in the intro section below
 * the map (see app/[locale]/HomeIntro.tsx).
 */
function MapBackdrop() {
  const t = useTranslations("map");
  return (
    <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center overflow-hidden bg-parchment dark:bg-roast-dark">
      <div aria-hidden className="skeleton absolute inset-0" />
      <div className="relative flex max-w-xl flex-col items-center gap-3 px-6 text-center">
        <p className="font-display text-4xl leading-tight text-roast-dark sm:text-5xl dark:text-cream">
          {t("loadingTitle")}
        </p>
        <p className="text-sm text-muted-foreground">{t("loadingSubtitle")}</p>
      </div>
    </div>
  );
}

// No `loading` fallback: the map renders nothing until ready, so the persistent
// MapBackdrop shows through, then the loaded map paints on top of it.
const CoffeeMap = dynamic(
  () => import("./CoffeeMap").then((m) => m.CoffeeMap),
  { ssr: false },
);

interface Props {
  beans: CoffeeBean[];
  methods: BrewingMethod[];
  flavorNotes: FlavorNotesData;
}

export function MapView({ beans, methods, flavorNotes }: Props) {
  return (
    <div className="relative flex flex-col overflow-x-clip">
      <Suspense fallback={null}>
        <UrlStateSync beans={beans} />
      </Suspense>
      {/*
        An explicit height rather than `flex-1`, because the home page now has
        content below the map (HomeIntro + the site footer) and the map must
        still fill the first screen exactly. `svh` is the viewport with mobile
        browser chrome *expanded*, so nothing is cut off on first load — and
        the few pixels of the intro that peek through hint that there is more
        to scroll to. 3.5rem is the sticky TopNav.

        This element is also the positioning context for the two map controls
        below, which are `absolute` so they scroll away with the map instead of
        floating over the copy underneath it.
      */}
      <div className="relative flex h-[calc(100svh-3.5rem)] min-h-104 flex-col">
        {/* Persistent LCP anchor behind the map (see MapBackdrop). */}
        <MapBackdrop />
        <CoffeeMap beans={beans} flavorNotes={flavorNotes} />
        <FilterPanel
          beans={beans}
          flavorNotes={flavorNotes}
          triggerClassName="absolute left-3 top-4"
        />
        <FlavorWheelOverlay beans={beans} flavorNotes={flavorNotes} />
      </div>
      <BeanPanel beans={beans} methods={methods} flavorNotes={flavorNotes} />
      <ComparisonTray
        beans={beans}
        methods={methods}
        flavorNotes={flavorNotes}
      />
    </div>
  );
}
