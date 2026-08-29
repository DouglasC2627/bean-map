import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";
import { getBeans } from "@/lib/data";
import { getArticleSlugs } from "@/lib/mdx";
import { localizedUrl } from "@/lib/seo";

/**
 * Sitemap for every indexable route, in every locale.
 *
 * Each logical page is emitted once per locale, and every entry carries the
 * full `alternates.languages` set so Google can group the translations instead
 * of treating them as competing duplicates (this is the sitemap-side twin of
 * the `hreflang` tags in `lib/seo.ts`).
 *
 * Deliberately excluded — see the `robots` settings on each page for why:
 *   /favorites, /notes        personal, per-visitor content
 *   /compare?beans=...        combinatorial URL space
 *   the per-method recipe     share targets that duplicate the bean page
 *   pages under /bean/:slug
 */

/** A route to publish, expressed without its locale prefix. */
interface Route {
  path: string;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  priority: number;
}

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  const routes: Route[] = [
    { path: "/", changeFrequency: "weekly", priority: 1.0 },
    { path: "/beans", changeFrequency: "weekly", priority: 0.9 },
    { path: "/about", changeFrequency: "monthly", priority: 0.8 },
    { path: "/learn", changeFrequency: "monthly", priority: 0.7 },
    { path: "/explore/flavors", changeFrequency: "monthly", priority: 0.7 },
    { path: "/explore/insights", changeFrequency: "monthly", priority: 0.6 },
    { path: "/compare", changeFrequency: "monthly", priority: 0.5 },
  ];

  // Bean slugs are locale-independent (only the display copy is translated).
  for (const bean of getBeans()) {
    routes.push({
      path: `/bean/${bean.slug}`,
      changeFrequency: "monthly",
      priority: 0.8,
    });
  }

  for (const category of ["processing", "brewing"] as const) {
    for (const slug of getArticleSlugs(category)) {
      routes.push({
        path: `/learn/${category}/${slug}`,
        changeFrequency: "yearly",
        priority: 0.6,
      });
    }
  }

  return routes.flatMap((route) =>
    routing.locales.map((locale) => ({
      url: localizedUrl(locale, route.path),
      lastModified,
      changeFrequency: route.changeFrequency,
      priority: route.priority,
      alternates: {
        languages: {
          ...Object.fromEntries(
            routing.locales.map((l) => [l, localizedUrl(l, route.path)]),
          ),
          // Mirrors the x-default hreflang in the page <head>.
          "x-default": localizedUrl(routing.defaultLocale, route.path),
        },
      },
    })),
  );
}
