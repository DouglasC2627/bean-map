"use client";

import { useMemo, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Crosshair, Flower2, SlidersHorizontal, X } from "lucide-react";
import type {
  CoffeeBean,
  FlavorNotesData,
  ProcessingMethod,
  RoastLevel,
} from "@/types";
import { useBeanMap, filterBeans } from "@/store";
import { Slider } from "@/components/ui/slider";
import { cn, countryFlagEmoji } from "@/lib/utils";
import { FlavorSliders } from "./FlavorSliders";

const CONTINENTS: Array<{ key: string; label: string; countries: string[] }> = [
  {
    key: "africa",
    label: "Africa",
    countries: ["ET", "KE", "RW", "TZ", "BI", "UG"],
  },
  {
    key: "central-america",
    label: "Central America",
    countries: ["GT", "CR", "PA", "HN", "NI", "SV", "MX"],
  },
  {
    key: "south-america",
    label: "South America",
    countries: ["CO", "BR", "PE", "BO"],
  },
  {
    key: "asia-pacific",
    label: "Asia-Pacific",
    countries: ["ID", "YE", "IN", "PG"],
  },
  {
    key: "islands",
    label: "Islands",
    countries: ["JM", "US"],
  },
];

const PROCESSINGS: Array<{ id: ProcessingMethod; label: string }> = [
  { id: "washed", label: "Washed" },
  { id: "natural", label: "Natural" },
  { id: "honey", label: "Honey" },
  { id: "anaerobic", label: "Anaerobic" },
  { id: "wet-hulled", label: "Wet-Hulled" },
];

const ROASTS: Array<{ id: RoastLevel; label: string }> = [
  { id: "light", label: "Light" },
  { id: "medium-light", label: "Medium-Light" },
  { id: "medium", label: "Medium" },
  { id: "medium-dark", label: "Medium-Dark" },
  { id: "dark", label: "Dark" },
];

interface Props {
  beans: CoffeeBean[];
  flavorNotes?: FlavorNotesData;
}

