"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { LayoutGrid, Map as MapIcon, Table as TableIcon } from "lucide-react";
import type { CoffeeBean, FlavorNotesData } from "@/types";
import { Link } from "@/i18n/navigation";
import { useBeanMap, filterBeans } from "@/store";
import { useLocateBeanOnPage } from "@/lib/use-locate-bean";
import { cn, countryFlagEmoji, formatAltitude } from "@/lib/utils";
import { ActiveFilters } from "@/components/filter/ActiveFilters";
import { FavoriteButton } from "@/components/shared/FavoriteButton";
import { BeanCard } from "./BeanCard";

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
  const locale = useLocale();
  const t = useTranslations("beansBrowser");
  const tEnum = useTranslations("enums");
  const tCommon = useTranslations("common");
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
          // Pass the active locale so the collation order is identical on the
          // server and the client — a bare localeCompare() uses each runtime's
          // default locale, which reorders CJK strings and breaks hydration.
          cmp = a.name.localeCompare(b.name, locale);
          break;
        case "country":
          cmp = a.country.localeCompare(b.country, locale);
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
  }, [filtered, sortKey, sortDir, locale]);

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
          {t("countOf", { shown: sorted.length, total: beans.length })}
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
            {t("grid")}
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
            {t("table")}
          </button>
        </div>
      </div>

      {sorted.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-12 text-center text-sm text-muted-foreground">
          {t("empty")}
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
                <th className="px-3 py-2">{headerSort("name", t("col.name"))}</th>
                <th className="px-3 py-2">
                  {headerSort("country", t("col.country"))}
                </th>
                <th className="px-3 py-2">{t("col.region")}</th>
                <th className="px-3 py-2">
                  {headerSort("altitude", t("col.altitude"))}
                </th>
                <th className="px-3 py-2">{t("col.processing")}</th>
                <th className="px-3 py-2">{t("col.roast")}</th>
                <th className="px-3 py-2">
                  {headerSort("acidity", t("col.acidity"))}
                </th>
                <th className="px-3 py-2">{headerSort("body", t("col.body"))}</th>
                <th className="px-3 py-2">
                  {headerSort("sweetness", t("col.sweetness"))}
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
                    {formatAltitude(b.altitudeMasl, tCommon("masl"))}
                  </td>
                  <td className="px-3 py-2">
                    {tEnum(`processing.${b.processing}`)}
                  </td>
                  <td className="px-3 py-2">
                    {tEnum(`roast.${b.roastRecommendation}`)}
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
                    <div className="flex items-center justify-end gap-1">
                      <FavoriteButton
                        slug={b.slug}
                        name={b.name}
                        variant="compact"
                      />
                      <Link
                        href={`/?bean=${b.slug}`}
                        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-roast-medium"
                      >
                        <MapIcon className="h-3 w-3" />
                        {t("map")}
                      </Link>
                    </div>
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
