import { getTranslations } from "next-intl/server";
import { ArrowRight, BookOpen, Flower2, Grid3x3, LineChart } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { getCatalogStats } from "@/lib/catalog-stats";
import { getBeans } from "@/lib/data";
import { ORIGIN_REGIONS } from "@/lib/origins";
import { countryFlagEmoji } from "@/lib/utils";

/**
 * The prose half of the map home page, rendered below the fold.
 *
 * The map itself is a WebGL canvas: rendered or not, it gives a crawler
 * nothing to index and a snippet generator nothing to quote, which is why
 * Google was surfacing /beans for "BeanMap" instead of this page. This section
 * is the fix — a server-rendered <h1>, a real description of what the site is,
 * the catalog counts, and links into every hub — so the home page finally
 * carries the text that the map is showing.
 *
 * Server component: it is in the initial HTML and adds no client JS to the
 * heaviest route in the app.
 */

const CARDS = [
  { key: "beans", href: "/beans", Icon: Grid3x3 },
  { key: "flavors", href: "/explore/flavors", Icon: Flower2 },
  { key: "insights", href: "/explore/insights", Icon: LineChart },
  { key: "learn", href: "/learn", Icon: BookOpen },
] as const;

/**
 * Every producing country in the catalog, grouped by region, with its bean
 * count — built from the localized records so the names render in the reader's
 * language.
 */
function originsByRegion(locale: string) {
  const beans = getBeans(locale);

  const counts = new Map<string, { name: string; count: number }>();
  for (const bean of beans) {
    const entry = counts.get(bean.countryCode);
    if (entry) entry.count += 1;
    else counts.set(bean.countryCode, { name: bean.country, count: 1 });
  }

  return ORIGIN_REGIONS.map((region) => ({
    key: region.key,
    countries: region.countries
      .filter((code) => counts.has(code))
      .map((code) => ({ code, ...counts.get(code)! })),
  })).filter((region) => region.countries.length > 0);
}

export async function HomeIntro({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: "home" });
  const tFilters = await getTranslations({ locale, namespace: "filters" });
  const stats = getCatalogStats();
  const origins = originsByRegion(locale);

  const statItems = [
    { value: stats.beans, label: t("stats.beans") },
    { value: stats.countries, label: t("stats.countries") },
    { value: stats.notes, label: t("stats.notes") },
    { value: stats.methods, label: t("stats.methods") },
    { value: stats.articles, label: t("stats.articles") },
  ];

  return (
    <div className="mx-auto w-full max-w-(--breakpoint-lg) px-4 py-14">
      <section aria-labelledby="home-intro">
        <h1
          id="home-intro"
          className="max-w-3xl font-display text-3xl leading-tight sm:text-4xl"
        >
          {t("heading")}
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">
          {t("lead", stats)}
        </p>
      </section>

      <section aria-labelledby="home-stats" className="mt-10">
        <h2 id="home-stats" className="sr-only">
          {t("statsHeading")}
        </h2>
        {/* Flex, not a grid: an odd number of tiles leaves a hole in the last
            row of any fixed column count, and the gap-px-over-bg-border
            divider paints that hole as a solid block. Wrapped rows grow to
            fill the width instead. */}
        <dl className="flex flex-wrap gap-px overflow-hidden rounded-xl border border-border bg-border">
          {statItems.map((s) => (
            <div
              key={s.label}
              className="grow basis-[calc(50%-1px)] bg-surface/60 px-4 py-5 text-center sm:basis-[calc(33.333%-1px)]"
            >
              <dt className="sr-only">{s.label}</dt>
              <dd>
                <span className="block font-display text-3xl text-roast-medium dark:text-roast-light">
                  {s.value}
                </span>
                <span className="mt-1 block text-xs tracking-wide text-muted-foreground">
                  {s.label}
                </span>
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <section aria-labelledby="home-bean-belt" className="mt-12 max-w-2xl">
        <h2
          id="home-bean-belt"
          className="font-display text-2xl leading-tight"
        >
          {t("beanBeltHeading")}
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          {t("beanBeltBody")}
        </p>
      </section>

      {/* Links carry `?region=<cc>`, which the map hydrates from the URL on
          load.*/}
      <section aria-labelledby="home-origins" className="mt-12">
        <h2 id="home-origins" className="font-display text-2xl leading-tight">
          {t("originsHeading")}
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          {t("originsBody", stats)}
        </p>
        <div className="mt-5 space-y-5">
          {origins.map((region) => (
            <section key={region.key} aria-labelledby={`origins-${region.key}`}>
              <h3
                id={`origins-${region.key}`}
                className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground"
              >
                {tFilters(`regions.${region.key}`)}
              </h3>
              <ul className="flex flex-wrap gap-2">
                {region.countries.map((country) => (
                  <li key={country.code}>
                    <Link
                      href={{ pathname: "/", query: { region: country.code } }}
                      className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface/60 px-3 py-1.5 text-sm transition hover:border-roast-medium"
                    >
                      <span aria-hidden className="flag">
                        {countryFlagEmoji(country.code)}
                      </span>
                      {country.name}
                      <span className="text-xs text-muted-foreground">
                        {country.count}
                        {/* Reuses the stat-tile unit ("coffee origins" /
                            "個咖啡產地") so the bare number isn't read out as
                            part of the country name. */}
                        <span className="sr-only"> {t("stats.beans")}</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </section>

      <section aria-labelledby="home-next" className="mt-12">
        <h2 id="home-next" className="font-display text-2xl leading-tight">
          {t("nextHeading")}
        </h2>
        <ul className="mt-4 grid auto-rows-fr grid-cols-1 gap-3 sm:grid-cols-2">
          {CARDS.map(({ key, href, Icon }) => (
            <li key={key}>
              <Link
                href={href}
                className="flex h-full gap-3 rounded-lg border border-border bg-surface/60 p-4 transition hover:border-roast-medium"
              >
                <Icon
                  aria-hidden
                  className="mt-0.5 h-5 w-5 shrink-0 text-roast-medium dark:text-roast-light"
                />
                <div>
                  <h3 className="font-display text-lg leading-tight">
                    {t(`cards.${key}.title`)}
                  </h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    {t(`cards.${key}.body`, stats)}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
        <Link
          href="/about"
          className="mt-5 inline-flex items-center gap-1.5 text-sm text-roast-medium hover:underline dark:text-roast-light"
        >
          {t("aboutLink")}
          <ArrowRight aria-hidden className="h-4 w-4" />
        </Link>
      </section>
    </div>
  );
}
