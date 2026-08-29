import { getBeans, getBrewingMethods, getFlavorNotes } from "@/lib/data";
import { getArticleSlugs } from "@/lib/mdx";

/**
 * How big the catalog actually is, counted from the data itself.
 *
 * These numbers are interpolated into page copy, meta descriptions, and JSON-LD
 * ("55 coffee origins from 41 countries"), so counting them here means a new
 * bean or Learn article updates the marketing copy and the search snippet at
 * the same time — a hard-coded "55" in a translation string would silently rot,
 * and `validate-data` can't catch prose.
 *
 * Every field is locale-independent: translations are id-keyed overlays onto
 * the same English records, so the default locale is enough to count.
 *
 * Server-only — `getArticleSlugs` reads the filesystem.
 *
 * Field names are deliberately the ICU placeholder names used in the message
 * catalogs, so the whole object can be handed to `t()` as its values:
 * `t("description", getCatalogStats())`.
 */
export interface CatalogStats {
  /** Lets the whole object be passed straight to next-intl's `t(key, values)`. */
  [key: string]: number;
  beans: number;
  countries: number;
  methods: number;
  categories: number;
  subcategories: number;
  notes: number;
  articles: number;
}

let cached: CatalogStats | null = null;

export function getCatalogStats(): CatalogStats {
  if (cached) return cached;

  const beans = getBeans();
  const flavorNotes = getFlavorNotes();

  cached = {
    beans: beans.length,
    countries: new Set(beans.map((b) => b.countryCode)).size,
    methods: getBrewingMethods().length,
    categories: flavorNotes.categories.length,
    subcategories: flavorNotes.subcategories.length,
    notes: flavorNotes.notes.length,
    articles:
      getArticleSlugs("processing").length + getArticleSlugs("brewing").length,
  };
  return cached;
}
