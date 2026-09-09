"use client";

import { cn } from "@/lib/utils";
import type { AnchorRect } from "@/lib/use-anchor-rect";

/** Breathing room between the anchored control and the cutout edge. */
const PAD = 6;

interface Props {
  rect: AnchorRect | null;
  scrim: "full" | "soft";
}

/**
 * The dimming layer.
 *
 * With an anchor, the dim is produced by a huge `box-shadow` spread on a
 * transparent box sitting exactly over the control — so the control paints
 * through the hole at full brightness and everything else darkens, with no SVG
 * mask, no clip-path and no library. That is also why the layer can sit above
 * `TopNav` (z-40) and still leave the ⌘K button lit.
 *
 * Without an anchor it is a plain full-screen wash. `soft` is used for steps
 * whose subject is the map itself, where a full dim would hide the thing being
 * described.
 *
 * Always `pointer-events-none` — `OnboardingTour` renders a separate catcher
 * underneath, so clicks are swallowed uniformly whether or not there is a hole.
 */
export function Spotlight({ rect, scrim }: Props) {
  if (!rect) {
    return (
      <div
        aria-hidden
        className={cn(
          "tour-fade pointer-events-none fixed inset-0 z-61",
          scrim === "soft" ? "bg-espresso/25" : "bg-espresso/60",
        )}
      />
    );
  }

  return (
    <div
      aria-hidden
      className="tour-cutout pointer-events-none fixed z-61 rounded-lg ring-2 ring-roast-light"
      style={{
        top: rect.top - PAD,
        left: rect.left - PAD,
        width: rect.width + PAD * 2,
        height: rect.height + PAD * 2,
      }}
    />
  );
}
