"use client";

import { useTranslations } from "next-intl";
import { Star } from "lucide-react";
import type { BrewRecommendation, BrewingMethod } from "@/types";
import { cn, formatBrewTime } from "@/lib/utils";

interface Props {
  recommendation: BrewRecommendation;
  method: BrewingMethod | undefined;
  isBest?: boolean;
  onClick?: () => void;
}

export function BrewCard({
  recommendation: rec,
  method,
  isBest,
  onClick,
}: Props) {
  const t = useTranslations("brew");
  const tEnum = useTranslations("enums");
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative flex w-44 shrink-0 snap-start flex-col gap-1.5 rounded-lg border bg-surface/60 p-3 text-left transition hover:border-roast-medium",
        isBest ? "border-roast-medium" : "border-border",
      )}
    >
      {isBest && (
        <span className="absolute -top-2 right-2 rounded-full bg-roast-medium px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-cream">
          {t("best")}
        </span>
      )}
      <div className="flex items-baseline justify-between gap-2">
        <span className="truncate font-medium">
          {method?.name ?? rec.methodId}
        </span>
        <AffinityDots score={rec.affinity} />
      </div>
      <dl className="grid grid-cols-2 gap-x-2 gap-y-0.5 font-mono text-[11px] text-muted-foreground">
        <dt className="sr-only">{t("grind")}</dt>
        <dd>{tEnum(`grind.${rec.grindSize}`)}</dd>
        <dt className="sr-only">{t("temperature")}</dt>
        <dd>{rec.waterTempC}°C</dd>
        <dt className="sr-only">{t("ratio")}</dt>
        <dd>{rec.ratio}</dd>
        <dt className="sr-only">{t("time")}</dt>
        <dd>{formatBrewTime(rec.brewSeconds)}</dd>
      </dl>
      <div className="flex items-center gap-0.5">
        {Array.from({ length: 5 }, (_, i) => (
          <Star
            key={i}
            className={cn(
              "h-2.5 w-2.5",
              i < rec.difficulty
                ? "fill-roast-medium text-roast-medium"
                : "text-muted-foreground/40",
            )}
          />
        ))}
        <span className="ml-1 text-[10px] text-muted-foreground">
          {t("difficulty")}
        </span>
      </div>
    </button>
  );
}

function AffinityDots({ score }: { score: number }) {
  const t = useTranslations("brew");
  const filled = Math.round(score);
  return (
    <div
      aria-label={t("affinityOf", { score })}
      className="flex shrink-0 items-center gap-[2px]"
    >
      {Array.from({ length: 10 }, (_, i) => (
        <span
          key={i}
          className={cn(
            "h-1.5 w-1.5 rounded-full",
            i < filled ? "bg-roast-medium" : "bg-parchment dark:bg-roast-dark",
          )}
        />
      ))}
    </div>
  );
}
