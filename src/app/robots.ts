import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

/**
 * Only the API surface is disallowed here.
 *
 * The private/thin routes (/favorites, /notes, /compare?beans=…, and the
 * per-method recipe share pages) are handled with per-page `noindex, follow`
 * instead of a `Disallow` rule — deliberately. A disallowed URL is never
 * fetched, so the crawler cannot see the `noindex` directive or the canonical
 * tag, and cannot follow the outbound links to the bean pages. Blocking them
 * here would be strictly worse than letting them be crawled and obeyed.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Auth callbacks, favorites/notes CRUD, and OG image rendering — no
        // indexable content, and OG routes are expensive to render.
        disallow: ["/api/"],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
