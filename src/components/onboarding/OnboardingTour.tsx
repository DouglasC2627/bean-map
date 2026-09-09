"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import { useTranslations } from "next-intl";
import type { CoffeeBean } from "@/types";
import { useBeanMap, type FilterState, type ViewportState } from "@/store";
import { markOnboardingSeen, useOnboarding } from "@/store/onboarding";
import { pickDemoBean, stepsFor } from "@/lib/onboarding-steps";
import { useAnchorRect } from "@/lib/use-anchor-rect";
import { useMediaQuery } from "@/lib/use-media-query";
import { Spotlight } from "./Spotlight";
import { TourCard } from "./TourCard";

interface Props {
  beans: CoffeeBean[];
}

/** Everything the tour disturbs, so it can be put back exactly. */
interface Snapshot {
  filters: FilterState;
  selectedBeanId: string | null;
  viewport: ViewportState;
  isBeanPanelOpen: boolean;
  isFilterPanelOpen: boolean;
  isFlavorWheelOpen: boolean;
}

export function OnboardingTour({ beans }: Props) {
  const t = useTranslations("onboarding");
  const step = useOnboarding((s) => s.step);
  const setStep = useOnboarding((s) => s.setStep);
  const close = useOnboarding((s) => s.close);

  // Same breakpoint BeanPanel uses to choose between the side panel and the
  // draggable bottom sheet, so the tour and the UI agree on "mobile".
  const isMobile = useMediaQuery("(max-width: 639px)");

  const steps = useMemo(() => stepsFor(isMobile), [isMobile]);
  const demoBean = useMemo(() => pickDemoBean(beans), [beans]);

  /**
   * Counts for the welcome copy's ICU placeholders. Counted from the catalog
   * rather than typed into the translations, per the project norm — but
   * counted here rather than via `getCatalogStats()`, which is server-only
   * (it reads the Learn articles off disk).
   */
  const stats = useMemo(
    () => ({
      beans: beans.length,
      countries: new Set(beans.map((b) => b.countryCode)).size,
    }),
    [beans],
  );

  // Clamp rather than assume: rotating a phone to landscape swaps the step
  // list underneath a visitor who is already several steps in.
  const index = Math.min(step, steps.length - 1);
  const current = steps[index];
  const rect = useAnchorRect(current.anchor, true);

  /**
   * Snapshot on mount, restore on unmount.
   *
   * Deliberately not `resetFilters()`: someone replaying the tour from the
   * footer may already have filters set, and wiping them would destroy their
   * work. Restoring the store also restores the URL, because `UrlStateSync`
   * mirrors selection, filters and viewport into the query string.
   */
  const snapshot = useRef<Snapshot | null>(null);
  useEffect(() => {
    const s = useBeanMap.getState();
    snapshot.current = {
      filters: s.filters,
      selectedBeanId: s.selectedBeanId,
      viewport: s.viewport,
      isBeanPanelOpen: s.isBeanPanelOpen,
      isFilterPanelOpen: s.isFilterPanelOpen,
      isFlavorWheelOpen: s.isFlavorWheelOpen,
    };

    return () => {
      const snap = snapshot.current;
      if (!snap) return;
      // `setState` rather than the actions: `selectBean` and
      // `setFlavorWheelOpen` each mutate panel flags as a side effect, so
      // replaying them in any order cannot reproduce an arbitrary prior state.
      useBeanMap.setState({
        filters: snap.filters,
        selectedBeanId: snap.selectedBeanId,
        isBeanPanelOpen: snap.isBeanPanelOpen,
        isFilterPanelOpen: snap.isFilterPanelOpen,
        isFlavorWheelOpen: snap.isFlavorWheelOpen,
      });
      // The store's `viewport` only mirrors the camera; Mapbox owns it. Ask
      // for the flight explicitly or the map stays wherever the tour left it.
      useBeanMap
        .getState()
        .requestFlyTo(
          [snap.viewport.longitude, snap.viewport.latitude],
          snap.viewport.zoom,
        );
    };
  }, []);

  // Drive the real UI into the state this step describes.
  useEffect(() => {
    current.onEnter?.({ demoBean });
  }, [current, demoBean]);

  const finish = useCallback(() => {
    markOnboardingSeen();
    close();
  }, [close]);

  const next = useCallback(() => {
    if (index >= steps.length - 1) finish();
    else setStep(index + 1);
  }, [index, steps.length, finish, setStep]);

  const back = useCallback(() => {
    if (index > 0) setStep(index - 1);
  }, [index, setStep]);

  /**
   * Focus management: focus the card on every step so a screen reader
   * announces the new content, trap Tab inside it, and hand focus back to
   * whatever had it when the tour started.
   */
  const cardRef = useRef<HTMLDivElement>(null);
  const returnFocusTo = useRef<HTMLElement | null>(null);

  useEffect(() => {
    returnFocusTo.current = document.activeElement as HTMLElement | null;
    return () => returnFocusTo.current?.focus?.();
  }, []);

  useEffect(() => {
    cardRef.current?.focus();
  }, [index]);

  // Esc skips, arrows navigate, Tab is trapped. Capture phase so the tour wins
  // over the Escape handlers in TopNav's menu and MobileBottomSheet, which are
  // mounted underneath during some steps.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        finish();
        return;
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        next();
        return;
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        back();
        return;
      }
      if (e.key !== "Tab") return;

      const root = cardRef.current;
      if (!root) return;
      const focusable = root.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      // Also covers the case where focus is still on the card itself.
      if (e.shiftKey && document.activeElement !== last) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [finish, next, back]);

  // Mobile folds the globe-gesture copy into the origin step (see stepsFor).
  const bodyKey =
    isMobile && current.id === "origin"
      ? "steps.origin.bodyMobile"
      : `steps.${current.id}.body`;

  return (
    <>
      {/*
        Transparent catcher below the scrim. The tour operates the UI itself,
        so letting clicks reach the app underneath would desync the two.
      */}
      <div aria-hidden className="fixed inset-0 z-60" />
      <Spotlight rect={rect} scrim={current.scrim} />
      <TourCard
        ref={cardRef}
        title={t(`steps.${current.id}.title`)}
        // Only the welcome step interpolates counts; next-intl ignores values
        // a message doesn't reference, so this needs no branching.
        body={t(bodyKey, stats)}
        rect={rect}
        fallback={current.fallback}
        isFirst={index === 0}
        isLast={index === steps.length - 1}
        labels={{
          progress: t("progress", {
            current: index + 1,
            total: steps.length,
          }),
          start: t("start"),
          back: t("back"),
          next: t("next"),
          skip: t("skip"),
          done: t("done"),
        }}
        onBack={back}
        onNext={next}
        onSkip={finish}
      />
    </>
  );
}
