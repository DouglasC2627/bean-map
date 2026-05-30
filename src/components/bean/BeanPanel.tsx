"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";
import { X } from "lucide-react";
import type {
  CoffeeBean,
  BrewingMethod,
  BrewRecommendation,
  FlavorNotesData,
} from "@/types";
import { useBeanMap } from "@/store";
import {
  cn,
  countryFlagEmoji,
  formatAltitude,
  monthName,
  flavorNoteLabel,
} from "@/lib/utils";
import { findSimilarBeans } from "@/lib/similar";
import { useMediaQuery } from "@/lib/use-media-query";
import { fadeUpItem, springSoft, staggerContainer } from "@/lib/motion";
import { BrewCard } from "@/components/brewing/BrewCard";
import { BrewDetailModal } from "@/components/brewing/BrewDetailModal";
import { FlavorRadar } from "@/components/visualization/FlavorRadar";
import { CompareToggle } from "@/components/compare/CompareToggle";
import { MobileBottomSheet } from "@/components/layout/MobileBottomSheet";

interface Props {
  beans: CoffeeBean[];
  methods: BrewingMethod[];
  flavorNotes: FlavorNotesData;
}

export function BeanPanel({ beans, methods, flavorNotes }: Props) {
  const { selectedBeanId, clearSelection, selectBean, requestFlyTo } =
    useBeanMap();
  const bean = beans.find((b) => b.id === selectedBeanId);
  const methodById = useMemo(
    () => new Map(methods.map((m) => [m.id, m])),
    [methods],
  );
  const isOpen = Boolean(bean);
  const isMobile = useMediaQuery("(max-width: 639px)");

  // Scroll containers, one per surface, drive the hero parallax.
  const asideRef = useRef<HTMLElement>(null);
  const sheetScrollRef = useRef<HTMLDivElement>(null);

  const [openRec, setOpenRec] = useState<BrewRecommendation | null>(null);

  const sortedRecs = useMemo(
    () =>
      bean
        ? [...bean.brewingRecommendations].sort(
            (a, b) => b.affinity - a.affinity,
          )
        : [],
    [bean],
  );

  const similar = useMemo(
    () => (bean ? findSimilarBeans(bean, beans, 3) : []),
    [bean, beans],
  );

  const renderContent = (scrollRef: React.RefObject<HTMLElement | null>) =>
    bean ? (
      <BeanPanelContent
        bean={bean}
        methodById={methodById}
        flavorNotes={flavorNotes}
        sortedRecs={sortedRecs}
        similar={similar}
        scrollRef={scrollRef}
        onSelectBean={(id, coords) => {
          selectBean(id);
          requestFlyTo(coords, 5);
        }}
        onOpenRec={setOpenRec}
        onClose={clearSelection}
      />
    ) : null;

  return (
    <>
      {/* Desktop side panel (sm and up) — slides in from the right. */}
      <AnimatePresence>
        {isOpen && (
          <motion.aside
            key="bean-panel"
            ref={asideRef}
            aria-label={bean ? `Profile of ${bean.name}` : "Bean profile"}
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={springSoft}
            className={cn(
              "fixed z-30 hidden overflow-x-hidden overflow-y-auto bg-background/95 shadow-xl backdrop-blur-sm sm:block",
              "sm:top-14 sm:right-0 sm:bottom-0 sm:left-auto sm:w-[50vw] sm:max-w-none sm:rounded-none sm:border-l lg:w-105",
            )}
          >
            {renderContent(asideRef)}
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Mobile bottom sheet — draggable, gesture-driven, with snap points. */}
      <MobileBottomSheet
        open={isMobile && isOpen}
        onClose={clearSelection}
        snapPoints={[0.3, 0.6, 0.92]}
        initialSnap={1}
        scrollRef={sheetScrollRef}
        label={bean ? `Profile of ${bean.name}` : "Bean profile"}
      >
        {renderContent(sheetScrollRef)}
      </MobileBottomSheet>

      {bean && openRec && (
        <BrewDetailModal
          open={Boolean(openRec)}
          onOpenChange={(o) => !o && setOpenRec(null)}
          bean={bean}
          recommendation={openRec}
          method={methodById.get(openRec.methodId)}
        />
      )}
    </>
  );
}

/**
 * Decorative coffee-toned banner behind the bean name. With no photography in
 * the dataset, this stands in as the panel's "hero"; the inner layer lags the
 * scroll for a subtle parallax. Static when reduced motion is requested.
 */
function ParallaxHero({
  bean,
  scrollRef,
}: {
  bean: CoffeeBean;
  scrollRef: React.RefObject<HTMLElement | null>;
}) {
  const reduce = useReducedMotion();
  const { scrollY } = useScroll({ container: scrollRef });
  const y = useTransform(scrollY, [0, 180], [0, 36]);
  const scale = useTransform(scrollY, [0, 180], [1, 1.12]);

  return (
    <div className="relative h-20 overflow-hidden">
      <motion.div
        aria-hidden
        style={reduce ? undefined : { y, scale }}
        className="absolute -inset-x-2 -top-6 -bottom-6 bg-linear-to-br from-roast-medium/25 via-parchment to-tan/40 dark:from-roast-dark dark:via-espresso dark:to-roast-dark"
      >
        <span className="absolute -bottom-4 right-1 select-none text-[5.5rem] leading-none opacity-20">
          {countryFlagEmoji(bean.countryCode)}
        </span>
      </motion.div>
    </div>
  );
}

interface ContentProps {
  bean: CoffeeBean;
  methodById: Map<string, BrewingMethod>;
  flavorNotes: FlavorNotesData;
  sortedRecs: BrewRecommendation[];
  similar: CoffeeBean[];
  scrollRef: React.RefObject<HTMLElement | null>;
  onSelectBean: (id: string, coords: [number, number]) => void;
  onOpenRec: (rec: BrewRecommendation) => void;
  onClose: () => void;
}

function BeanPanelContent({
  bean,
  methodById,
  flavorNotes,
  sortedRecs,
  similar,
  scrollRef,
  onSelectBean,
  onOpenRec,
  onClose,
}: ContentProps) {
  return (
    <motion.div
      // Re-key on bean so children re-stagger when switching between beans.
      key={bean.id}
      variants={staggerContainer}
      initial="hidden"
      animate="show"
    >
      <motion.div
        variants={fadeUpItem}
        className="relative border-b border-border"
      >
        <ParallaxHero bean={bean} scrollRef={scrollRef} />
        <button
          type="button"
          onClick={onClose}
          aria-label="Close panel"
          className="absolute right-3 top-3 rounded-md bg-background/70 p-1 text-muted-foreground backdrop-blur-sm hover:bg-parchment hover:text-foreground dark:hover:bg-roast-dark"
        >
          <X className="h-5 w-5" />
        </button>
        <div className="px-5 pb-5">
          <div className="mb-1 flex items-center gap-2 text-sm text-muted-foreground">
            <span aria-hidden className="text-lg leading-none">
              {countryFlagEmoji(bean.countryCode)}
            </span>
            <span>{bean.country}</span>
          </div>
          <h2 className="font-display text-2xl leading-tight">{bean.name}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {bean.region} · {formatAltitude(bean.altitudeMasl)}
          </p>
        </div>
      </motion.div>

      <motion.section variants={fadeUpItem} className="space-y-2 p-5">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Flavor Profile
          </h3>
          <CompareToggle beanId={bean.id} />
        </div>
        <FlavorRadar
          series={[
            { id: bean.id, label: bean.name, profile: bean.flavorProfile },
          ]}
        />
      </motion.section>

      <motion.section
        variants={fadeUpItem}
        className="space-y-2 border-t border-border p-5"
      >
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Tasting Notes
        </h3>
        <div className="flex flex-wrap gap-1.5">
          {bean.flavorNotes.map((id) => (
            <span
              key={id}
              className="rounded-full bg-parchment px-2.5 py-0.5 text-xs text-roast-dark dark:bg-roast-dark dark:text-parchment"
            >
              {flavorNoteLabel(flavorNotes, id)}
            </span>
          ))}
        </div>
      </motion.section>

      <motion.section
        variants={fadeUpItem}
        className="grid grid-cols-2 gap-4 border-t border-border p-5 text-sm"
      >
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">
            Processing
          </div>
          <div className="capitalize">{bean.processing}</div>
        </div>
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">
            Roast
          </div>
          <div className="capitalize">{bean.roastRecommendation}</div>
        </div>
        <div className="col-span-2">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">
            Varieties
          </div>
          <div>{bean.varieties.join(", ")}</div>
        </div>
        <div className="col-span-2">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">
            Harvest
          </div>
          <div>{bean.harvestMonths.map(monthName).join(", ")}</div>
        </div>
      </motion.section>

      <motion.section
        variants={fadeUpItem}
        className="border-t border-border p-5"
      >
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Recommended brewing
        </h3>
        <div className="-mx-1 flex snap-x gap-2 overflow-x-auto px-1 pb-2">
          {sortedRecs.map((rec, i) => (
            <BrewCard
              key={rec.methodId}
              recommendation={rec}
              method={methodById.get(rec.methodId)}
              isBest={i === 0}
              onClick={() => onOpenRec(rec)}
            />
          ))}
        </div>
      </motion.section>

      {similar.length > 0 && (
        <motion.section
          variants={fadeUpItem}
          className="border-t border-border p-5"
        >
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Similar beans
          </h3>
          <ul className="grid grid-cols-1 gap-2">
            {similar.map((r) => (
              <li key={r.id}>
                <button
                  type="button"
                  onClick={() => onSelectBean(r.id, r.coordinates)}
                  className="w-full rounded-md border border-border bg-surface/60 p-2 text-left hover:border-roast-medium"
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-sm font-medium">{r.name}</span>
                    <span className="text-[10px] text-muted-foreground">
                      {r.country}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {r.flavorNotes
                      .slice(0, 2)
                      .map((id) => flavorNoteLabel(flavorNotes, id))
                      .join(" · ")}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </motion.section>
      )}

      <motion.section
        variants={fadeUpItem}
        className="border-t border-border p-5 text-sm"
      >
        <p>{bean.description}</p>
        <Link
          href={`/bean/${bean.slug}`}
          className="mt-4 inline-block rounded-md bg-roast-medium px-3 py-1.5 text-sm text-cream hover:bg-roast-dark"
        >
          View full profile →
        </Link>
      </motion.section>
    </motion.div>
  );
}
