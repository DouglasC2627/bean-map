/**
 * Renders the flavor radar as a standalone SVG data URI. Used by the `next/og`
 * image routes, where Satori renders `<img src={dataUri}>` reliably but cannot
 * run the hook-based `FlavorRadar` React component.
 */
import type { FlavorProfile } from "@/types";
import {
  AXES,
  CENTER,
  MAX,
  pointFor,
  polygonPoints,
  RINGS,
  SIZE,
} from "./radar-geometry";

interface RadarSeries {
  profile: FlavorProfile;
  color: string;
}

export function radarSvgDataUri(
  series: RadarSeries[],
  opts?: { grid?: string },
): string {
  const grid = opts?.grid ?? "#A67C52";
  const multi = series.length > 1;

  const rings = RINGS.map((ring) => {
    const pts = AXES.map((_, i) => {
      const [x, y] = pointFor(i, ring);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(" ");
    return `<polygon points="${pts}" fill="none" stroke="${grid}" stroke-opacity="${
      ring === MAX ? 0.55 : 0.22
    }" stroke-width="${ring === MAX ? 1 : 0.75}"/>`;
  }).join("");

  const spokes = AXES.map((_, i) => {
    const [x, y] = pointFor(i, MAX);
    return `<line x1="${CENTER}" y1="${CENTER}" x2="${x.toFixed(1)}" y2="${y.toFixed(
      1,
    )}" stroke="${grid}" stroke-opacity="0.28"/>`;
  }).join("");

  const polys = series
    .map(
      (s) =>
        `<polygon points="${polygonPoints(s.profile)}" fill="${s.color}" fill-opacity="${
          multi ? 0.22 : 0.4
        }" stroke="${s.color}" stroke-width="2" stroke-linejoin="round"/>`,
    )
    .join("");

  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${SIZE} ${SIZE}" width="${SIZE}" height="${SIZE}">` +
    rings +
    spokes +
    polys +
    `</svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
