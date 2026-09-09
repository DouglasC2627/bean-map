"use client";

import { useEffect, useRef, useState } from "react";

export interface AnchorRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

function sameRect(a: AnchorRect | null, b: AnchorRect | null): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  return (
    Math.abs(a.top - b.top) < 0.5 &&
    Math.abs(a.left - b.left) < 0.5 &&
    Math.abs(a.width - b.width) < 0.5 &&
    Math.abs(a.height - b.height) < 0.5
  );
}

/**
 * Tracks the viewport rect of `[data-tour="<anchor>"]` while the tour is open.
 *
 * Polls on `requestAnimationFrame` rather than using a `ResizeObserver`, which
 * sounds heavier than it is and is the only thing that actually works here:
 *
 * - The filter panel and bean panel arrive via CSS `transform` transitions and
 *   Framer springs. A ResizeObserver never fires for a transform — the box
 *   doesn't change size, only where it is painted — so the cutout would sit on
 *   the panel's final position while the panel was still sliding.
 * - `FlavorWheelOverlay` returns `null` until opened and `BeanPanel` unmounts
 *   with no selection, so the element frequently does not exist yet when the
 *   step is entered. Polling picks it up on the frame it mounts.
 *
 * The work per frame is one `querySelector`, one `getBoundingClientRect` and
 * four float compares, and React state is only written when the rect actually
 * moves — so this settles to a no-op as soon as the animation finishes.
 */
export function useAnchorRect(
  anchor: string | null,
  active: boolean,
): AnchorRect | null {
  const [rect, setRect] = useState<AnchorRect | null>(null);
  // Mirrors what is actually committed to state, and survives the effect
  // re-running when `anchor` changes — a local would reset to null and make
  // the first comparison against a null `next` a false match, stranding the
  // previous step's rect on screen.
  const committed = useRef<AnchorRect | null>(null);

  useEffect(() => {
    if (!active) return;

    let frame = 0;

    const tick = () => {
      // `querySelectorAll`, not `querySelector`: several anchors are declared
      // twice and swapped by breakpoint — the desktop search pill vs the
      // mobile icon, the bean side panel vs the bottom sheet. Only one is ever
      // laid out, so the first with a real box is the one on screen. A present
      // but zero-size match (hidden at this breakpoint, or a panel that has
      // not started its transition) is treated as absent, and the card falls
      // back to centred rather than pointing at nothing.
      let next: AnchorRect | null = null;

      // An anchorless step measures nothing and clears the cutout on the next
      // frame, which is also why this runs inside the loop rather than as an
      // eager `setRect(null)` in the effect body.
      if (anchor) {
        const candidates = document.querySelectorAll<HTMLElement>(
          `[data-tour="${anchor}"]`,
        );
        for (const el of candidates) {
          const r = el.getBoundingClientRect();
          if (r.width > 1 && r.height > 1) {
            next = {
              top: r.top,
              left: r.left,
              width: r.width,
              height: r.height,
            };
            break;
          }
        }
      }

      if (!sameRect(committed.current, next)) {
        committed.current = next;
        setRect(next);
      }
      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [anchor, active]);

  return rect;
}
