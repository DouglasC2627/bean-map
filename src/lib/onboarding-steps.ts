"use client";

import { useBeanMap } from "@/store";
import type { CoffeeBean } from "@/types";

/**
 * `data-tour` attribute values. Every anchor is an element that already exists
 * in the app — the tour adds no chrome of its own to the page it describes.
 */
export type TourAnchor =
  | "bean-panel"
  | "filters-panel"
  | "flavor-wheel"
  | "search";

export interface TourStep {
  /**
   * Message key under the `onboarding.steps.*` namespace. Also the step's
   * stable id for tests.
   */
  id: string;
  /**
   * Element to cut out of the scrim, or `null` for a step about the map as a
   * whole (there is nothing useful to spotlight when the subject fills the
   * screen).
   */
  anchor: TourAnchor | null;
  /**
   * How dark the page goes. `soft` is for anchorless steps whose subject *is*
   * the map — dimming it to `full` would hide the thing being described.
   */
  scrim: "full" | "soft";
  /** Where an anchorless card sits. */
  fallback: "center" | "bottom";
  /**
   * Drives the real UI into the state the copy describes. Runs on entering the
   * step, forwards or backwards, so it must be idempotent and must fully
   * specify the state it wants rather than toggling.
   */
  onEnter?: (ctx: TourContext) => void;
}

export interface TourContext {
  /** The origin used for the "click a marker" demonstration. */
  demoBean: CoffeeBean | null;
}

/** Collapse every panel the tour opens, without touching filters. */
function closeAllPanels() {
  const s = useBeanMap.getState();
  s.setFlavorWheelOpen(false);
  s.setFilterPanelOpen(false);
  s.setBeanPanelOpen(false);
}

export const TOUR_STEPS: TourStep[] = [
  {
    id: "welcome",
    anchor: null,
    scrim: "full",
    fallback: "center",
    onEnter: () => closeAllPanels(),
  },
  {
    id: "globe",
    anchor: null,
    scrim: "soft",
    fallback: "bottom",
    onEnter: () => {
      closeAllPanels();
      useBeanMap.getState().clearSelection();
      // Frames the whole catalog, so the clusters and the Bean Belt band the
      // copy talks about are actually on screen.
      useBeanMap.getState().requestFitBounds();
    },
  },
  {
    id: "origin",
    anchor: "bean-panel",
    scrim: "full",
    fallback: "center",
    onEnter: ({ demoBean }) => {
      const s = useBeanMap.getState();
      s.setFlavorWheelOpen(false);
      s.setFilterPanelOpen(false);
      if (!demoBean) return;
      s.requestFlyTo(demoBean.coordinates, 5);
      s.selectBean(demoBean.id);
    },
  },
  {
    id: "filters",
    anchor: "filters-panel",
    scrim: "full",
    fallback: "center",
    onEnter: () => {
      const s = useBeanMap.getState();
      s.setFlavorWheelOpen(false);
      s.clearSelection();
      s.setFilterPanelOpen(true);
      // Pull back out to the whole catalog. The previous step flew in to a
      // single origin, and "origins that stop matching fade" is invisible at
      // that zoom — there is only one marker on screen.
      s.requestFitBounds();
    },
  },
  {
    id: "flavorWheel",
    anchor: "flavor-wheel",
    scrim: "full",
    fallback: "center",
    onEnter: () => {
      const s = useBeanMap.getState();
      s.setFilterPanelOpen(false);
      // Clears the selection and closes the bean panel as a side effect — the
      // wheel and the panel share the right edge (see src/store/index.ts).
      s.setFlavorWheelOpen(true);
    },
  },
  {
    id: "search",
    anchor: "search",
    scrim: "full",
    fallback: "center",
    // Deliberately does NOT open the search dialog: it would take focus and
    // cover the tour card. The button is spotlit; pressing ⌘K is left to the
    // visitor once the tour is done.
    onEnter: () => closeAllPanels(),
  },
];

/**
 * Mobile drops the globe-gesture step (its copy folds into `origin.bodyMobile`)
 * and the ⌘K step, which is meaningless without a keyboard. Four cards is
 * about as much as a phone screen earns before the tour starts feeling like
 * homework.
 */
const MOBILE_STEP_IDS = new Set(["welcome", "origin", "filters", "flavorWheel"]);

export function stepsFor(isMobile: boolean): TourStep[] {
  return isMobile
    ? TOUR_STEPS.filter((s) => MOBILE_STEP_IDS.has(s.id))
    : TOUR_STEPS;
}

/**
 * The origin the tour flies to. Looked up by slug rather than index so that
 * reordering or renaming beans degrades to "some other origin" instead of
 * breaking the step.
 */
export function pickDemoBean(beans: CoffeeBean[]): CoffeeBean | null {
  return (
    beans.find((b) => b.slug === "ethiopian-yirgacheffe") ?? beans[0] ?? null
  );
}

