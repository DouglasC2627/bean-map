"use client";

import { useMemo, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";
import { X } from "lucide-react";
import { Link } from "@/i18n/navigation";
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
import { flavorGradient } from "@/lib/flavor-gradient";
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
  const t = useTranslations("bean");
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
      {/* Desktop side panel (sm and up) — slides in from the right.
          The panel is positioned absolutely inside a full-viewport clip layer
          rather than fixed against the viewport directly: its slide starts fully
          off-screen (x: 100%), and relying on the root's `overflow-x: clip` to
          contain a translated *fixed* child is unreliable — WebKit/Safari
          ignores it and instead widens the layout viewport to fit the off-screen
          panel, zooming the whole page out. An `overflow-hidden` positioned
          ancestor clips the slide in every browser. `pointer-events-none` lets
          map interaction pass through the layer; the panel re-enables them. */}
      <div className="pointer-events-none fixed inset-0 z-30 hidden overflow-hidden sm:block">
        <AnimatePresence>
          {isOpen && (
            <motion.aside
              key="bean-panel"
              ref={asideRef}
              aria-label={
                bean ? t("profileOf", { name: bean.name }) : t("beanProfile")
              }
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={springSoft}
              className={cn(
                "pointer-events-auto absolute top-14 right-0 bottom-0 w-[50vw] max-w-none overflow-x-hidden overflow-y-auto border-l bg-background/95 shadow-xl backdrop-blur-sm lg:w-105",
              )}
            >
              {renderContent(asideRef)}
            </motion.aside>
          )}
        </AnimatePresence>
      </div>

      {/* Mobile bottom sheet — draggable, gesture-driven, with snap points. */}
      <MobileBottomSheet
        open={isMobile && isOpen}
        onClose={clearSelection}
        snapPoints={[0.3, 0.6, 0.92]}
        initialSnap={1}
        scrollRef={sheetScrollRef}
        label={bean ? t("profileOf", { name: bean.name }) : t("beanProfile")}
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
 * Parallax gradient backdrop for the panel header. Its colours are generated
 * from the bean's flavour profile — dominant flavour-note categories drive the
 * hue, the numeric profile drives the gradient geometry (see {@link
 * flavorGradient}) — so every bean gets a distinct, meaningful header. Fills its
 * relatively-positioned parent and lags the scroll for a subtle parallax;
 * static when reduced motion is requested.
 */
function ParallaxHero({
  bean,
  flavorNotes,
  scrollRef,
}: {
  bean: CoffeeBean;
  flavorNotes: FlavorNotesData;
  scrollRef: React.RefObject<HTMLElement | null>;
}) {
  const reduce = useReducedMotion();
  const { scrollY } = useScroll({ container: scrollRef });
  const y = useTransform(scrollY, [0, 180], [0, 36]);
  const scale = useTransform(scrollY, [0, 180], [1, 1.12]);

  return (
    <motion.div
      aria-hidden
      style={{
        backgroundImage: flavorGradient(bean, flavorNotes),
        ...(reduce ? {} : { y, scale }),
      }}
      // Extra headroom up top so the parallax shift never reveals an edge.
      className="pointer-events-none absolute -inset-x-2 -top-12 bottom-0"
    />
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
  const t = useTranslations("bean");
  const tEnum = useTranslations("enums");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const listSep = locale === "zh-TW" ? "、" : ", ";
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
        className="relative overflow-hidden border-b border-border"
      >
        {/* Flavour gradient hero (parallax) fills the whole header and sits
            behind the name + altitude; a bottom-weighted scrim keeps the text
            legible over any bean's colours while leaving a tint at the base so
            the text reads as part of the coloured header. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 overflow-hidden"
        >
          <ParallaxHero
            bean={bean}
            flavorNotes={flavorNotes}
            scrollRef={scrollRef}
          />
          <div className="absolute inset-0 bg-linear-to-b from-transparent via-background/40 to-background/92" />
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label={t("closePanel")}
          className="absolute right-3 top-3 z-10 rounded-md bg-background/70 p-1 text-muted-foreground backdrop-blur-sm hover:bg-parchment hover:text-foreground dark:hover:bg-roast-dark"
        >
          <X className="h-5 w-5" />
        </button>
        <div className="relative px-5 pb-5 pt-24">
          <div className="mb-1 flex items-center gap-2 text-sm text-muted-foreground">
            <span aria-hidden className="flag text-lg leading-none">
              {countryFlagEmoji(bean.countryCode)}
            </span>
            <span>{bean.country}</span>
          </div>
          <h2 className="font-display text-2xl leading-tight">{bean.name}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {bean.region} · {formatAltitude(bean.altitudeMasl, tCommon("masl"))}
          </p>
        </div>
      </motion.div>

      <motion.section variants={fadeUpItem} className="space-y-2 p-5">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {t("flavorProfile")}
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
          {t("tastingNotes")}
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
            {t("processing")}
          </div>
          <Link
            href={`/learn/processing/${bean.processing}`}
            className="text-roast-medium hover:underline"
          >
            {tEnum(`processing.${bean.processing}`)}
          </Link>
        </div>
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">
            {t("roast")}
          </div>
          <div>{tEnum(`roast.${bean.roastRecommendation}`)}</div>
        </div>
        <div className="col-span-2">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">
            {t("varieties")}
          </div>
          <div>{bean.varieties.join(listSep)}</div>
        </div>
        <div className="col-span-2">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">
            {t("harvest")}
          </div>
          <div>
            {bean.harvestMonths.map((m) => monthName(m, locale)).join(listSep)}
          </div>
        </div>
      </motion.section>

      <motion.section
        variants={fadeUpItem}
        className="border-t border-border p-5"
      >
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {t("recommendedBrewing")}
        </h3>
        {/* pt-2/-mt-2 keeps the BEST badge (absolute -top-2 on the card) inside
            the scrollport — overflow-x-auto also clips vertically. */}
        <div className="-mx-1 -mt-2 flex snap-x gap-2 overflow-x-auto px-1 pt-2 pb-2">
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
            {t("similarBeans")}
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
        {bean.funFact && (
          <div className="mt-3 rounded-md border border-border bg-parchment/40 p-3 dark:bg-roast-dark/40">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-roast-medium">
              {t("didYouKnow")}
            </div>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              {bean.funFact}
            </p>
          </div>
        )}
        <Link
          href={`/bean/${bean.slug}`}
          className="mt-4 inline-block rounded-md bg-roast-medium px-3 py-1.5 text-sm text-cream hover:bg-roast-dark"
        >
          {t("viewFullProfile")}
        </Link>
      </motion.section>
    </motion.div>
  );
}
