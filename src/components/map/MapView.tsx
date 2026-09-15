"use client";

import dynamic from "next/dynamic";
import { Suspense } from "react";
import { useTranslations } from "next-intl";
import { ChevronDown } from "lucide-react";
import type { CoffeeBean, BrewingMethod, FlavorNotesData } from "@/types";
import { BeanPanel } from "@/components/bean/BeanPanel";
import { FilterPanel } from "@/components/filter/FilterPanel";
import { UrlStateSync } from "@/components/shared/UrlStateSync";
import { ComparisonTray } from "@/components/compare/ComparisonTray";
import { FlavorWheelOverlay } from "@/components/map/FlavorWheelOverlay";
import { MapBeanList } from "@/components/map/MapBeanList";
import { OnboardingGate } from "@/components/onboarding/OnboardingGate";
import { usePrefersReducedMotion } from "@/lib/use-media-query";

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

/**
 * The way down to the intro copy, pinned to the bottom of the map section.
 */
function ScrollCue() {
  const t = useTranslations("map");
  const reduceMotion = usePrefersReducedMotion();
  return (
    <a
      href="#home-intro"
      onClick={(e) => {
        const target = document.getElementById("home-intro");

        if (!target) return;
        e.preventDefault();
        target.scrollIntoView({
          behavior: reduceMotion ? "auto" : "smooth",
          block: "start",
        });
      }}
      className="absolute inset-x-0 bottom-9 z-30 mx-auto flex w-fit items-center gap-1.5 rounded-full border border-border bg-background/80 px-3.5 py-1.5 text-xs text-muted-foreground shadow-sm backdrop-blur transition hover:border-roast-medium hover:text-foreground"
    >
      {t("scrollHint")}
      <ChevronDown aria-hidden className="h-3.5 w-3.5" />
    </a>
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
      <div className="relative flex h-[calc(100svh-3.5rem)] min-h-104 flex-col">
        {/* Persistent LCP anchor behind the map (see MapBackdrop). */}
        <MapBackdrop />
        {/* First in DOM order inside the map section, so a keyboard or screen
            reader user meets the map's accessible equivalent before the
            canvas they cannot use. */}
        <MapBeanList beans={beans} flavorNotes={flavorNotes} />
        <CoffeeMap beans={beans} flavorNotes={flavorNotes} />
        <FilterPanel
          beans={beans}
          flavorNotes={flavorNotes}
          triggerClassName="absolute left-3 top-4"
        />
        <FlavorWheelOverlay beans={beans} flavorNotes={flavorNotes} />
        <ScrollCue />
      </div>
      <BeanPanel beans={beans} methods={methods} flavorNotes={flavorNotes} />
      <ComparisonTray
        beans={beans}
        methods={methods}
        flavorNotes={flavorNotes}
      />
      {/*
        Mounted here rather than in the root layout: the tour only exists on
        the map, and anything in the layout is serialized into the RSC payload
        of every route — including the static Learn articles.
        Suspense for the same reason as UrlStateSync: it reads search params.
      */}
      <Suspense fallback={null}>
        <OnboardingGate beans={beans} />
      </Suspense>
    </div>
  );
}
