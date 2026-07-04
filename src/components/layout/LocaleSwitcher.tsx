"use client";

import { useLocale, useTranslations } from "next-intl";
import { usePathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { cn } from "@/lib/utils";

const LABELS: Record<string, string> = {
  en: "EN",
  "zh-TW": "繁中",
};

/**
 * Compact language toggle. Switching changes the URL's locale prefix while
 * preserving the current path and — crucially — the nuqs query string (filters,
 * selection, viewport), which next-intl's client router would otherwise drop.
 *
 * We navigate with a full document load rather than the client router on
 * purpose: locale is the root URL segment, so a soft switch remounts the
 * `[locale]` layout and makes React client-mount next-themes' inline theme
 * <script>, which logs a dev warning ("Encountered a script tag while rendering
 * React component"). A full navigation server-renders the new locale, so the
 * script is hydrated instead. `localePrefix` is "always", so every path is
 * `/{locale}{pathname}`; `pathname` here already excludes the locale prefix.
 */
export function LocaleSwitcher() {
  const t = useTranslations("nav");
  const locale = useLocale();
  const pathname = usePathname();

  const switchTo = (next: string) => {
    if (next === locale) return;
    const search =
      typeof window !== "undefined" ? window.location.search : "";
    const path = pathname === "/" ? "" : pathname;
    window.location.assign(`/${next}${path}${search}`);
  };

  return (
    <div
      role="group"
      aria-label={t("switchLanguage")}
      className="flex items-center whitespace-nowrap rounded-md border border-border bg-surface/60 p-0.5 text-xs"
    >
      {routing.locales.map((loc) => {
        const active = loc === locale;
        return (
          <button
            key={loc}
            type="button"
            onClick={() => switchTo(loc)}
            aria-pressed={active}
            className={cn(
              "rounded px-1.5 py-0.5 transition",
              active
                ? "bg-roast-medium text-cream"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {LABELS[loc] ?? loc}
          </button>
        );
      })}
    </div>
  );
}
