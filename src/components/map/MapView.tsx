"use client";

import dynamic from "next/dynamic";
import { Suspense } from "react";
import type { CoffeeBean, BrewingMethod, FlavorNotesData } from "@/types";
import { BeanPanel } from "@/components/bean/BeanPanel";
import { FilterPanel } from "@/components/filter/FilterPanel";
import { UrlStateSync } from "@/components/shared/UrlStateSync";
import { ComparisonTray } from "@/components/compare/ComparisonTray";
import { FlavorWheelOverlay } from "@/components/map/FlavorWheelOverlay";

const CoffeeMap = dynamic(
  () => import("./CoffeeMap").then((m) => m.CoffeeMap),
  {
    ssr: false,
    loading: () => (
      <div className="relative flex h-full min-h-[70vh] flex-1 items-center justify-center overflow-hidden bg-parchment dark:bg-roast-dark">
        <div className="skeleton absolute inset-0" />
        <span className="relative text-sm text-muted-foreground">
          Loading map…
        </span>
      </div>
    ),
  },
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
      <CoffeeMap beans={beans} flavorNotes={flavorNotes} />
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
