"use client";

import { create } from "zustand";
import type {
  CoffeeBean,
  FlavorNotesData,
  ProcessingMethod,
  RoastLevel,
} from "@/types";

export interface ViewportState {
  longitude: number;
  latitude: number;
  zoom: number;
  bearing: number;
  pitch: number;
}

export interface FlavorRanges {
  acidity: [number, number];
  body: [number, number];
  sweetness: [number, number];
  bitterness: [number, number];
}

export interface FilterState {
  regions: string[]; // country codes or continent keys
  processingMethods: ProcessingMethod[];
  altitudeRange: [number, number];
  roastLevels: RoastLevel[];
  flavorRanges: FlavorRanges;
  /**
   * Selected flavor IDs from the Flavor Wheel. Each entry may reference a
   * category, subcategory, or specific note id. A bean matches if any of its
   * own note ids — or any of their parent subcategory/category ids — is
   * present in this list.
   */
  flavorNoteIds: string[];
}

export interface BeanMapState {
  // map
  viewport: ViewportState;
  setViewport: (v: Partial<ViewportState>) => void;

  // selection
  selectedBeanId: string | null;
  selectBean: (id: string | null) => void;
  clearSelection: () => void;

  // hover (region highlight)
  hoveredRegionId: string | null;
  setHoveredRegion: (id: string | null) => void;

  // filters
  filters: FilterState;
  setRegions: (r: string[]) => void;
  toggleProcessing: (p: ProcessingMethod) => void;
  toggleRoast: (r: RoastLevel) => void;
  setAltitudeRange: (range: [number, number]) => void;
  setFlavorRange: (axis: keyof FlavorRanges, range: [number, number]) => void;
  toggleFlavorNote: (id: string) => void;
  setFlavorNotes: (ids: string[]) => void;
  clearFlavorNotes: () => void;
  resetFilters: () => void;

  // comparison
  comparisonBeanIds: string[];
  addToComparison: (id: string) => void;
  removeFromComparison: (id: string) => void;
  isComparisonOpen: boolean;
  setComparisonOpen: (open: boolean) => void;

  // ui
  isBeanPanelOpen: boolean;
  setBeanPanelOpen: (open: boolean) => void;
  isFilterPanelOpen: boolean;
  setFilterPanelOpen: (open: boolean) => void;

  // flavor wheel overlay
  isFlavorWheelOpen: boolean;
  setFlavorWheelOpen: (open: boolean) => void;

  // events
  fitBoundsRequestId: number;
  requestFitBounds: () => void;
  flyToRequest: {
    id: number;
    coords: [number, number];
    zoom: number;
  } | null;
  requestFlyTo: (coords: [number, number], zoom?: number) => void;
  // In-page locate (Beans / Insights): scroll to and highlight a bean's
  // row/card on the current page rather than flying the map to it.
  locateRequest: { id: number; beanId: string } | null;
  requestLocate: (beanId: string) => void;
}

const DEFAULT_FILTERS: FilterState = {
  regions: [],
  processingMethods: [],
  altitudeRange: [0, 2500],
  roastLevels: [],
  flavorRanges: {
    acidity: [1, 10],
    body: [1, 10],
    sweetness: [1, 10],
    bitterness: [1, 10],
  },
  flavorNoteIds: [],
};

export const useBeanMap = create<BeanMapState>((set) => ({
  viewport: {
    longitude: 15,
    latitude: 5,
    zoom: 1.6,
    bearing: 0,
    pitch: 0,
  },
  setViewport: (v) =>
    set((s) => ({ viewport: { ...s.viewport, ...v } })),

  selectedBeanId: null,
  selectBean: (id) =>
    set({ selectedBeanId: id, isBeanPanelOpen: id !== null }),
  clearSelection: () =>
    set({ selectedBeanId: null, isBeanPanelOpen: false }),

  hoveredRegionId: null,
  setHoveredRegion: (id) => set({ hoveredRegionId: id }),

  filters: DEFAULT_FILTERS,
  setRegions: (regions) =>
    set((s) => ({ filters: { ...s.filters, regions } })),
  toggleProcessing: (p) =>
    set((s) => {
      const has = s.filters.processingMethods.includes(p);
      return {
        filters: {
          ...s.filters,
          processingMethods: has
            ? s.filters.processingMethods.filter((x) => x !== p)
            : [...s.filters.processingMethods, p],
        },
      };
    }),
  toggleRoast: (r) =>
    set((s) => {
      const has = s.filters.roastLevels.includes(r);
      return {
        filters: {
          ...s.filters,
          roastLevels: has
            ? s.filters.roastLevels.filter((x) => x !== r)
            : [...s.filters.roastLevels, r],
        },
      };
    }),
  setAltitudeRange: (range) =>
    set((s) => ({ filters: { ...s.filters, altitudeRange: range } })),
  setFlavorRange: (axis, range) =>
    set((s) => ({
      filters: {
        ...s.filters,
        flavorRanges: { ...s.filters.flavorRanges, [axis]: range },
      },
    })),
  toggleFlavorNote: (id) =>
    set((s) => {
      const has = s.filters.flavorNoteIds.includes(id);
      return {
        filters: {
          ...s.filters,
          flavorNoteIds: has
            ? s.filters.flavorNoteIds.filter((x) => x !== id)
            : [...s.filters.flavorNoteIds, id],
        },
      };
    }),
  setFlavorNotes: (ids) =>
    set((s) => ({ filters: { ...s.filters, flavorNoteIds: ids } })),
  clearFlavorNotes: () =>
    set((s) => ({ filters: { ...s.filters, flavorNoteIds: [] } })),
  resetFilters: () => set({ filters: DEFAULT_FILTERS }),

  comparisonBeanIds: [],
  addToComparison: (id) =>
    set((s) =>
      s.comparisonBeanIds.includes(id) || s.comparisonBeanIds.length >= 3
        ? s
        : { comparisonBeanIds: [...s.comparisonBeanIds, id] },
    ),
  removeFromComparison: (id) =>
    set((s) => ({
      comparisonBeanIds: s.comparisonBeanIds.filter((x) => x !== id),
    })),
  isComparisonOpen: false,
  setComparisonOpen: (open) => set({ isComparisonOpen: open }),

  isBeanPanelOpen: false,
  setBeanPanelOpen: (open) => set({ isBeanPanelOpen: open }),
  isFilterPanelOpen: false,
  setFilterPanelOpen: (open) => set({ isFilterPanelOpen: open }),

  isFlavorWheelOpen: false,
  // Opening the wheel closes the bean panel — they share the right edge and
  // would otherwise overlap.
  setFlavorWheelOpen: (open) =>
    set(
      open
        ? { isFlavorWheelOpen: true, selectedBeanId: null, isBeanPanelOpen: false }
        : { isFlavorWheelOpen: false },
    ),

  fitBoundsRequestId: 0,
  requestFitBounds: () =>
    set((s) => ({ fitBoundsRequestId: s.fitBoundsRequestId + 1 })),

  flyToRequest: null,
  requestFlyTo: (coords, zoom = 5) =>
    set((s) => ({
      flyToRequest: {
        id: (s.flyToRequest?.id ?? 0) + 1,
        coords,
        zoom,
      },
    })),

  locateRequest: null,
  requestLocate: (beanId) =>
    set((s) => ({
      locateRequest: { id: (s.locateRequest?.id ?? 0) + 1, beanId },
    })),
}));

