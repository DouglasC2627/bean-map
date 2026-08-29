import { getBeans } from "@/lib/data";
import { getAllArticles } from "@/lib/mdx";
import { getCatalogStats } from "@/lib/catalog-stats";
import { routing } from "@/i18n/routing";
import { localizedUrl } from "@/lib/seo";
import { siteUrl } from "@/lib/site";
import { SOURCE_REPO_URL } from "@/lib/structured-data";

/**
 * `/llms.txt` — the emerging convention for handing an LLM a compact, curated
 * map of a site instead of making it infer one from rendered HTML.
 *
 * This matters more here than on most sites: the pages a model would most want
 * to read (the map, the flavor wheel, the insights charts) are canvases and
 * SVGs whose content only exists after JavaScript runs. This file states in
 * plain text what lives where, so an assistant answering "what is BeanMap?" or
 * "where does Ethiopian Yirgacheffe grow?" has something to cite.
 *
 * English only, by design: it's a routing aid, and every URL here has its
 * `hreflang` alternates declared on the page itself.
 *
 * The i18n proxy skips any path containing a dot, so this is served as-is at
 * the origin root rather than being redirected to /en/llms.txt.
 */

export const dynamic = "force-static";

function line(label: string, url: string, note: string): string {
  return `- [${label}](${url}): ${note}`;
}

export function GET(): Response {
  const locale = routing.defaultLocale;
  const stats = getCatalogStats();
  const beans = getBeans(locale);
  const processing = getAllArticles("processing", locale);
  const brewing = getAllArticles("brewing", locale);

  const summary =
    `> BeanMap is a free, open-source interactive world map of specialty ` +
    `coffee. It plots ${stats.beans} coffee origins from ${stats.countries} ` +
    `countries onto a 3D globe; each origin has a six-axis flavor profile, ` +
    `SCA flavor-note tags, altitude, processing method, harvest season, and ` +
    `brewing recipes for ${stats.methods} methods. BeanMap sells nothing, ` +
    `runs no advertising, and is not affiliated with any roaster.`;

  const sections: string[] = [
    "# BeanMap",
    "",
    summary,
    "",
    `Site: ${siteUrl} — available in English (\`/en/…\`) and Traditional ` +
      `Chinese (\`/zh-TW/…\`). Every URL below has a \`zh-TW\` counterpart at ` +
      `the same path.`,
    "",
    "## Start here",
    "",
    line(
      "About BeanMap",
      localizedUrl(locale, "/about"),
      "What BeanMap is, where the data comes from, how flavor profiles are scored, and an FAQ",
    ),
    line(
      "World map (home)",
      localizedUrl(locale, "/"),
      "Interactive globe of every origin, with the Bean Belt overlay and filters by region, processing, roast, altitude, and flavor note",
    ),
    line(
      "All beans",
      localizedUrl(locale, "/beans"),
      `The full catalog of ${stats.beans} origins as a grid or sortable table, plus seasonal and curated collections`,
    ),
    line(
      "Flavor wheel",
      localizedUrl(locale, "/explore/flavors"),
      `The SCA flavor lexicon as an interactive sunburst: ${stats.categories} categories, ${stats.subcategories} subcategories, ${stats.notes} notes`,
    ),
    line(
      "Insights",
      localizedUrl(locale, "/explore/insights"),
      "Growing altitude by origin and a harvest calendar across the catalog",
    ),
    line(
      "Compare beans",
      localizedUrl(locale, "/compare"),
      "Overlay the flavor radars of up to three origins side by side",
    ),
    line(
      "Learn",
      localizedUrl(locale, "/learn"),
      `${stats.articles} illustrated guides on coffee processing and brewing`,
    ),
    "",
    "## Coffee origins",
    "",
    ...beans.map((bean) =>
      line(
        bean.name,
        localizedUrl(locale, `/bean/${bean.slug}`),
        `${bean.region}, ${bean.country} · ${bean.altitudeMasl[0]}–${bean.altitudeMasl[1]} masl · ${bean.processing} · ${bean.description}`,
      ),
    ),
    "",
    "## Processing methods",
    "",
    ...processing.map((article) =>
      line(
        article.frontmatter.title,
        localizedUrl(locale, `/learn/processing/${article.slug}`),
        article.frontmatter.summary ?? article.frontmatter.description,
      ),
    ),
    "",
    "## Brewing guides",
    "",
    ...brewing.map((article) =>
      line(
        article.frontmatter.title,
        localizedUrl(locale, `/learn/brewing/${article.slug}`),
        article.frontmatter.summary ?? article.frontmatter.description,
      ),
    ),
    "",
    "## Optional",
    "",
    line(
      "Source code",
      SOURCE_REPO_URL,
      "MIT-licensed. The catalog lives in src/data/*.json; corrections and new origins are welcome as pull requests",
    ),
    line("Sitemap", `${siteUrl}/sitemap.xml`, "Every indexable URL in both locales"),
    "",
  ];

  return new Response(sections.join("\n"), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=86400",
    },
  });
}
