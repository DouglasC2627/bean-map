import { getTranslations } from "next-intl/server";

/**
 * The first focusable thing on every page: lets a keyboard user jump past the
 * header nav (and, on the map, past the filter and bean-list controls) straight
 * to the page content.
 *
 * Visually hidden until focused — `sr-only` alone would leave a keyboard user
 * tabbing to something they cannot see, so `focus:not-sr-only` brings it back
 * as a real, visible chip pinned to the top-left.
 */
export async function SkipToContent() {
  const t = await getTranslations("nav");
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-md focus:border focus:border-border focus:bg-background focus:px-3 focus:py-2 focus:text-sm focus:shadow-lg"
    >
      {t("skipToContent")}
    </a>
  );
}
