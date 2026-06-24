"use client";

import { Fragment, useMemo } from "react";
import { useLocale, useTranslations } from "next-intl";
import type { CoffeeBean } from "@/types";
import { cn, monthName } from "@/lib/utils";

interface Props {
  beans: CoffeeBean[];
  onSelectBean?: (bean: CoffeeBean) => void;
  className?: string;
  groupByRegion?: boolean;
}

const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);

export function SeasonalChart({
  beans,
  onSelectBean,
  className,
  groupByRegion = true,
}: Props) {
  const t = useTranslations("seasonal");
  const locale = useLocale();
  const currentMonth = new Date().getMonth() + 1;

  const groups = useMemo(() => {
    if (!groupByRegion) {
      return [
        {
          key: "all",
          label: t("allBeans"),
          beans: [...beans].sort((a, b) => a.name.localeCompare(b.name)),
        },
      ];
    }
    const map = new Map<string, CoffeeBean[]>();
    for (const b of beans) {
      const arr = map.get(b.country) ?? [];
      arr.push(b);
      map.set(b.country, arr);
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([country, list]) => ({
        key: country,
        label: country,
        beans: list.sort((a, b) => a.name.localeCompare(b.name)),
      }));
  }, [beans, groupByRegion, t]);

  if (beans.length === 0) {
    return (
      <div
        className={cn(
          "rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground",
          className,
        )}
      >
        {t("empty")}
      </div>
    );
  }

  return (
    <div className={cn("overflow-x-auto", className)}>
      <table className="w-full min-w-160 border-separate border-spacing-y-0.5 text-xs">
        <thead>
          <tr>
            <th className="sticky left-0 z-10 bg-background px-2 py-1 text-left text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              {t("bean")}
            </th>
            {MONTHS.map((m) => (
              <th
                key={m}
                className={cn(
                  "px-1 py-1 text-center text-[10px] font-mono",
                  m === currentMonth
                    ? "text-cherry-red"
                    : "text-muted-foreground",
                )}
              >
                {monthName(m, locale)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {groups.map((group) => (
            <Fragment key={group.key}>
              {groupByRegion && (
                <tr className="bg-parchment/50 dark:bg-roast-dark/40">
                  <td
                    className="sticky left-0 z-10 bg-parchment/50 px-2 pt-2 pb-0.5 text-[10px] font-semibold whitespace-nowrap uppercase tracking-wider text-roast-dark dark:bg-roast-dark/40 dark:text-parchment"
                  >
                    {group.label}
                  </td>
                  <td
                    colSpan={12}
                    aria-hidden
                    className="bg-parchment/50 pt-2 pb-0.5 dark:bg-roast-dark/40"
                  />
                </tr>
              )}
              {group.beans.map((bean) => {
                const harvestSet = new Set(bean.harvestMonths);
                const Tag: React.ElementType = onSelectBean ? "button" : "span";
                return (
                  <tr
                    key={bean.id}
                    data-bean-id={bean.id}
                    className="hover:bg-parchment/30 dark:hover:bg-roast-dark/30"
                  >
                    <td className="sticky left-0 z-10 max-w-40 truncate bg-background px-2 py-0.5">
                      <Tag
                        type={onSelectBean ? "button" : undefined}
                        onClick={
                          onSelectBean ? () => onSelectBean(bean) : undefined
                        }
                        className={cn(
                          "block w-full truncate text-left",
                          onSelectBean && "hover:text-roast-medium",
                        )}
                        title={`${bean.name} — ${bean.country}`}
                      >
                        {bean.name}
                      </Tag>
                    </td>
                    {MONTHS.map((m) => {
                      const active = harvestSet.has(m);
                      const isCurrent = m === currentMonth;
                      return (
                        <td key={m} className="px-1 py-0.5 text-center">
                          <span
                            aria-label={
                              active
                                ? t("harvestAria", { month: monthName(m, locale) })
                                : t("notHarvestedAria", {
                                    month: monthName(m, locale),
                                  })
                            }
                            className={cn(
                              "mx-auto block h-4 rounded-sm",
                              active
                                ? "bg-roast-medium"
                                : "bg-parchment/60 dark:bg-roast-dark/40",
                              isCurrent &&
                                active &&
                                "ring-1 ring-cherry-red ring-offset-1 ring-offset-background",
                              isCurrent &&
                                !active &&
                                "ring-1 ring-cherry-red/40 ring-offset-1 ring-offset-background",
                            )}
                          />
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </Fragment>
          ))}
        </tbody>
      </table>
      <p className="mt-2 text-[10px] text-muted-foreground">
        {t("currentMonthNote", { month: monthName(currentMonth, locale) })}
      </p>
    </div>
  );
}