/**
 * Build a Set of every ancestor id (subcategory + category) for each leaf note.
 * Used by `filterBeans` so that selecting a category from the wheel matches
 * beans tagged with any of its descendant note ids.
 */
function buildAncestorIndex(
  data: FlavorNotesData,
): Map<string, Set<string>> {
  const subToCat = new Map<string, string>();
  for (const s of data.subcategories) subToCat.set(s.id, s.categoryId);
  const index = new Map<string, Set<string>>();
  for (const n of data.notes) {
    const set = new Set<string>([n.id]);
    set.add(n.subcategoryId);
    const cat = subToCat.get(n.subcategoryId);
    if (cat) set.add(cat);
    index.set(n.id, set);
  }
  return index;
}

let ancestorIndexCache: {
  data: FlavorNotesData;
  index: Map<string, Set<string>>;
} | null = null;

function getAncestorIndex(data: FlavorNotesData): Map<string, Set<string>> {
  if (ancestorIndexCache && ancestorIndexCache.data === data) {
    return ancestorIndexCache.index;
  }
  const index = buildAncestorIndex(data);
  ancestorIndexCache = { data, index };
  return index;
}

export function filterBeans(
  beans: CoffeeBean[],
  filters: FilterState,
  flavorNotesData?: FlavorNotesData,
): CoffeeBean[] {
  const {
    regions,
    processingMethods,
    altitudeRange,
    roastLevels,
    flavorRanges,
    flavorNoteIds,
  } = filters;

  const ancestorIndex =
    flavorNoteIds.length > 0 && flavorNotesData
      ? getAncestorIndex(flavorNotesData)
      : null;
  const selectedSet =
    flavorNoteIds.length > 0 ? new Set(flavorNoteIds) : null;

  return beans.filter((b) => {
    if (regions.length && !regions.includes(b.countryCode)) return false;
    if (processingMethods.length && !processingMethods.includes(b.processing))
      return false;
    if (roastLevels.length && !roastLevels.includes(b.roastRecommendation))
      return false;

    const [minAlt, maxAlt] = altitudeRange;
    if (b.altitudeMasl[1] < minAlt || b.altitudeMasl[0] > maxAlt) return false;

    const fp = b.flavorProfile;
    if (fp.acidity < flavorRanges.acidity[0] || fp.acidity > flavorRanges.acidity[1])
      return false;
    if (fp.body < flavorRanges.body[0] || fp.body > flavorRanges.body[1])
      return false;
    if (
      fp.sweetness < flavorRanges.sweetness[0] ||
      fp.sweetness > flavorRanges.sweetness[1]
    )
      return false;
    if (
      fp.bitterness < flavorRanges.bitterness[0] ||
      fp.bitterness > flavorRanges.bitterness[1]
    )
      return false;

    if (selectedSet) {
      let matches = false;
      for (const noteId of b.flavorNotes) {
        if (selectedSet.has(noteId)) {
          matches = true;
          break;
        }
        if (ancestorIndex) {
          const ancestors = ancestorIndex.get(noteId);
          if (ancestors) {
            for (const a of ancestors) {
              if (selectedSet.has(a)) {
                matches = true;
                break;
              }
            }
          }
        }
        if (matches) break;
      }
      if (!matches) return false;
    }

    return true;
  });
}
