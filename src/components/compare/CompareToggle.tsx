"use client";

import { useTranslations } from "next-intl";
import { Check, GitCompareArrows, Plus } from "lucide-react";
import { useBeanMap } from "@/store";
import { cn } from "@/lib/utils";

interface Props {
  beanId: string;
  className?: string;
  variant?: "default" | "compact";
}

export function CompareToggle({ beanId, className, variant = "default" }: Props) {
  const t = useTranslations("compareToggle");
  const ids = useBeanMap((s) => s.comparisonBeanIds);
  const addToComparison = useBeanMap((s) => s.addToComparison);
  const removeFromComparison = useBeanMap((s) => s.removeFromComparison);
  const setComparisonOpen = useBeanMap((s) => s.setComparisonOpen);

  const inCompare = ids.includes(beanId);
  const atLimit = !inCompare && ids.length >= 3;

  const onClick = () => {
    if (inCompare) {
      removeFromComparison(beanId);
      return;
    }
    if (atLimit) return;
    addToComparison(beanId);
    setComparisonOpen(true);
  };

  if (variant === "compact") {
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={atLimit}
        aria-pressed={inCompare}
        title={
          inCompare
            ? t("remove")
            : atLimit
              ? t("full")
              : t("add")
        }
        className={cn(
          "inline-flex items-center justify-center rounded-md p-1 text-muted-foreground transition",
          inCompare && "text-roast-medium",
          !atLimit && "hover:text-roast-medium",
          atLimit && "cursor-not-allowed opacity-50",
          className,
        )}
      >
        {inCompare ? (
          <Check className="h-4 w-4" />
        ) : (
          <GitCompareArrows className="h-4 w-4" />
        )}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={atLimit}
      aria-pressed={inCompare}
      className={cn(
        "inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs transition",
        inCompare
          ? "border-roast-medium bg-roast-medium text-cream"
          : atLimit
            ? "cursor-not-allowed border-border opacity-50"
            : "border-border hover:border-roast-medium",
        className,
      )}
    >
      {inCompare ? (
        <>
          <Check className="h-3 w-3" />
          {t("inComparison")}
        </>
      ) : atLimit ? (
        <>
          <Plus className="h-3 w-3" />
          {t("fullShort")}
        </>
      ) : (
        <>
          <Plus className="h-3 w-3" />
          {t("compare")}
        </>
      )}
    </button>
  );
}
