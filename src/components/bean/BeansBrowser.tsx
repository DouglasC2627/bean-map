"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { LayoutGrid, Map as MapIcon, Table as TableIcon } from "lucide-react";
import type { CoffeeBean, FlavorNotesData } from "@/types";
import { useBeanMap, filterBeans } from "@/store";
import { useLocateBeanOnPage } from "@/lib/use-locate-bean";
import {
  cn,
  countryFlagEmoji,
  flavorNoteLabel,
  formatAltitude,
} from "@/lib/utils";
import { easeOut } from "@/lib/motion";
import { ActiveFilters } from "@/components/filter/ActiveFilters";
import { CompareToggle } from "@/components/compare/CompareToggle";

type View = "grid" | "table";
type SortKey =
  | "name"
  | "country"
  | "altitude"
  | "acidity"
  | "body"
  | "sweetness";

interface Props {
  beans: CoffeeBean[];
  flavorNotes: FlavorNotesData;
}

export function BeansBrowser({ beans, flavorNotes }: Props) {
  const [view, setView] = useState<View>("grid");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const filters = useBeanMap((s) => s.filters);
  useLocateBeanOnPage();

  const filtered = useMemo(
    () => filterBeans(beans, filters, flavorNotes),
    [beans, filters, flavorNotes],
  );

  const sorted = useMemo(() => {
    const arr = [...filtered];
    arr.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "name":
          cmp = a.name.localeCompare(b.name);
          break;
        case "country":
          cmp = a.country.localeCompare(b.country);
          break;
        case "altitude":
          cmp = a.altitudeMasl[0] - b.altitudeMasl[0];
          break;
        case "acidity":
          cmp = a.flavorProfile.acidity - b.flavorProfile.acidity;
          break;
        case "body":
          cmp = a.flavorProfile.body - b.flavorProfile.body;
          break;
        case "sweetness":
          cmp = a.flavorProfile.sweetness - b.flavorProfile.sweetness;
          break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
    return arr;
  }, [filtered, sortKey, sortDir]);

  const headerSort = (key: SortKey, label: string) => (
    <button
      type="button"
      onClick={() => {
        if (sortKey === key) {
          setSortDir(sortDir === "asc" ? "desc" : "asc");
        } else {
          setSortKey(key);
          setSortDir("asc");
        }
      }}
      className="flex items-center gap-1 text-xs font-medium uppercase tracking-wider text-muted-foreground hover:text-foreground"
    >
      {label}
      {sortKey === key && <span>{sortDir === "asc" ? "↑" : "↓"}</span>}
    </button>
  );

  return (
    <div>
      <ActiveFilters
        beans={beans}
        flavorNotes={flavorNotes}
        className="mb-4"
      />
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="text-sm text-muted-foreground">
          {sorted.length} of {beans.length} beans
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setView("grid")}
            aria-pressed={view === "grid"}
            className={cn(
              "flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs",
              view === "grid"
                ? "border-roast-medium bg-roast-medium text-cream"
                : "border-border hover:border-roast-medium",
            )}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            Grid
          </button>
          <button
            type="button"
            onClick={() => setView("table")}
            aria-pressed={view === "table"}
            className={cn(
              "flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs",
              view === "table"
                ? "border-roast-medium bg-roast-medium text-cream"
                : "border-border hover:border-roast-medium",
            )}
          >
            <TableIcon className="h-3.5 w-3.5" />
            Table
          </button>
        </div>
      </div>

      {sorted.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-12 text-center text-sm text-muted-foreground">
          No beans match the active filters.
        </div>
      ) : view === "grid" ? (
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {sorted.map((bean, i) => (
            <BeanCard
              key={bean.id}
              bean={bean}
              flavorNotes={flavorNotes}
              index={i}
            />
          ))}
        </ul>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="bg-parchment/50 dark:bg-roast-dark/40">
              <tr className="text-left">
                <th className="px-3 py-2">{headerSort("name", "Name")}</th>
                <th className="px-3 py-2">
                  {headerSort("country", "Country")}
                </th>
                <th className="px-3 py-2">Region</th>
                <th className="px-3 py-2">
                  {headerSort("altitude", "Altitude")}
                </th>
                <th className="px-3 py-2">Processing</th>
                <th className="px-3 py-2">Roast</th>
                <th className="px-3 py-2">
                  {headerSort("acidity", "Acidity")}
                </th>
                <th className="px-3 py-2">{headerSort("body", "Body")}</th>
                <th className="px-3 py-2">
                  {headerSort("sweetness", "Sweetness")}
                </th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((b) => (
                <tr
                  key={b.id}
                  data-bean-id={b.id}
                  className="border-t border-border hover:bg-parchment/30 dark:hover:bg-roast-dark/30"
                >
                  <td className="px-3 py-2">
                    <Link
                      href={`/bean/${b.slug}`}
                      className="font-medium hover:text-roast-medium"
                    >
                      {b.name}
                    </Link>
                  </td>
                  <td className="px-3 py-2">
                    <span aria-hidden className="flag mr-1">
                      {countryFlagEmoji(b.countryCode)}
                    </span>
                    {b.country}
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">
                    {b.region}
                  </td>
                  <td className="px-3 py-2 font-mono text-xs">
                    {formatAltitude(b.altitudeMasl)}
                  </td>
                  <td className="px-3 py-2 capitalize">{b.processing}</td>
                  <td className="px-3 py-2 capitalize">
                    {b.roastRecommendation}
                  </td>
                  <td className="px-3 py-2 font-mono text-xs">
                    {b.flavorProfile.acidity}
                  </td>
                  <td className="px-3 py-2 font-mono text-xs">
                    {b.flavorProfile.body}
                  </td>
                  <td className="px-3 py-2 font-mono text-xs">
                    {b.flavorProfile.sweetness}
                  </td>
                  <td className="px-3 py-2">
                    <Link
                      href={`/?bean=${b.slug}`}
                      className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-roast-medium"
                    >
                      <MapIcon className="h-3 w-3" />
                      Map
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function BeanCard({
  bean,
  flavorNotes,
  index,
}: {
  bean: CoffeeBean;
  flavorNotes: FlavorNotesData;
  index: number;
}) {
  return (
    <motion.li
      data-bean-id={bean.id}
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px 0px" }}
      transition={{
        duration: 0.35,
        ease: easeOut,
        // Cascade within a row group; capped so later cards don't lag.
        delay: Math.min((index % 8) * 0.04, 0.28),
      }}
      className="rounded-lg border border-border bg-surface/60 p-4 transition-colors hover:border-roast-medium"
    >
      <div className="mb-1 flex items-center gap-2 text-xs text-muted-foreground">
        <span aria-hidden className="flag">{countryFlagEmoji(bean.countryCode)}</span>
        <span>{bean.country}</span>
        <span>·</span>
        <span>{bean.region}</span>
      </div>
      <Link
        href={`/bean/${bean.slug}`}
        className="block font-display text-lg leading-tight hover:text-roast-medium"
      >
        {bean.name}
      </Link>
      <p className="mt-1 font-mono text-xs text-muted-foreground">
        {formatAltitude(bean.altitudeMasl)} · {bean.processing}
      </p>
      <div className="mt-3 flex flex-wrap gap-1">
        {bean.flavorNotes.slice(0, 4).map((id) => (
          <span
            key={id}
            className="rounded-full bg-parchment px-2 py-0.5 text-[10px] text-roast-dark dark:bg-roast-dark dark:text-parchment"
          >
            {flavorNoteLabel(flavorNotes, id)}
          </span>
        ))}
      </div>
      <div className="mt-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            href={`/bean/${bean.slug}`}
            className="text-xs text-roast-medium hover:underline"
          >
            View profile
          </Link>
          <Link
            href={`/?bean=${bean.slug}`}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-roast-medium"
          >
            <MapIcon className="h-3 w-3" />
            Show on map
          </Link>
        </div>
        <CompareToggle beanId={bean.id} variant="compact" />
      </div>
    </motion.li>
  );
}