export function FilterPanel({ beans, flavorNotes }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const onMapPage = pathname === "/";

  const {
    filters,
    setRegions,
    toggleProcessing,
    toggleRoast,
    setAltitudeRange,
    resetFilters,
    requestFitBounds,
    isFilterPanelOpen,
    setFilterPanelOpen,
    setFlavorWheelOpen,
  } = useBeanMap();

  const [showFlavor, setShowFlavor] = useState(false);

  const onShowOnMap = () => {
    requestFitBounds();
    if (!onMapPage) router.push("/");
  };

  const matching = useMemo(
    () => filterBeans(beans, filters, flavorNotes).length,
    [beans, filters, flavorNotes],
  );

  const activeCount =
    (filters.regions.length ? 1 : 0) +
    (filters.processingMethods.length ? 1 : 0) +
    (filters.roastLevels.length ? 1 : 0) +
    (filters.altitudeRange[0] !== 0 || filters.altitudeRange[1] !== 2500
      ? 1
      : 0) +
    (Object.values(filters.flavorRanges).some(
      ([a, b]) => a !== 1 || b !== 10,
    )
      ? 1
      : 0) +
    (filters.flavorNoteIds.length ? 1 : 0);

  // Group countries present in the dataset
  const availableByContinent = useMemo(() => {
    const present = new Set(beans.map((b) => b.countryCode));
    return CONTINENTS.map((c) => ({
      ...c,
      countries: c.countries.filter((cc) => present.has(cc)),
    })).filter((c) => c.countries.length > 0);
  }, [beans]);

  const countryNames = useMemo(() => {
    const m = new Map<string, string>();
    beans.forEach((b) => {
      if (!m.has(b.countryCode)) m.set(b.countryCode, b.country);
    });
    return m;
  }, [beans]);

  const toggleRegion = (cc: string) => {
    if (filters.regions.includes(cc)) {
      setRegions(filters.regions.filter((x) => x !== cc));
    } else {
      setRegions([...filters.regions, cc]);
    }
  };

  return (
    <>
      {/* Toggle button (always visible on the map) */}
      <button
        type="button"
        onClick={() => setFilterPanelOpen(!isFilterPanelOpen)}
        aria-label="Toggle filters"
        aria-expanded={isFilterPanelOpen}
        className="fixed left-3 top-18 z-30 flex items-center gap-2 rounded-md border border-border bg-background/90 px-3 py-2 text-sm shadow-md backdrop-blur hover:border-roast-medium"
      >
        <SlidersHorizontal className="h-4 w-4" />
        <span>Filters</span>
        {activeCount > 0 && (
          <span className="rounded-full bg-roast-medium px-1.5 py-0.5 text-[10px] text-cream">
            {activeCount}
          </span>
        )}
      </button>

      {/* Mobile backdrop */}
      <button
        type="button"
        aria-label="Close filters"
        onClick={() => setFilterPanelOpen(false)}
        className={cn(
          "fixed inset-0 z-20 bg-espresso/40 transition-opacity sm:hidden",
          isFilterPanelOpen
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0",
        )}
      />

      <aside
        aria-label="Filters"
        aria-hidden={!isFilterPanelOpen}
        className={cn(
          "fixed z-30 flex flex-col overflow-x-hidden overflow-y-auto bg-background/95 shadow-xl backdrop-blur-sm transition-transform duration-300",
          // mobile: bottom sheet
          "bottom-0 left-0 right-0 max-h-[85vh] rounded-t-2xl border-t border-border",
          // desktop: left sidebar
          "sm:top-14 sm:left-0 sm:bottom-0 sm:right-auto sm:w-70 sm:max-h-none sm:rounded-none sm:border-t-0 sm:border-r",
          isFilterPanelOpen
            ? "translate-y-0 sm:translate-x-0"
            : "translate-y-full sm:translate-y-0 sm:-translate-x-full",
        )}
      >
        <header className="flex items-center justify-between border-b border-border p-4">
          <h2 className="font-display text-lg">Filters</h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={resetFilters}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Reset
            </button>
            <button
              type="button"
              onClick={() => setFilterPanelOpen(false)}
              aria-label="Close filters"
              className="rounded-md p-1 text-muted-foreground hover:bg-parchment hover:text-foreground dark:hover:bg-roast-dark"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </header>

        <div className="flex items-center justify-between gap-2 px-4 pt-3 pb-2">
          <div className="text-xs text-muted-foreground">
            <span className="font-mono">{matching}</span> of {beans.length} beans
            match
          </div>
          <button
            type="button"
            onClick={onShowOnMap}
            disabled={matching === 0}
            className="inline-flex items-center gap-1 rounded-md border border-border bg-roast-medium px-2 py-1 text-xs text-cream transition hover:bg-roast-dark disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground"
          >
            <Crosshair className="h-3 w-3" />
            {onMapPage ? "Show on map" : "View on map"}
          </button>
        </div>

        {/* Region */}
        <Section title="Region">
          <div className="space-y-3">
            {availableByContinent.map((c) => (
              <div key={c.key}>
                <div className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {c.label}
                </div>
                <div className="flex flex-col gap-1.5">
                  {c.countries.map((cc) => (
                    <label
                      key={cc}
                      className="flex cursor-pointer items-center gap-2 text-sm"
                    >
                      <input
                        type="checkbox"
                        checked={filters.regions.includes(cc)}
                        onChange={() => toggleRegion(cc)}
                        className="h-4 w-4 accent-roast-medium"
                      />
                      <span aria-hidden>{countryFlagEmoji(cc)}</span>
                      <span>{countryNames.get(cc) ?? cc}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* Processing */}
        <Section title="Processing Method">
          <div className="flex flex-col gap-1.5">
            {PROCESSINGS.map((p) => (
              <label
                key={p.id}
                className="flex cursor-pointer items-center gap-2 text-sm"
              >
                <input
                  type="checkbox"
                  checked={filters.processingMethods.includes(p.id)}
                  onChange={() => toggleProcessing(p.id)}
                  className="h-4 w-4 accent-roast-medium"
                />
                <span>{p.label}</span>
              </label>
            ))}
          </div>
        </Section>

        {/* Roast */}
        <Section title="Roast Level">
          <div className="flex flex-wrap gap-1.5">
            {ROASTS.map((r) => {
              const active = filters.roastLevels.includes(r.id);
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => toggleRoast(r.id)}
                  className={cn(
                    "rounded-full border px-2.5 py-0.5 text-xs transition",
                    active
                      ? "border-roast-medium bg-roast-medium text-cream"
                      : "border-border bg-surface/60 text-foreground hover:border-roast-medium",
                  )}
                  aria-pressed={active}
                >
                  {r.label}
                </button>
              );
            })}
          </div>
        </Section>

        {/* Altitude */}
        <Section title="Altitude (masl)">
          <div className="px-1 pt-2 pb-1">
            <Slider
              min={0}
              max={2500}
              step={50}
              value={filters.altitudeRange}
              onValueChange={(v) => {
                if (Array.isArray(v) && v.length === 2) {
                  setAltitudeRange([v[0], v[1]]);
                }
              }}
            />
            <div className="mt-2 flex justify-between font-mono text-xs text-muted-foreground">
              <span>{filters.altitudeRange[0]}</span>
              <span>{filters.altitudeRange[1]}</span>
            </div>
          </div>
        </Section>

        {/* Flavor Notes — opens the interactive wheel as a popover */}
        <Section title="Flavor Notes">
          <button
            type="button"
            onClick={() => setFlavorWheelOpen(true)}
            className="flex w-full items-center justify-between gap-2 rounded-md border border-border bg-surface/60 px-3 py-2 text-sm transition hover:border-roast-medium"
          >
            <span className="flex items-center gap-2">
              <Flower2 className="h-4 w-4" />
              Flavor wheel
            </span>
            {filters.flavorNoteIds.length > 0 ? (
              <span className="rounded-full bg-roast-medium px-1.5 py-0.5 text-[10px] text-cream">
                {filters.flavorNoteIds.length}
              </span>
            ) : (
              <span className="text-xs text-muted-foreground">Open</span>
            )}
          </button>
        </Section>

        {/* Flavor Profile (collapsible) */}
        <div className="border-b border-border">
          <button
            type="button"
            onClick={() => setShowFlavor(!showFlavor)}
            className="flex w-full items-center justify-between px-4 py-3 text-left"
            aria-expanded={showFlavor}
          >
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Flavor Profile
            </span>
            <span className="font-mono text-xs text-muted-foreground">
              {showFlavor ? "−" : "+"}
            </span>
          </button>
          {showFlavor && (
            <div className="px-4 pb-4">
              <FlavorSliders />
            </div>
          )}
        </div>
      </aside>
    </>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-b border-border px-4 py-3">
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </h3>
      {children}
    </section>
  );
}
