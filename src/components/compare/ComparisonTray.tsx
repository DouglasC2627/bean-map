"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronDown,
  ChevronUp,
  ExternalLink,
  GitCompareArrows,
  X,
} from "lucide-react";
import type { BrewingMethod, CoffeeBean, FlavorNotesData } from "@/types";
import { Link } from "@/i18n/navigation";
import { useBeanMap } from "@/store";
import { countryFlagEmoji } from "@/lib/utils";
import { springSoft } from "@/lib/motion";
import { ComparisonView } from "./ComparisonView";

interface Props {
  beans: CoffeeBean[];
  methods?: BrewingMethod[];
  flavorNotes?: FlavorNotesData;
}

export function ComparisonTray({ beans, methods, flavorNotes }: Props) {
  const t = useTranslations("compareTray");
  const ids = useBeanMap((s) => s.comparisonBeanIds);
  const removeFromComparison = useBeanMap((s) => s.removeFromComparison);
  const isOpen = useBeanMap((s) => s.isComparisonOpen);
  const setOpen = useBeanMap((s) => s.setComparisonOpen);

  const [showFull, setShowFull] = useState(false);

  const selected = useMemo(
    () =>
      ids
        .map((id) => beans.find((b) => b.id === id))
        .filter((b): b is CoffeeBean => Boolean(b)),
    [ids, beans],
  );

  return (
    <>
      <AnimatePresence>
        {selected.length > 0 && (
          <motion.div
            aria-label={t("tray")}
            initial={{ y: "100%" }}
            animate={{ y: isOpen ? 0 : "calc(100% - 2.25rem)" }}
            exit={{ y: "100%" }}
            transition={springSoft}
            className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 shadow-[0_-8px_24px_-12px_rgba(0,0,0,0.25)] backdrop-blur-md"
          >
            <button
              type="button"
              onClick={() => setOpen(!isOpen)}
              aria-label={isOpen ? t("collapse") : t("expand")}
              className="flex w-full items-center justify-between border-b border-border bg-parchment/60 px-4 py-2 text-xs font-medium uppercase tracking-wider text-roast-dark dark:bg-roast-dark/40 dark:text-parchment"
            >
              <span className="inline-flex items-center gap-2">
                <GitCompareArrows className="h-3.5 w-3.5" />
                {t("heading", { count: selected.length })}
              </span>
              {isOpen ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronUp className="h-4 w-4" />
              )}
            </button>

            <div className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center">
              <ul className="flex min-w-0 gap-2 overflow-x-auto sm:flex-1">
                <AnimatePresence mode="popLayout" initial={false}>
                  {selected.map((bean) => (
                    <motion.li
                      key={bean.id}
                      layout
                      // Card flies in toward the tray, and out on removal.
                      initial={{ opacity: 0, scale: 0.85, y: 16 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.85, y: 16 }}
                      transition={springSoft}
                      className="flex shrink-0 items-center gap-2 rounded-md border border-border bg-surface/60 px-3 py-1.5"
                    >
                      <span aria-hidden className="flag">
                        {countryFlagEmoji(bean.countryCode)}
                      </span>
                      <div className="text-xs leading-tight">
                        <div className="font-medium">{bean.name}</div>
                        <div className="text-muted-foreground">
                          {bean.country}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFromComparison(bean.id)}
                        aria-label={t("remove", { name: bean.name })}
                        className="ml-1 rounded p-0.5 text-muted-foreground hover:bg-parchment hover:text-foreground dark:hover:bg-roast-dark"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ul>

              <div className="flex shrink-0 items-center justify-end gap-2">
                <Link
                  href={`/compare?beans=${selected.map((b) => b.slug).join(",")}`}
                  className="inline-flex shrink-0 items-center gap-1 rounded-md border border-border px-2.5 py-1.5 text-xs text-muted-foreground hover:border-roast-medium hover:text-foreground"
                  title={t("shareTitle")}
                >
                  <ExternalLink className="h-3 w-3" />
                  {t("shareLink")}
                </Link>

                <button
                  type="button"
                  onClick={() => setShowFull(true)}
                  className="shrink-0 rounded-md bg-roast-medium px-3 py-1.5 text-xs font-medium text-cream hover:bg-roast-dark"
                >
                  {t("compare")}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {showFull && (
        <ComparisonView
          beans={selected}
          methods={methods}
          flavorNotes={flavorNotes}
          onClose={() => setShowFull(false)}
        />
      )}
    </>
  );
}
