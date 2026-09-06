"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter, usePathname } from "@/i18n/navigation";
import { Crosshair, Flower2, SlidersHorizontal, X } from "lucide-react";
import type {
  CoffeeBean,
  FlavorNotesData,
  ProcessingMethod,
  RoastLevel,
} from "@/types";
import { useBeanMap, filterBeans } from "@/store";
import { useShallow } from "zustand/react/shallow";
import { Slider } from "@/components/ui/slider";
import { cn, countryFlagEmoji } from "@/lib/utils";
import { ORIGIN_REGIONS } from "@/lib/origins";
import { FlavorSliders } from "./FlavorSliders";

const PROCESSINGS: ProcessingMethod[] = [
  "washed",
  "natural",
  "honey",
  "anaerobic",
  "wet-hulled",
];

const ROASTS: RoastLevel[] = [
  "light",
  "medium-light",
  "medium",
  "medium-dark",
  "dark",
];

interface Props {
  beans: CoffeeBean[];
  flavorNotes?: FlavorNotesData;
  /**
   * Positioning for the toggle pill. Defaults to viewport-fixed, which is
   * right for the pages that are a single scrolling column. The map page
   * overrides it to `absolute` so the pill is anchored to the map section and
   * scrolls away with it instead of floating over the copy underneath.
   */
  triggerClassName?: string;
}

export function FilterPanel({ beans, flavorNotes, triggerClassName }: Props) {
  const t = useTranslations("filters");
  const tEnum = useTranslations("enums");
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
    isFlavorWheelOpen,
    setFlavorWheelOpen,
  } = useBeanMap(
    useShallow((s) => ({
      filters: s.filters,
      setRegions: s.setRegions,
      toggleProcessing: s.toggleProcessing,
      toggleRoast: s.toggleRoast,
      setAltitudeRange: s.setAltitudeRange,
      resetFilters: s.resetFilters,
      requestFitBounds: s.requestFitBounds,
      isFilterPanelOpen: s.isFilterPanelOpen,
      setFilterPanelOpen: s.setFilterPanelOpen,
      isFlavorWheelOpen: s.isFlavorWheelOpen,
      setFlavorWheelOpen: s.setFlavorWheelOpen,
    })),
  );

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
    return ORIGIN_REGIONS.map((c) => ({
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
        aria-label={t("toggle")}
        aria-expanded={isFilterPanelOpen}
        className={cn(
          "z-30 flex items-center gap-2 rounded-md border border-border bg-background/90 px-3 py-2 text-sm shadow-md backdrop-blur hover:border-roast-medium",
          triggerClassName ?? "fixed left-3 top-18",
        )}
      >
        <SlidersHorizontal className="h-4 w-4" />
        <span>{t("title")}</span>
        {activeCount > 0 && (
          <span className="rounded-full bg-roast-medium px-1.5 py-0.5 text-[10px] text-cream">
            {activeCount}
          </span>
        )}
      </button>

      {/* Mobile backdrop */}
      <button
        type="button"
        aria-label={t("close")}
        onClick={() => setFilterPanelOpen(false)}
        className={cn(
          "fixed inset-0 z-20 bg-espresso/40 transition-opacity sm:hidden",
          isFilterPanelOpen
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0",
        )}
      />

      <aside
        aria-label={t("title")}
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
          <h2 className="font-display text-lg">{t("title")}</h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={resetFilters}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              {t("reset")}
            </button>
            <button
              type="button"
              onClick={() => setFilterPanelOpen(false)}
              aria-label={t("close")}
              className="rounded-md p-1 text-muted-foreground hover:bg-parchment hover:text-foreground dark:hover:bg-roast-dark"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </header>

        <div className="flex items-center justify-between gap-2 px-4 pt-3 pb-2">
          <div className="text-xs text-muted-foreground">
            {t.rich("matchCount", {
              matching,
              total: beans.length,
              mono: (chunks) => <span className="font-mono">{chunks}</span>,
            })}
          </div>
          <button
            type="button"
            onClick={onShowOnMap}
            disabled={matching === 0}
            className="inline-flex items-center gap-1 rounded-md border border-border bg-roast-medium px-2 py-1 text-xs text-cream transition hover:bg-roast-dark disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground"
          >
            <Crosshair className="h-3 w-3" />
            {onMapPage ? t("showOnMap") : t("viewOnMap")}
          </button>
        </div>

        {/* Region */}
        <Section title={t("region")}>
          <div className="space-y-3">
            {availableByContinent.map((c) => (
              <div key={c.key}>
                <div className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {t(`regions.${c.key}`)}
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
                      <span aria-hidden className="flag">{countryFlagEmoji(cc)}</span>
                      <span>{countryNames.get(cc) ?? cc}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* Processing */}
        <Section title={t("processingMethod")}>
          <div className="flex flex-col gap-1.5">
            {PROCESSINGS.map((id) => (
              <label
                key={id}
                className="flex cursor-pointer items-center gap-2 text-sm"
              >
                <input
                  type="checkbox"
                  checked={filters.processingMethods.includes(id)}
                  onChange={() => toggleProcessing(id)}
                  className="h-4 w-4 accent-roast-medium"
                />
                <span>{tEnum(`processing.${id}`)}</span>
              </label>
            ))}
          </div>
        </Section>

        {/* Roast */}
        <Section title={t("roastLevel")}>
          <div className="flex flex-wrap gap-1.5">
            {ROASTS.map((id) => {
              const active = filters.roastLevels.includes(id);
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => toggleRoast(id)}
                  className={cn(
                    "rounded-full border px-2.5 py-0.5 text-xs transition",
                    active
                      ? "border-roast-medium bg-roast-medium text-cream"
                      : "border-border bg-surface/60 text-foreground hover:border-roast-medium",
                  )}
                  aria-pressed={active}
                >
                  {tEnum(`roast.${id}`)}
                </button>
              );
            })}
          </div>
        </Section>

        {/* Altitude */}
        <Section title={t("altitude")}>
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
        <Section title={t("flavorNotes")}>
          <button
            type="button"
            onClick={() => setFlavorWheelOpen(!isFlavorWheelOpen)}
            aria-pressed={isFlavorWheelOpen}
            className={cn(
              "flex w-full items-center justify-between gap-2 rounded-md border bg-surface/60 px-3 py-2 text-sm transition hover:border-roast-medium",
              isFlavorWheelOpen ? "border-roast-medium" : "border-border",
            )}
          >
            <span className="flex items-center gap-2">
              <Flower2 className="h-4 w-4" />
              {t("flavorWheel")}
            </span>
            {isFlavorWheelOpen ? (
              <span className="text-xs text-muted-foreground">{t("hide")}</span>
            ) : filters.flavorNoteIds.length > 0 ? (
              <span className="rounded-full bg-roast-medium px-1.5 py-0.5 text-[10px] text-cream">
                {filters.flavorNoteIds.length}
              </span>
            ) : (
              <span className="text-xs text-muted-foreground">{t("open")}</span>
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
              {t("flavorProfile")}
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
