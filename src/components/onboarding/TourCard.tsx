"use client";

import { useLayoutEffect, useRef, useState, type Ref } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { AnchorRect } from "@/lib/use-anchor-rect";

/** Gap between the cutout and the card. */
const GAP = 16;
/** Minimum distance from any viewport edge. */
const MARGIN = 12;

interface Props {
  title: string;
  body: string;
  rect: AnchorRect | null;
  fallback: "center" | "bottom";
  isFirst: boolean;
  isLast: boolean;
  labels: {
    progress: string;
    start: string;
    back: string;
    next: string;
    skip: string;
    done: string;
  };
  onBack: () => void;
  onNext: () => void;
  onSkip: () => void;
  /**
   * Lets the tour focus the card on each step. React 19 passes `ref` as an
   * ordinary prop, so no `forwardRef` wrapper is needed.
   */
  ref?: Ref<HTMLDivElement>;
}

interface Position {
  top: number;
  left: number;
}

/**
 * Picks the side of the anchor with room for the card, preferring below, then
 * above, then right, then left; falls back to whichever has the most space.
 * Both axes are then clamped so the card never leaves the viewport.
 */
function place(
  rect: AnchorRect,
  card: { width: number; height: number },
  view: { width: number; height: number },
): Position {
  const space = {
    bottom: view.height - (rect.top + rect.height) - GAP,
    top: rect.top - GAP,
    right: view.width - (rect.left + rect.width) - GAP,
    left: rect.left - GAP,
  };

  const order = ["bottom", "top", "right", "left"] as const;
  const needed = (side: (typeof order)[number]) =>
    side === "bottom" || side === "top" ? card.height : card.width;

  const side =
    order.find((s) => space[s] >= needed(s)) ??
    order.reduce((best, s) => (space[s] > space[best] ? s : best), order[0]);

  /**
   * Keep an edge inside the viewport on BOTH axes. Only the cross axis used
   * to be clamped, so a card placed above a tall mobile bottom sheet got a
   * negative `top` and slid off the screen behind the nav, taking its Next
   * button with it. `Math.max(MARGIN, …)` wins over the upper bound on
   * purpose: if the card is taller than the space, pin its top and let it
   * scroll internally rather than pushing its head off-screen.
   */
  const fit = (v: number, size: number, extent: number) =>
    Math.max(MARGIN, Math.min(v, extent - size - MARGIN));

  const centeredLeft = fit(
    rect.left + rect.width / 2 - card.width / 2,
    card.width,
    view.width,
  );
  const centeredTop = fit(
    rect.top + rect.height / 2 - card.height / 2,
    card.height,
    view.height,
  );

  switch (side) {
    case "bottom":
      return {
        top: fit(rect.top + rect.height + GAP, card.height, view.height),
        left: centeredLeft,
      };
    case "top":
      return {
        top: fit(rect.top - GAP - card.height, card.height, view.height),
        left: centeredLeft,
      };
    case "right":
      return {
        top: centeredTop,
        left: fit(rect.left + rect.width + GAP, card.width, view.width),
      };
    case "left":
      return {
        top: centeredTop,
        left: fit(rect.left - GAP - card.width, card.width, view.width),
      };
  }
}

export function TourCard({
  title,
  body,
  rect,
  fallback,
  isFirst,
  isLast,
  labels,
  onBack,
  onNext,
  onSkip,
  ref,
}: Props) {
  const innerRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<Position | null>(null);

  // The card needs its own ref to measure itself *and* has to expose the node
  // to the tour for focus, so both are assigned from one callback ref.
  const setRefs = (node: HTMLDivElement | null) => {
    innerRef.current = node;
    if (typeof ref === "function") ref(node);
    else if (ref) ref.current = node;
  };

  // Measured rather than assumed: the card's height depends on how long the
  // translated copy wraps, and zh-TW wraps very differently from English.
  useLayoutEffect(() => {
    const el = innerRef.current;
    if (!el) return;
    const view = { width: window.innerWidth, height: window.innerHeight };
    const card = { width: el.offsetWidth, height: el.offsetHeight };

    if (!rect) {
      const top =
        fallback === "bottom"
          ? view.height - card.height - MARGIN * 3
          : view.height / 2 - card.height / 2;
      setPos({
        top: Math.max(MARGIN, Math.min(top, view.height - card.height - MARGIN)),
        left: Math.max(MARGIN, view.width / 2 - card.width / 2),
      });
      return;
    }
    setPos(place(rect, card, view));
  }, [rect, fallback, title, body]);

  return (
    <div
      ref={setRefs}
      role="dialog"
      aria-modal="true"
      aria-labelledby="tour-title"
      aria-describedby="tour-body"
      tabIndex={-1}
      className={cn(
        "tour-card pointer-events-auto fixed z-62 w-[min(21rem,calc(100vw-1.5rem))]",
        "max-h-[calc(100svh-1.5rem)] overflow-y-auto overscroll-contain",
        "rounded-lg border border-border bg-background/95 p-4 shadow-xl backdrop-blur",
        "focus-visible:outline-none",
        // Hidden until measured, so it never flashes at 0,0 on the first frame.
        pos ? "visible" : "invisible",
      )}
      style={{ top: pos?.top ?? 0, left: pos?.left ?? 0 }}
    >
      <h2 id="tour-title" className="font-display text-lg leading-tight">
        {title}
      </h2>
      <p
        id="tour-body"
        className="mt-2 text-sm leading-relaxed text-muted-foreground"
      >
        {body}
      </p>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <span
          aria-live="polite"
          className="font-mono text-xs whitespace-nowrap text-muted-foreground"
        >
          {labels.progress}
        </span>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onSkip}>
            {labels.skip}
          </Button>
          {!isFirst && (
            <Button variant="outline" size="sm" onClick={onBack}>
              {labels.back}
            </Button>
          )}
          <Button size="sm" onClick={onNext}>
            {isFirst ? labels.start : isLast ? labels.done : labels.next}
          </Button>
        </div>
      </div>
    </div>
  );
}
