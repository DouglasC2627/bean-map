"use client";

import { useEffect, useRef } from "react";
import { useBeanMap } from "@/store";
import { usePrefersReducedMotion } from "@/lib/use-media-query";

/**
 * Listens for `locateRequest` (raised by the search command on the Beans and
 * Insights pages) and scrolls the matching bean's row/card into view, briefly
 * highlighting it. Targets are any element carrying `data-bean-id="<id>"`.
 *
 * Content may still be mounting (e.g. after a view switch), so we retry a few
 * times before giving up — when the bean is hidden by active filters there is
 * simply nothing to scroll to.
 */
export function useLocateBeanOnPage() {
  const locateRequest = useBeanMap((s) => s.locateRequest);
  const lastHandled = useRef(0);
  // An explicit `behavior` option beats the CSS `scroll-behavior: auto` that
  // the reduced-motion rule in globals.css sets, so this one has to opt out
  // in JS (same as the map's scroll cue).
  const reduceMotion = usePrefersReducedMotion();

  useEffect(() => {
    if (!locateRequest || locateRequest.id === lastHandled.current) return;
    lastHandled.current = locateRequest.id;

    const selector = `[data-bean-id="${CSS.escape(locateRequest.beanId)}"]`;

    const reveal = (el: HTMLElement) => {
      el.scrollIntoView({
        behavior: reduceMotion ? "auto" : "smooth",
        block: "center",
      });
      // Restart the highlight animation if it's already mid-flight.
      el.classList.remove("bean-locate-highlight");
      void el.offsetWidth;
      el.classList.add("bean-locate-highlight");
      el.addEventListener(
        "animationend",
        () => el.classList.remove("bean-locate-highlight"),
        { once: true },
      );
    };

    const first = document.querySelector<HTMLElement>(selector);
    if (first) {
      reveal(first);
      return;
    }

    let attempts = 0;
    const interval = window.setInterval(() => {
      attempts += 1;
      const el = document.querySelector<HTMLElement>(selector);
      if (el || attempts > 10) {
        window.clearInterval(interval);
        if (el) reveal(el);
      }
    }, 80);
    return () => window.clearInterval(interval);
  }, [locateRequest, reduceMotion]);
}
