"use client";

import { useTranslations } from "next-intl";
import { useBeanMap } from "@/store";
import { useShallow } from "zustand/react/shallow";
import type { FlavorRanges } from "@/store";
import { Slider } from "@/components/ui/slider";

const AXES: Array<keyof FlavorRanges> = [
  "acidity",
  "body",
  "sweetness",
  "bitterness",
];

export function FlavorSliders() {
  const tAxes = useTranslations("axes");
  const { filters, setFlavorRange } = useBeanMap(
    useShallow((s) => ({
      filters: s.filters,
      setFlavorRange: s.setFlavorRange,
    })),
  );

  return (
    <div className="space-y-4">
      {AXES.map((axis) => {
        const range = filters.flavorRanges[axis];
        return (
          <div key={axis}>
            <div className="mb-1 flex items-baseline justify-between">
              <span className="text-sm">{tAxes(axis)}</span>
              <span className="font-mono text-xs text-muted-foreground">
                {range[0]}–{range[1]}
              </span>
            </div>
            <Slider
              min={1}
              max={10}
              step={1}
              value={range}
              onValueChange={(v) => {
                if (Array.isArray(v) && v.length === 2) {
                  setFlavorRange(axis, [v[0], v[1]]);
                }
              }}
            />
          </div>
        );
      })}
    </div>
  );
}
