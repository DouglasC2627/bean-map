"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { X } from "lucide-react";
import type { CoffeeBean, FlavorNotesData } from "@/types";
import { useBeanMap, type FlavorRanges } from "@/store";
import { cn, countryFlagEmoji } from "@/lib/utils";
import { chipPop } from "@/lib/motion";

interface Props {
  beans: CoffeeBean[];
  flavorNotes?: FlavorNotesData;
  className?: string;
}

function findFlavorLabel(data: FlavorNotesData, id: string): string {
  return (
    data.notes.find((n) => n.id === id)?.name ??
    data.subcategories.find((s) => s.id === id)?.name ??
    data.categories.find((c) => c.id === id)?.name ??
    id
  );
}

export function ActiveFilters({ beans, flavorNotes, className }: Props) {
  const t = useTranslations("activeFilters");
  const tEnum = useTranslations("enums");
  const tAxes = useTranslations("axes");
  const tCommon = useTranslations("common");
  const {
    filters,
    setRegions,
    toggleProcessing,
    toggleRoast,
    setAltitudeRange,
    setFlavorRange,
    toggleFlavorNote,
    resetFilters,
  } = useBeanMap();

  const countryNames = new Map<string, string>();
  beans.forEach((b) => {
    if (!countryNames.has(b.countryCode)) {
      countryNames.set(b.countryCode, b.country);
    }
  });

  const removeRegion = (cc: string) =>
    setRegions(filters.regions.filter((x) => x !== cc));

  const altitudeChanged =
    filters.altitudeRange[0] !== 0 || filters.altitudeRange[1] !== 2500;
  const changedFlavorAxes = (
    Object.keys(filters.flavorRanges) as Array<keyof FlavorRanges>
  ).filter((axis) => {
    const [a, b] = filters.flavorRanges[axis];
    return a !== 1 || b !== 10;
  });

  const totalChips =
    filters.regions.length +
    filters.processingMethods.length +
    filters.roastLevels.length +
    (altitudeChanged ? 1 : 0) +
    changedFlavorAxes.length +
    filters.flavorNoteIds.length;

  if (totalChips === 0) return null;

  return (
    <div className={cn("flex flex-wrap items-center gap-1.5", className)}>
      <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {t("label")}
      </span>

      <AnimatePresence initial={false}>
        {filters.regions.map((cc) => (
          <Chip key={`region-${cc}`} onRemove={() => removeRegion(cc)}>
            <span aria-hidden className="flag">{countryFlagEmoji(cc)}</span>
            {countryNames.get(cc) ?? cc}
          </Chip>
        ))}

        {filters.processingMethods.map((p) => (
          <Chip key={`proc-${p}`} onRemove={() => toggleProcessing(p)}>
            {tEnum(`processing.${p}`)}
          </Chip>
        ))}

        {filters.roastLevels.map((r) => (
          <Chip key={`roast-${r}`} onRemove={() => toggleRoast(r)}>
            {t("roastChip", { label: tEnum(`roast.${r}`) })}
          </Chip>
        ))}

        {altitudeChanged && (
          <Chip key="altitude" onRemove={() => setAltitudeRange([0, 2500])}>
            {filters.altitudeRange[0]}–{filters.altitudeRange[1]}{" "}
            {tCommon("masl")}
          </Chip>
        )}

        {changedFlavorAxes.map((axis) => {
          const [a, b] = filters.flavorRanges[axis];
          return (
            <Chip
              key={`flavor-${axis}`}
              onRemove={() => setFlavorRange(axis, [1, 10])}
            >
              {tAxes(axis)} {a}–{b}
            </Chip>
          );
        })}

        {flavorNotes &&
          filters.flavorNoteIds.map((id) => (
            <Chip key={`note-${id}`} onRemove={() => toggleFlavorNote(id)}>
              {findFlavorLabel(flavorNotes, id)}
            </Chip>
          ))}
      </AnimatePresence>

      {totalChips > 1 && (
        <button
          type="button"
          onClick={resetFilters}
          className="ml-1 text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
        >
          {tCommon("clearAll")}
        </button>
      )}
    </div>
  );
}

function Chip({
  children,
  onRemove,
}: {
  children: React.ReactNode;
  onRemove: () => void;
}) {
  const t = useTranslations("activeFilters");
  return (
    <motion.span
      layout
      variants={chipPop}
      initial="hidden"
      animate="show"
      exit="exit"
      className="inline-flex items-center gap-1 rounded-full border border-border bg-parchment px-2 py-0.5 text-xs text-roast-dark dark:bg-roast-dark dark:text-parchment"
    >
      {children}
      <button
        type="button"
        onClick={onRemove}
        aria-label={t("remove")}
        className="rounded-full p-0.5 text-muted-foreground hover:bg-roast-medium/20 hover:text-foreground"
      >
        <X className="h-3 w-3" />
      </button>
    </motion.span>
  );
}
