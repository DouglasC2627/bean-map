import type { Metadata } from "next";
import { routing, type Locale } from "@/i18n/routing";
import { siteUrl } from "@/lib/site";

/**
 * Every route is locale-prefixed (`localePrefix: "always"`), so each page
 * exists once per locale and search engines need to be told those copies are
 * translations of one another rather than duplicates.
 *
 * `path` is the route *without* the locale prefix, e.g. "/beans" or
 * "/bean/kenya-nyeri". Use "/" for the map home page.
 */
export function localizedPath(locale: string, path: string): string {
  const clean = path === "/" ? "" : path.startsWith("/") ? path : `/${path}`;
  return `/${locale}${clean}`;
}

export function localizedUrl(locale: string, path: string): string {
  return `${siteUrl}${localizedPath(locale, path)}`;
}

/**
 * Extra `hreflang` values that alias a locale we actually publish.
 */
const localeAliases: Record<string, readonly string[]> = {
  "zh-TW": ["zh", "zh-Hant", "zh-Hant-TW", "zh-HK", "zh-MO"],
};

/**
 * The full `hreflang` → href map for one path: every published locale, every
 * alias tag above, and `x-default`.
 *
 * `toHref` decides whether the values come out root-relative (page metadata,
 * where Next resolves them against `metadataBase`) or absolute (the sitemap,
 * which has no such base).
 */
export function hreflangLanguages(
  path: string,
  toHref: (locale: string, path: string) => string = localizedPath,
): Record<string, string> {
  const languages: Record<string, string> = {};
  for (const l of routing.locales) {
    const href = toHref(l, path);
    languages[l] = href;
    for (const alias of localeAliases[l] ?? []) {
      languages[alias] = href;
    }
  }
  languages["x-default"] = toHref(routing.defaultLocale, path);
  return languages;
}

/**
 * Canonical URL for the current locale plus the full `hreflang` set.
 *
 * `x-default` points at the default locale so engines have a language-neutral
 * entry point for users whose language we don't publish.
 */
export function alternates(locale: string, path: string): Metadata["alternates"] {
  return {
    canonical: localizedPath(locale, path),
    languages: hreflangLanguages(path),
  };
}

/**
 * Open Graph `locale` / `alternateLocale` values. Open Graph wants
 * underscore-separated POSIX-ish tags ("zh_TW"), not BCP-47 ("zh-TW").
 */
export function ogLocales(locale: string): {
  locale: string;
  alternateLocale: string[];
} {
  const toOg = (l: string) => l.replace("-", "_");
  return {
    locale: toOg(locale),
    alternateLocale: routing.locales
      .filter((l) => l !== locale)
      .map(toOg),
  };
}

/**
 * Shared page metadata: canonical + hreflang, plus Open Graph/Twitter defaults
 * so any page that doesn't supply its own social card still gets a coherent
 * one. Pages with richer cards (beans, comparisons, recipes) spread this and
 * override `openGraph.images`.
 */
export function pageMetadata({
  locale,
  path,
  title,
  description,
  images,
}: {
  locale: string;
  path: string;
  title: string;
  description: string;
  images?: string[];
}): Metadata {
  const og = ogLocales(locale);
  return {
    title,
    description,
    alternates: alternates(locale, path),
    openGraph: {
      type: "website",
      siteName: "BeanMap",
      url: localizedPath(locale, path),
      title,
      description,
      locale: og.locale,
      alternateLocale: og.alternateLocale,
      ...(images ? { images } : {}),
    },
    twitter: {
      card: images ? "summary_large_image" : "summary",
      title,
      description,
      ...(images ? { images } : {}),
    },
  };
}

export function isLocale(value: string): value is Locale {
  return (routing.locales as readonly string[]).includes(value);
}
