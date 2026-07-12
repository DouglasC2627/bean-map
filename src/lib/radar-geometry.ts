/**
 * Pure geometry for the 6-axis flavor radar — no React, no hooks, no Tailwind.
 *
 * Extracted from `FlavorRadar.tsx` so the same polar math can be reused where
 * that client component cannot run: notably the `next/og` (Satori) image
 * routes, which render inline SVG/JSX at request time without a React runtime.
 */
import type { FlavorProfile } from "@/types";

export const AXES: Array<{ key: keyof FlavorProfile }> = [
  { key: "acidity" },
  { key: "fruitiness" },
  { key: "complexity" },
  { key: "bitterness" },
  { key: "body" },
  { key: "sweetness" },
];

export const SIZE = 240;
export const CENTER = SIZE / 2;
export const PADDING = 32;
export const RADIUS = CENTER - PADDING;
export const RINGS = [2, 4, 6, 8, 10];
export const MAX = 10;

/** Brand palette used to color overlaid radar series (roast, cherry, water). */
export const DEFAULT_COLORS = ["#6F4E37", "#C1440E", "#5B8FA8"];

/** Cartesian coordinate of `value` (0–10) along the given axis index. */
export function pointFor(
  axisIndex: number,
  value: number,
  radius = RADIUS,
): readonly [number, number] {
  const angle = (Math.PI * 2 * axisIndex) / AXES.length - Math.PI / 2;
  const r = (Math.max(0, Math.min(MAX, value)) / MAX) * radius;
  return [CENTER + Math.cos(angle) * r, CENTER + Math.sin(angle) * r] as const;
}

/** SVG `points` string for a flavor profile's filled polygon. */
export function polygonPoints(profile: FlavorProfile, radius = RADIUS): string {
  return AXES.map((axis, i) => {
    const [x, y] = pointFor(i, profile[axis.key], radius);
    return `${x.toFixed(2)},${y.toFixed(2)}`;
  }).join(" ");
}
