"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import type { CoffeeBean, FlavorNotesData } from "@/types";
import { useBeanMap, filterBeans } from "@/store";
import { useLocateBeanOnPage } from "@/lib/use-locate-bean";
import { ActiveFilters } from "@/components/filter/ActiveFilters";
import { AltitudeChart } from "@/components/visualization/AltitudeChart";
import { SeasonalChart } from "@/components/visualization/SeasonalChart";

interface Props {
  beans: CoffeeBean[];
  flavorNotes: FlavorNotesData;
}

export function InsightsClient({ beans, flavorNotes }: Props) {
  const router = useRouter();
  const filters = useBeanMap((s) => s.filters);
  useLocateBeanOnPage();
  const filtered = useMemo(
    () => filterBeans(beans, filters, flavorNotes),
    [beans, filters, flavorNotes],
  );

  const onSelectBean = (bean: CoffeeBean) => {
    router.push(`/?bean=${bean.slug}`);
  };

  return (
    <div className="space-y-10">
      <ActiveFilters beans={beans} flavorNotes={flavorNotes} />

      <div className="text-sm text-muted-foreground">
        Showing {filtered.length} of {beans.length} beans
      </div>

      <section>
        <header className="mb-3">
          <h2 className="font-display text-xl">Altitude ranges</h2>
          <p className="text-sm text-muted-foreground">
            Sorted by midpoint altitude (highest first). Click a bar to open a
            bean on the map.
          </p>
        </header>
        <div className="overflow-hidden rounded-lg border border-border bg-surface/40 p-4">
          <AltitudeChart
            beans={filtered}
            onSelectBean={onSelectBean}
            maxRows={40}
          />
        </div>
      </section>

      <section>
        <header className="mb-3">
          <h2 className="font-display text-xl">Harvest calendar</h2>
          <p className="text-sm text-muted-foreground">
            When each origin is in season. The current month is highlighted in
            cherry red.
          </p>
        </header>
        <div className="overflow-hidden rounded-lg border border-border bg-surface/40 p-4">
          <SeasonalChart beans={filtered} onSelectBean={onSelectBean} />
        </div>
      </section>
    </div>
  );
}
