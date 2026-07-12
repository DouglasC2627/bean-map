"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { Map as MapIcon } from "lucide-react";
import type { CoffeeBean, FlavorNotesData } from "@/types";
import { Link } from "@/i18n/navigation";
import { countryFlagEmoji, flavorNoteLabel, formatAltitude } from "@/lib/utils";
import { easeOut } from "@/lib/motion";
import { CompareToggle } from "@/components/compare/CompareToggle";
import { FavoriteButton } from "@/components/shared/FavoriteButton";

interface Props {
  bean: CoffeeBean;
  flavorNotes: FlavorNotesData;
  /** Position within the grid — drives the staggered scroll-in delay. */
  index?: number;
}

/**
 * Shared grid card for a coffee bean. Used by the Beans browser, the Favorites
 * page, and the Discover feed. Renders as a `<li>`, so mount it inside a `<ul>`.
 */
export function BeanCard({ bean, flavorNotes, index = 0 }: Props) {
  const t = useTranslations("beansBrowser");
  const tEnum = useTranslations("enums");
  const tCommon = useTranslations("common");
  return (
    <motion.li
      data-bean-id={bean.id}
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px 0px" }}
      transition={{
        duration: 0.35,
        ease: easeOut,
        // Cascade within a row group; capped so later cards don't lag.
        delay: Math.min((index % 8) * 0.04, 0.28),
      }}
      className="rounded-lg border border-border bg-surface/60 p-4 transition-colors hover:border-roast-medium"
    >
      <div className="mb-1 flex items-center gap-2 text-xs text-muted-foreground">
        <span aria-hidden className="flag">
          {countryFlagEmoji(bean.countryCode)}
        </span>
        <span>{bean.country}</span>
        <span>·</span>
        <span>{bean.region}</span>
      </div>
      <Link
        href={`/bean/${bean.slug}`}
        className="block font-display text-lg leading-tight hover:text-roast-medium"
      >
        {bean.name}
      </Link>
      <p className="mt-1 font-mono text-xs text-muted-foreground">
        {formatAltitude(bean.altitudeMasl, tCommon("masl"))} ·{" "}
        {tEnum(`processing.${bean.processing}`)}
      </p>
      <div className="mt-3 flex flex-wrap gap-1">
        {bean.flavorNotes.slice(0, 4).map((id) => (
          <span
            key={id}
            className="rounded-full bg-parchment px-2 py-0.5 text-[10px] text-roast-dark dark:bg-roast-dark dark:text-parchment"
          >
            {flavorNoteLabel(flavorNotes, id)}
          </span>
        ))}
      </div>
      <div className="mt-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            href={`/bean/${bean.slug}`}
            className="text-xs text-roast-medium hover:underline"
          >
            {t("viewProfile")}
          </Link>
          <Link
            href={`/?bean=${bean.slug}`}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-roast-medium"
          >
            <MapIcon className="h-3 w-3" />
            {t("showOnMap")}
          </Link>
        </div>
        <div className="flex items-center gap-1">
          <FavoriteButton slug={bean.slug} name={bean.name} variant="compact" />
          <CompareToggle beanId={bean.id} variant="compact" />
        </div>
      </div>
    </motion.li>
  );
}
