"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { List, X } from "lucide-react";
import type { CoffeeBean, FlavorNotesData } from "@/types";
import { useBeanMap, filterBeans } from "@/store";
import { cn } from "@/lib/utils";

interface Props {
  beans: CoffeeBean[];
  flavorNotes: FlavorNotesData;
}

/**
 * The keyboard/screen-reader equivalent of the map itself.
 *
 * Mapbox paints its markers into a `<canvas>`, so the bean pins simply do not
 * exist in the accessibility tree and cannot be reached with a keyboard. This
 * renders the same set of beans — filtered by the same store state the map
 * reads, so the two always agree — as a real list of buttons, and each button
 * does exactly what clicking a pin does: select the bean (which opens the
 * detail panel) and fly the camera to it.
 *
 * It is a disclosure rather than a permanently exposed list: 50+ buttons ahead
 * of the map would be a long detour for every keyboard user on every visit.
 * The trigger itself is `sr-only` until focused, so it stays out of the visual
 * design but is the first thing a Tab press reaches on the map.
 */
export function MapBeanList({ beans, flavorNotes }: Props) {
  const t = useTranslations("map.beanList");
  const [open, setOpen] = useState(false);

  // Narrow selectors, not a bare `useBeanMap()`: the store also holds the
  // viewport, which the map rewrites on every animation frame while panning.
  const filters = useBeanMap((s) => s.filters);
  const selectedBeanId = useBeanMap((s) => s.selectedBeanId);
  const selectBean = useBeanMap((s) => s.selectBean);
  const requestFlyTo = useBeanMap((s) => s.requestFlyTo);

  const matching = useMemo(
    () =>
      filterBeans(beans, filters, flavorNotes).sort((a, b) =>
        a.name.localeCompare(b.name),
      ),
    [beans, filters, flavorNotes],
  );

  const onSelect = (bean: CoffeeBean) => {
    selectBean(bean.id);
    requestFlyTo(bean.coordinates, 5);
  };

  return (
    // Below the filter trigger (which owns left-3 top-4) so the two never
    // overlap once this one is revealed.
    <div className="absolute left-3 top-16 z-40">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={cn(
          "flex items-center gap-2 rounded-md border border-border bg-background/90 px-3 py-2 text-sm shadow-md backdrop-blur",
          // Out of the visual design until a keyboard user reaches it, at
          // which point it has to become visible — an invisible focus target
          // fails WCAG 2.4.7.
          "sr-only focus:not-sr-only focus:relative",
          open && "not-sr-only relative",
        )}
      >
        <List aria-hidden className="h-4 w-4" />
        {open ? t("hide") : t("show")}
      </button>

      {open && (
        <div className="mt-2 flex max-h-[60vh] w-72 max-w-[calc(100vw-1.5rem)] flex-col rounded-md border border-border bg-background/95 shadow-xl backdrop-blur">
          <div className="flex items-start justify-between gap-2 border-b border-border p-3">
            <div>
              <h2 className="font-display text-base leading-tight">
                {t("heading")}
              </h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {t("count", { matching: matching.length, total: beans.length })}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label={t("hide")}
              className="rounded-md p-1 text-muted-foreground hover:bg-parchment hover:text-foreground dark:hover:bg-roast-dark"
            >
              <X aria-hidden className="h-4 w-4" />
            </button>
          </div>

          {matching.length === 0 ? (
            <p className="p-3 text-sm text-muted-foreground">{t("empty")}</p>
          ) : (
            <ul className="overflow-y-auto p-1">
              {matching.map((bean) => (
                <li key={bean.id}>
                  <button
                    type="button"
                    onClick={() => onSelect(bean)}
                    aria-current={
                      bean.id === selectedBeanId ? "true" : undefined
                    }
                    className={cn(
                      "w-full rounded-md px-2 py-1.5 text-left text-sm hover:bg-parchment/60 dark:hover:bg-roast-dark/40",
                      bean.id === selectedBeanId &&
                        "bg-parchment/60 dark:bg-roast-dark/40",
                    )}
                  >
                    <span className="block truncate">{bean.name}</span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {bean.region} · {bean.country}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
