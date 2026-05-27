"use client";

import { useMemo } from "react";
import type { CoffeeBean } from "@/types";
import { cn } from "@/lib/utils";

interface Props {
  beans: CoffeeBean[];
  onSelectBean?: (bean: CoffeeBean) => void;
  className?: string;
  maxRows?: number;
}

const MIN_ALT = 0;
const MAX_ALT = 2500;

// Returns a color from leaf-green (low) -> roast-dark (high) via roast-light midtone.
function altitudeColor(midpoint: number): string {
  const t = Math.min(1, Math.max(0, (midpoint - MIN_ALT) / (MAX_ALT - MIN_ALT)));
  // Three stops: green #4A7C59 -> light brown #A67C52 -> dark roast #3B2314
  const stops = [
    { t: 0, c: [74, 124, 89] },
    { t: 0.55, c: [166, 124, 82] },
    { t: 1, c: [59, 35, 20] },
  ];
  let lo = stops[0];
  let hi = stops[stops.length - 1];
  for (let i = 0; i < stops.length - 1; i++) {
    if (t >= stops[i].t && t <= stops[i + 1].t) {
      lo = stops[i];
      hi = stops[i + 1];
      break;
    }
  }
  const span = hi.t - lo.t || 1;
  const local = (t - lo.t) / span;
  const c = lo.c.map((v, i) => Math.round(v + (hi.c[i] - v) * local));
  return `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
}

export function AltitudeChart({ beans, onSelectBean, className, maxRows }: Props) {
  const rows = useMemo(() => {
    const sorted = [...beans].sort(
      (a, b) =>
        (b.altitudeMasl[0] + b.altitudeMasl[1]) / 2 -
        (a.altitudeMasl[0] + a.altitudeMasl[1]) / 2,
    );
    return maxRows ? sorted.slice(0, maxRows) : sorted;
  }, [beans, maxRows]);

  if (rows.length === 0) {
    return (
      <div
        className={cn(
          "rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground",
          className,
        )}
      >
        No beans to chart.
      </div>
    );
  }

  return (
    <div className={cn("space-y-1", className)}>
      <div
        aria-hidden
        className="mb-1 grid w-full grid-cols-[minmax(120px,1fr)_minmax(0,3fr)_auto] items-center gap-3 px-2 text-[10px] font-mono text-muted-foreground"
      >
        <span />
        <span className="flex justify-between">
          <span>{MIN_ALT}m</span>
          <span>{MAX_ALT}m</span>
        </span>
        <span />
      </div>
      <ul className="space-y-1">
        {rows.map((bean, i) => {
          const [low, high] = bean.altitudeMasl;
          const mid = (low + high) / 2;
          const color = altitudeColor(mid);
          const leftPct = (low / MAX_ALT) * 100;
          const widthPct = Math.max(2, ((high - low) / MAX_ALT) * 100);
          const Tag: React.ElementType = onSelectBean ? "button" : "div";
          return (
            <li key={bean.id} data-bean-id={bean.id}>
              <Tag
                type={onSelectBean ? "button" : undefined}
                onClick={onSelectBean ? () => onSelectBean(bean) : undefined}
                className={cn(
                  "group grid w-full grid-cols-[minmax(120px,1fr)_minmax(0,3fr)_auto] items-center gap-3 rounded-md px-2 py-1 text-left text-xs",
                  onSelectBean && "hover:bg-parchment/40 dark:hover:bg-roast-dark/40",
                )}
                style={{ animationDelay: `${i * 12}ms` }}
              >
                <span className="truncate text-foreground" title={bean.name}>
                  {bean.name}
                </span>
                <span className="relative h-3 rounded-full bg-parchment/60 dark:bg-roast-dark/60">
                  <span
                    className="absolute top-0 bottom-0 rounded-full motion-safe:animate-[bar-grow_500ms_ease-out_both]"
                    style={{
                      left: `${leftPct}%`,
                      width: `${widthPct}%`,
                      background: color,
                      animationDelay: `${i * 18}ms`,
                    }}
                  />
                </span>
                <span className="font-mono text-[10px] text-muted-foreground">
                  {low}–{high}
                </span>
              </Tag>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
