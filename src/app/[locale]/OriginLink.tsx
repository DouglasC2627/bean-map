"use client";

import type { MouseEvent, ReactNode } from "react";
import { Link } from "@/i18n/navigation";
import { useBeanMap } from "@/store";
import { usePrefersReducedMotion } from "@/lib/use-media-query";

interface Props {
  countryCode: string;
  /** Coordinates of the country's beans — what the camera fits to. */
  points: [number, number][];
  className?: string;
  children: ReactNode;
}

/**
 * A country chip in the home page intro.
 */
export function OriginLink({
  countryCode,
  points,
  className,
  children,
}: Props) {
  const reduceMotion = usePrefersReducedMotion();

  const onClick = (e: MouseEvent<HTMLAnchorElement>) => {
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) {
      return;
    }
    e.preventDefault();

    useBeanMap.getState().setRegions([countryCode]);
    const fly = () => useBeanMap.getState().requestFitBounds(points);

    // Focus the top of <main> so the next Tab reaches the map's bean list —
    // now showing just this country — rather than the chip below the fold.
    document.getElementById("main-content")?.focus({ preventScroll: true });

    if (reduceMotion || window.scrollY === 0) {
      window.scrollTo({ top: 0, behavior: "instant" });
      fly();
      return;
    }

    // Hold the flight until the smooth scroll has brought the map back into
    // view; started now, it would play out above the fold. The timeout covers
    // browsers without `scrollend` (older Safari).
    let timer = 0;
    const onScrollEnd = () => {
      window.clearTimeout(timer);
      window.removeEventListener("scrollend", onScrollEnd);
      fly();
    };
    window.addEventListener("scrollend", onScrollEnd);
    timer = window.setTimeout(onScrollEnd, 1000);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <Link
      href={{ pathname: "/", query: { region: countryCode } }}
      onClick={onClick}
      className={className}
    >
      {children}
    </Link>
  );
}
