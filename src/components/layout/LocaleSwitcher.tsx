"use client";

import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { cn } from "@/lib/utils";

const LABELS: Record<string, string> = {
  en: "EN",
  "zh-TW": "繁中",
};

/**
 * Compact language toggle. Switching only changes the URL's locale prefix while
 * preserving the current path and — crucially — the nuqs query string (filters,
 * selection, viewport), which next-intl's router would otherwise drop. The
 * query is read from `window.location` at click time rather than via
 * `useSearchParams()`, which would force a client-side bailout (and a Suspense
 * boundary) on every statically rendered page.
 */
export function LocaleSwitcher() {
  const t = useTranslations("nav");
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  const switchTo = (next: string) => {
    if (next === locale) return;
    const search =
      typeof window !== "undefined" ? window.location.search : "";
    const query = Object.fromEntries(new URLSearchParams(search));
    router.replace({ pathname, query }, { locale: next });
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
