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
 * Its large display heading paints at first-paint and stays put, so it becomes
 * a stable LCP element (~FCP) instead of LCP waiting several seconds for
 * Mapbox's own DOM. The opaque map covers it once loaded; it also gives the
 * otherwise-headingless map page a real <h1>.
 */
function MapBackdrop() {
  const t = useTranslations("map");
  return (
    <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center overflow-hidden bg-parchment dark:bg-roast-dark">
      <div aria-hidden className="skeleton absolute inset-0" />
      <div className="relative flex max-w-xl flex-col items-center gap-3 px-6 text-center">
        <h1 className="font-display text-4xl leading-tight text-roast-dark sm:text-5xl dark:text-cream">
          {t("loadingTitle")}
        </h1>
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
    <div className="relative flex flex-1 flex-col overflow-x-clip">
      <Suspense fallback={null}>
        <UrlStateSync beans={beans} />
      </Suspense>
      {/* Persistent LCP anchor behind the map (see MapBackdrop). */}
      <div className="relative flex min-h-[70vh] flex-1 flex-col">
        <MapBackdrop />
        <CoffeeMap beans={beans} flavorNotes={flavorNotes} />
      </div>
      <FilterPanel beans={beans} flavorNotes={flavorNotes} />
      <FlavorWheelOverlay beans={beans} flavorNotes={flavorNotes} />
      <BeanPanel beans={beans} methods={methods} flavorNotes={flavorNotes} />
      <ComparisonTray
        beans={beans}
        methods={methods}
        flavorNotes={flavorNotes}
      />
    </div>
  );
}
