import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { FlavorNotesData } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function flavorNoteLabel(data: FlavorNotesData, id: string): string {
  return data.notes.find((n) => n.id === id)?.name ?? id;
}

export function countryFlagEmoji(iso2: string): string {
  if (iso2.length !== 2) return "";
  const base = 0x1f1e6;
  const A = "A".charCodeAt(0);
  const upper = iso2.toUpperCase();
  return String.fromCodePoint(
    base + (upper.charCodeAt(0) - A),
    base + (upper.charCodeAt(1) - A),
  );
}

const MONTH_NAMES_EN = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

/**
 * Localized short month label. Pass the active locale (e.g. from `useLocale()`
 * in client components or the route param in server components). zh-TW uses the
 * compact numeric form ("1月"); other locales fall back to English abbreviations.
 */
export function monthName(m: number, locale: string = "en"): string {
  const idx = (((m - 1) % 12) + 12) % 12;
  if (locale === "zh-TW") return `${idx + 1}月`;
  return MONTH_NAMES_EN[idx] ?? "";
}

export function formatAltitude(
  range: [number, number],
  unit: string = "masl",
): string {
  return `${range[0]}–${range[1]} ${unit}`;
}

// "1:16" -> 16, "1:14.5" -> 14.5
export function parseRatio(ratio: string): number {
  const parts = ratio.split(":");
  if (parts.length !== 2) return NaN;
  const a = parseFloat(parts[0]);
  const b = parseFloat(parts[1]);
  if (!a || !b) return NaN;
  return b / a;
}

export function celsiusToFahrenheit(c: number): number {
  return Math.round((c * 9) / 5 + 32);
}

export function formatBrewTime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return s ? `${m}m ${s}s` : `${m}m`;
  }
  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60);
  return m ? `${h}h ${m}m` : `${h}h`;
}

export const GRIND_SCALE: Array<{
  id:
    | "extra-fine"
    | "fine"
    | "medium-fine"
    | "medium"
    | "medium-coarse"
    | "coarse"
    | "extra-coarse";
  label: string;
}> = [
  { id: "extra-fine", label: "Extra Fine" },
  { id: "fine", label: "Fine" },
  { id: "medium-fine", label: "Medium-Fine" },
  { id: "medium", label: "Medium" },
  { id: "medium-coarse", label: "Medium-Coarse" },
  { id: "coarse", label: "Coarse" },
  { id: "extra-coarse", label: "Extra Coarse" },
];
