/**
 * Coffee-producing countries in the catalog, grouped into the regions the UI
 * offers as a filter.
 *
 * Country codes, not names: the display name comes from the localized bean
 * records (`bean.country`), so this file never needs translating.
 *
 * Ordering inside each group is roughly by how much coffee the country sends
 * to specialty buyers, which is close enough to "what a reader is looking for
 * first" and keeps Ethiopia and Colombia at the top of their lists.
 */
export interface OriginRegion {
  /** Message key under `filters.regions.*`. */
  key: string;
  countries: readonly string[];
}

export const ORIGIN_REGIONS: readonly OriginRegion[] = [
  {
    key: "africa",
    countries: ["ET", "KE", "RW", "BI", "TZ", "UG", "CD", "MW", "ZM", "ZW"],
  },
  {
    key: "central-america",
    countries: ["GT", "CR", "HN", "SV", "NI", "PA", "MX"],
  },
  { key: "south-america", countries: ["CO", "BR", "PE", "EC", "BO", "VE"] },
  {
    key: "asia-pacific",
    countries: [
      "ID",
      "YE",
      "IN",
      "VN",
      "PG",
      "TL",
      "TH",
      "MM",
      "LA",
      "CN",
      "PH",
      "NP",
    ],
  },
  { key: "islands", countries: ["JM", "DO", "CU", "HT", "PR", "US"] },
];
