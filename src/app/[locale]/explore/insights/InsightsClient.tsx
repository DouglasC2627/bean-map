"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import type { CoffeeBean, FlavorNotesData } from "@/types";
import { useBeanMap, filterBeans } from "@/store";
import { useLocateBeanOnPage } from "@/lib/use-locate-bean";
import { ActiveFilters } from "@/components/filter/ActiveFilters";
import { CollapsibleSection } from "@/components/shared/CollapsibleSection";
import { AltitudeChart } from "@/components/visualization/AltitudeChart";
import { SeasonalChart } from "@/components/visualization/SeasonalChart";

interface Props {
  beans: CoffeeBean[];
  flavorNotes: FlavorNotesData;
}

export function InsightsClient({ beans, flavorNotes }: Props) {
  const t = useTranslations("insightsClient");
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
        {t("showing", { shown: filtered.length, total: beans.length })}
      </div>

      <CollapsibleSection
        title={t("altitudeRanges")}
        description={t("altitudeDesc")}
      >
        <div className="overflow-hidden rounded-lg border border-border bg-surface/40 p-4">
          <AltitudeChart beans={filtered} onSelectBean={onSelectBean} />
        </div>
      </CollapsibleSection>

      <CollapsibleSection
        title={t("harvestCalendar")}
        description={t("harvestDesc")}
      >
        <div className="overflow-hidden rounded-lg border border-border bg-surface/40 p-4">
          <SeasonalChart beans={filtered} onSelectBean={onSelectBean} />
        </div>
      </CollapsibleSection>
    </div>
  );
}
