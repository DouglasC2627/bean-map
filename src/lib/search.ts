import Fuse from "fuse.js";
import type { CoffeeBean, FlavorNotesData } from "@/types";
import { flavorNoteLabel } from "@/lib/utils";

/**
 * The projection of a bean that search actually needs — the fields Fuse
 * indexes plus the few the result row renders.
 *
 * `<SearchCommand>` lives in the root layout, so whatever it receives is
 * serialized into the RSC payload of *every* page. Passing full `CoffeeBean`
 * objects meant each page shipped all brewing recommendations, pour stages,
 * flavor profiles and descriptions it would never read. Note labels are
 * resolved here on the server so the whole `FlavorNotesData` tree doesn't have
 * to travel either.
 */
export interface SearchableBean {
  id: string;
  slug: string;
  name: string;
  country: string;
  countryCode: string;
  region: string;
  coordinates: [number, number];
  /** Stable English note ids, so "jasmine" matches in any locale. */
  noteIds: string[];
  /** Display labels in the active locale, e.g. "茉莉". */
  noteLabels: string[];
}

/** Build the slim, server-side search index handed to the search dialog. */
export function toSearchableBeans(
  beans: CoffeeBean[],
  flavorNotes?: FlavorNotesData,
): SearchableBean[] {
  return beans.map((b) => ({
    id: b.id,
    slug: b.slug,
    name: b.name,
    country: b.country,
    countryCode: b.countryCode,
    region: b.region,
    coordinates: b.coordinates,
    noteIds: b.flavorNotes,
    noteLabels: flavorNotes
      ? b.flavorNotes.map((id) => flavorNoteLabel(flavorNotes, id))
      : b.flavorNotes,
  }));
}

export function createBeanSearch(
  beans: SearchableBean[],
): Fuse<SearchableBean> {
  return new Fuse(beans, {
    keys: [
      { name: "name", weight: 0.4 },
      { name: "country", weight: 0.2 },
      { name: "region", weight: 0.15 },
      { name: "noteIds", weight: 0.1 },
      { name: "noteLabels", weight: 0.15 },
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
