"use client";

import { useId } from "react";
import { useTranslations } from "next-intl";
import type { FlavorProfile } from "@/types";
import { cn } from "@/lib/utils";
import {
  AXES,
  CENTER,
  DEFAULT_COLORS,
  MAX,
  pointFor,
  polygonPoints,
  RADIUS,
  RINGS,
  SIZE,
} from "@/lib/radar-geometry";

export interface RadarSeries {
  id: string;
  label: string;
  profile: FlavorProfile;
  color?: string;
}

interface Props {
  series: RadarSeries[];
  size?: number;
  showLabels?: boolean;
  showLegend?: boolean;
  className?: string;
}

export function FlavorRadar({
  series,
  size = SIZE,
  showLabels = true,
  showLegend = false,
  className,
}: Props) {
  const titleId = useId();
  const t = useTranslations("radar");
  const tAxes = useTranslations("axes");

  return (
    <div className={cn("flex flex-col items-center", className)}>
      <svg
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        width={size}
        height={size}
        role="img"
        aria-labelledby={titleId}
        className="overflow-visible motion-safe:animate-[radar-fade_400ms_ease-out]"
      >
        <title id={titleId}>
          {t("title", { names: series.map((s) => s.label).join(", ") })}
        </title>

        {/* Rings */}
        <g className="text-border" stroke="currentColor" fill="none">
          {RINGS.map((ring) => (
            <polygon
              key={ring}
              points={AXES.map((_, i) => {
                const [x, y] = pointFor(i, ring);
                return `${x.toFixed(2)},${y.toFixed(2)}`;
              }).join(" ")}
              strokeOpacity={ring === MAX ? 0.6 : 0.25}
              strokeWidth={ring === MAX ? 1 : 0.75}
            />
          ))}
        </g>

        {/* Spokes */}
        <g className="text-border" stroke="currentColor" strokeOpacity={0.3}>
          {AXES.map((_, i) => {
            const [x, y] = pointFor(i, MAX);
            return <line key={i} x1={CENTER} y1={CENTER} x2={x} y2={y} />;
          })}
        </g>

        {/* Series polygons */}
        <g>
          {series.map((s, idx) => {
            const color = s.color ?? DEFAULT_COLORS[idx % DEFAULT_COLORS.length];
            const points = polygonPoints(s.profile);
            return (
              <g key={s.id}>
                <polygon
                  points={points}
                  fill={color}
                  fillOpacity={series.length > 1 ? 0.18 : 0.32}
                  stroke={color}
                  strokeWidth={1.5}
                  strokeLinejoin="round"
                  className="motion-safe:animate-[radar-draw_500ms_ease-out_both]"
                  style={{ animationDelay: `${idx * 80}ms` }}
                />
                {AXES.map((axis, i) => {
                  const [x, y] = pointFor(i, s.profile[axis.key]);
                  return (
                    <circle
                      key={axis.key}
                      cx={x}
                      cy={y}
                      r={2.5}
                      fill={color}
                    />
                  );
                })}
              </g>
            );
          })}
        </g>

        {/* Axis labels */}
        {showLabels && (
          <g className="fill-muted-foreground text-[10px]">
            {AXES.map((axis, i) => {
              const [lx, ly] = pointFor(i, MAX + 1.5, RADIUS);
              const dx = lx - CENTER;
              const anchor =
                Math.abs(dx) < 0.5 ? "middle" : dx > 0 ? "start" : "end";
              return (
                <text
                  key={axis.key}
                  x={lx}
                  y={ly}
                  textAnchor={anchor}
                  dominantBaseline="middle"
                  fontFamily="var(--font-mono, ui-monospace, SFMono-Regular)"
                >
                  {tAxes(axis.key)}
                </text>
              );
            })}
          </g>
        )}
      </svg>

      {showLegend && series.length > 1 && (
        <ul className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs">
          {series.map((s, idx) => {
            const color = s.color ?? DEFAULT_COLORS[idx % DEFAULT_COLORS.length];
            return (
              <li key={s.id} className="flex items-center gap-1.5">
                <span
                  aria-hidden
                  className="inline-block h-2.5 w-2.5 rounded-sm"
                  style={{ background: color }}
                />
                <span>{s.label}</span>
              </li>
            );
          })}
        </ul>
      )}

      {/* Screen-reader-only data table. The `sr-only` utility sets width:1px,
          but a <table> ignores that and lays out at its full content width —
          which overflows and, because the page uses `overflow-x: clip` (not a
          scroll container), widens the mobile layout viewport and zooms the
          whole page out. Wrapping the table in an sr-only <div> (which does
          collapse to 1px and clip its overflow) keeps it out of layout while
          remaining in the accessibility tree. */}
      <div className="sr-only">
        <table>
          <caption>{t("caption")}</caption>
          <thead>
            <tr>
              <th>{t("bean")}</th>
              {AXES.map((a) => (
                <th key={a.key}>{tAxes(a.key)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {series.map((s) => (
              <tr key={s.id}>
                <th>{s.label}</th>
                {AXES.map((a) => (
                  <td key={a.key}>{s.profile[a.key]}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export const RADAR_COLORS = DEFAULT_COLORS;
