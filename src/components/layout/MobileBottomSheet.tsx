"use client";

import {
  type ReactNode,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
} from "react";
import { useTranslations } from "next-intl";
import { animated, config, useSpring } from "@react-spring/web";
import { useDrag } from "@use-gesture/react";
import { cn } from "@/lib/utils";
import { usePrefersReducedMotion } from "@/lib/use-media-query";

type MobileBottomSheetProps = {
  open: boolean;
  onClose: () => void;
  /** Fractions of viewport height occupied by the sheet at each snap point. */
  snapPoints?: number[];
  /** Index into snapPoints to use when the sheet opens. Default: 1 (middle). */
  initialSnap?: number;
  label?: string;
  className?: string;
  /** Forwarded to the sheet's scrollable content area (e.g. for parallax). */
  scrollRef?: React.Ref<HTMLDivElement>;
  children: ReactNode;
};

const DEFAULT_SNAPS = [0.25, 0.5, 0.9];

/** Release speed (px/ms) above which a drag counts as a directional flick. */
const FLICK_VELOCITY = 0.5;

function getViewportHeight() {
  if (typeof window === "undefined") return 800;
  return window.innerHeight;
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

export function MobileBottomSheet({
  open,
  onClose,
  snapPoints = DEFAULT_SNAPS,
  initialSnap = 1,
  label,
  className,
  scrollRef,
  children,
}: MobileBottomSheetProps) {
  const t = useTranslations("common");
  const titleId = useId();
  const sheetRef = useRef<HTMLDivElement>(null);
  const reduceMotion = usePrefersReducedMotion();
  // `y` represents the visible portion of the sheet measured from the bottom of the
  // viewport, in pixels. When closed, y = 0 (entirely off-screen). When fully open
  // y = vh * topSnap.
  const [{ y }, api] = useSpring(() => ({ y: 0 }));

  // Snap positions in pixels (visible height at each snap point).
  const snapPositions = useMemo(() => {
    const vh = getViewportHeight();
    return snapPoints.map((s) => Math.round(vh * s));
  }, [snapPoints]);

  const openAt = useCallback(
    (snapIdx: number) => {
      const target = snapPositions[clamp(snapIdx, 0, snapPositions.length - 1)];
      api.start({
        y: target,
        immediate: reduceMotion,
        config: reduceMotion ? config.stiff : { tension: 320, friction: 32 },
      });
    },
    [api, snapPositions, reduceMotion],
  );

  const close = useCallback(() => {
    api.start({
      y: 0,
      immediate: reduceMotion,
      config: reduceMotion ? config.stiff : config.stiff,
      onRest: () => onClose(),
    });
  }, [api, onClose, reduceMotion]);

  // Drive open/close from the `open` prop.
  useEffect(() => {
    if (open) {
      openAt(initialSnap);
    } else {
      api.start({
        y: 0,
        immediate: reduceMotion,
        config: config.stiff,
      });
    }
  }, [open, initialSnap, openAt, api, reduceMotion]);

  // Recompute snap positions on resize.
  useEffect(() => {
    if (!open) return;
    const handle = () => openAt(initialSnap);
    window.addEventListener("resize", handle);
    return () => window.removeEventListener("resize", handle);
  }, [open, initialSnap, openAt]);

  // Escape to close.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close]);

  // Drag binding on the handle. Tracks the finger 1:1 while dragging, then snaps
  // to the nearest point (or the next point in a flick's direction) on release.
  const bind = useDrag(
    ({
      first,
      last,
      velocity: [, vy],
      direction: [, dy],
      movement: [, my],
      memo,
    }) => {
      const highest = snapPositions[snapPositions.length - 1];
      const lowest = snapPositions[0];
      // Capture the resting position once at drag start so `movement` (which is
      // cumulative from the start) maps directly onto the sheet height. Reading
      // the live spring value every frame would re-apply the movement against an
      // already-updated position and make the sheet jump.
      const startY: number = first ? y.get() : memo;
      // `movement` is positive when dragging downward; our `y` axis (visible
      // height) shrinks as the sheet is pulled down, hence the subtraction.
      const next = clamp(startY - my, 0, highest);

      if (!last) {
        api.start({ y: next, immediate: true });
        return startY;
      }

      // Released — decide where to land.
      const flickDown = vy > FLICK_VELOCITY && dy > 0;
      const flickUp = vy > FLICK_VELOCITY && dy < 0;

      // Close when dropped below the midpoint to the lowest snap, or flicked
      // down from near the bottom.
      if (next < lowest / 2 || (flickDown && next <= lowest * 1.1)) {
        close();
        return startY;
      }

      // Nearest snap point to where the finger let go.
      let nearestIdx = 0;
      let bestDist = Infinity;
      snapPositions.forEach((s, i) => {
        const d = Math.abs(s - next);
        if (d < bestDist) {
          bestDist = d;
          nearestIdx = i;
        }
      });

      // A flick nudges one step in its direction; otherwise stay on the nearest.
      let targetIdx = nearestIdx;
      if (flickUp) targetIdx = Math.min(nearestIdx + 1, snapPositions.length - 1);
      else if (flickDown) targetIdx = Math.max(nearestIdx - 1, 0);

      api.start({
        y: snapPositions[targetIdx],
        immediate: reduceMotion,
        config: reduceMotion ? config.stiff : { tension: 320, friction: 32 },
      });
      return startY;
    },
    {
      axis: "y",
      pointer: { touch: true },
      filterTaps: true,
    },
  );

  if (!open && y.get() === 0) {
    return null;
  }

  const topSnap = snapPositions[snapPositions.length - 1] || 1;

  return (
    <>
      {/* Backdrop */}
      <animated.div
        aria-hidden
        onClick={close}
        className="fixed inset-0 z-20 bg-espresso/40"
        style={{
          opacity: y.to((v) => clamp(v / topSnap, 0, 1) * 0.6),
          pointerEvents: y.to((v) => (v > 4 ? "auto" : "none")),
        }}
      />
      <animated.div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={cn(
          "fixed bottom-0 left-0 right-0 z-30 flex flex-col rounded-t-2xl border-t border-border bg-background/95 shadow-2xl backdrop-blur-sm",
          className,
        )}
        style={{
          height: y.to((v) => `${Math.max(0, v)}px`),
          touchAction: "none",
        }}
      >
        <div
          {...bind()}
          className="flex shrink-0 cursor-grab touch-none items-center justify-center pt-4 pb-3 active:cursor-grabbing"
          aria-label={t("dragToResize")}
          role="separator"
        >
          <div className="h-1 w-10 rounded-full bg-tan/80" />
        </div>
        <span id={titleId} className="sr-only">
          {label ?? t("bottomSheet")}
        </span>
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto overscroll-contain"
        >
          {children}
        </div>
      </animated.div>
    </>
  );
}
