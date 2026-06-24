import Fuse from "fuse.js";
import type { CoffeeBean, FlavorNotesData } from "@/types";
import { flavorNoteLabel } from "@/lib/utils";

/**
 * A bean augmented with its resolved (and possibly localized) flavor-note
 * labels, so search matches both the stable English note ids ("jasmine") and
 * the display labels in the active locale ("茉莉").
 */
export interface SearchableBean extends CoffeeBean {
  flavorNoteLabels: string[];
}

export function createBeanSearch(
  beans: CoffeeBean[],
  flavorNotes?: FlavorNotesData,
): Fuse<SearchableBean> {
  const list: SearchableBean[] = beans.map((b) => ({
    ...b,
    flavorNoteLabels: flavorNotes
      ? b.flavorNotes.map((id) => flavorNoteLabel(flavorNotes, id))
      : b.flavorNotes,
  }));
  return new Fuse(list, {
    keys: [
      { name: "name", weight: 0.4 },
      { name: "country", weight: 0.2 },
      { name: "region", weight: 0.15 },
      { name: "flavorNotes", weight: 0.1 },
      { name: "flavorNoteLabels", weight: 0.15 },
    ],
    threshold: 0.3,
    ignoreLocation: true,
    includeScore: true,
  });
}

export const RECENT_SEARCH_KEY = "beanmap.recent-bean-searches";

export function getRecentSearches(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(RECENT_SEARCH_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((x): x is string => typeof x === "string").slice(0, 5)
      : [];
  } catch {
    return [];
  }
}

export function pushRecentSearch(beanId: string) {
  if (typeof window === "undefined") return;
  const current = getRecentSearches().filter((id) => id !== beanId);
  current.unshift(beanId);
  localStorage.setItem(
    RECENT_SEARCH_KEY,
    JSON.stringify(current.slice(0, 5)),
  );
}

export function removeRecentSearch(beanId: string) {
  if (typeof window === "undefined") return;
  const current = getRecentSearches().filter((id) => id !== beanId);
  localStorage.setItem(RECENT_SEARCH_KEY, JSON.stringify(current));
}

export function clearAllRecentSearches() {
  if (typeof window === "undefined") return;
  localStorage.setItem(RECENT_SEARCH_KEY, JSON.stringify([]));
}
