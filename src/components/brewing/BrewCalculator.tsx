"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import type { BrewRecommendation } from "@/types";
import { parseRatio } from "@/lib/utils";

interface Props {
  recommendation: BrewRecommendation;
}

const CUP_KEY = "beanmap.preferred-cup-ml";
const CUP_OPTIONS = [200, 250, 300, 350];

function readSavedCupSize(): number {
  if (typeof window === "undefined") return 250;
  try {
    const saved = localStorage.getItem(CUP_KEY);
    if (!saved) return 250;
    const n = Number(saved);
    return CUP_OPTIONS.includes(n) ? n : 250;
  } catch {
    return 250;
  }
}

export function BrewCalculator({ recommendation }: Props) {
  const t = useTranslations("brew");
  const [cups, setCups] = useState(1);
  const [cupSize, setCupSize] = useState<number>(readSavedCupSize);

  const onCupSizeChange = (v: number) => {
    setCupSize(v);
    try {
      localStorage.setItem(CUP_KEY, String(v));
    } catch {
      // ignore
    }
  };

  const ratio = parseRatio(recommendation.ratio);
  const waterMl = cupSize * cups;
  const coffeeG = Number.isFinite(ratio)
    ? Math.round((waterMl / ratio) * 10) / 10
    : 0;

  return (
    <div className="space-y-3 rounded-lg border border-border bg-surface/60 p-4">
      <div className="flex items-baseline justify-between">
        <h4 className="text-sm font-medium">{t("doseCalculator")}</h4>
        <span className="font-mono text-xs text-muted-foreground">
          {recommendation.ratio}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1 text-xs text-muted-foreground">
          {t("cups")}
          <div className="flex items-center gap-1">
            <button
              type="button"
              aria-label={t("decreaseCups")}
              onClick={() => setCups(Math.max(1, cups - 1))}
              className="h-7 w-7 rounded-md border border-border hover:border-roast-medium"
            >
              −
            </button>
            <input
              type="number"
              min={1}
              max={20}
              value={cups}
              onChange={(e) => {
                const n = Number(e.target.value);
                setCups(Number.isFinite(n) ? Math.max(1, Math.min(20, n)) : 1);
              }}
              className="h-7 w-full rounded-md border border-border bg-background text-center font-mono text-sm"
            />
            <button
              type="button"
              aria-label={t("increaseCups")}
              onClick={() => setCups(Math.min(20, cups + 1))}
              className="h-7 w-7 rounded-md border border-border hover:border-roast-medium"
            >
              +
            </button>
          </div>
        </label>

        <label className="flex flex-col gap-1 text-xs text-muted-foreground">
          {t("cupSize")}
          <select
            value={cupSize}
            onChange={(e) => onCupSizeChange(Number(e.target.value))}
            className="h-7 rounded-md border border-border bg-background px-2 font-mono text-sm"
          >
            {CUP_OPTIONS.map((o) => (
              <option key={o} value={o}>
                {o}ml
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid grid-cols-2 gap-3 border-t border-border pt-3 text-sm">
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">
            {t("coffee")}
          </div>
          <div className="font-mono text-lg">{coffeeG}g</div>
        </div>
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">
            {t("water")}
          </div>
          <div className="font-mono text-lg">{waterMl}ml</div>
        </div>
      </div>
    </div>
  );
}
