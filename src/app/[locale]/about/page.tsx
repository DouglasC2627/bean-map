import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import {
  Compass,
  GitCompare,
  Grid3x3,
  LineChart,
  BookOpen,
  Flower2,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import { GitHubIcon } from "@/components/shared/BrandIcons";
import { JsonLd } from "@/components/shared/JsonLd";
import { getCatalogStats } from "@/lib/catalog-stats";
import { pageMetadata } from "@/lib/seo";
import {
  aboutPageSchema,
  breadcrumbSchema,
  faqSchema,
  SOURCE_REPO_URL,
} from "@/lib/structured-data";

/**
 * The page that explains what BeanMap *is*.
 *
 * The map home page is a WebGL canvas with almost no prose, and the bean
 * catalog reads like a list of products — neither gives a search engine (or a
 * model writing an AI overview) anything to quote when someone asks "what is
 * BeanMap?". This page is that answer in plain language, with the FAQ block
 * emitted as `FAQPage` JSON-LD so the Q&A pairs are machine-readable rather
 * than something a summarizer has to infer from the layout.
 *
 * Every number in the copy is interpolated from `getCatalogStats()`, so adding
 * a bean updates this page and its structured data at the same time.
 */

/** Rendered in order. Explicit so the FAQ JSON-LD matches what's on the page. */
const FAQ_KEYS = [
  "what",
  "free",
  "origins",
  "data",
  "buy",
  "pick",
  "flavorWheel",
  "beanBelt",
  "account",
] as const;

const WHAT_CARDS = [
  { key: "map", href: "/", Icon: Compass },
  { key: "beans", href: "/beans", Icon: Grid3x3 },
  { key: "flavors", href: "/explore/flavors", Icon: Flower2 },
  { key: "insights", href: "/explore/insights", Icon: LineChart },
  { key: "compare", href: "/compare", Icon: GitCompare },
  { key: "learn", href: "/learn", Icon: BookOpen },
] as const;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata.about" });
  const stats = getCatalogStats();
  return pageMetadata({
    locale,
    path: "/about",
    title: t("title", stats),
    description: t("description", stats),
  });
}

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "about" });
  const tNav = await getTranslations({ locale, namespace: "nav" });
  const tMeta = await getTranslations({ locale, namespace: "metadata.about" });
  const stats = getCatalogStats();

  const faqItems = FAQ_KEYS.map((key) => ({
    key,
    q: t(`faq.${key}.q`),
    a: t(`faq.${key}.a`, stats),
  }));

  const statItems = [
    { value: stats.beans, label: t("stats.beans") },
    { value: stats.countries, label: t("stats.countries") },
    { value: stats.notes, label: t("stats.notes") },
    { value: stats.methods, label: t("stats.methods") },
    { value: stats.articles, label: t("stats.articles") },
  ];

  return (
    <div className="mx-auto w-full max-w-(--breakpoint-lg) px-4 py-10 pb-24">
      <JsonLd
        data={aboutPageSchema({
          locale,
          name: t("heading"),
          description: tMeta("description", stats),
          // The same six capabilities the page lists below, flattened for
          // `featureList` — this is the summary an assistant reads first.
          features: WHAT_CARDS.map((c) => t(`what.${c.key}.title`)),
        })}
      />
      <JsonLd data={faqSchema(locale, "/about", faqItems)} />
      <JsonLd
        data={breadcrumbSchema(locale, [
          { name: tNav("explore"), path: "/" },
          { name: tNav("about"), path: "/about" },
        ])}
      />

      <header className="mb-10 text-center">
        <h1 className="font-display text-4xl leading-tight sm:text-5xl">
          {t("heading")}
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">
          {t("lead")}
        </p>
      </header>

      <section aria-labelledby="about-stats" className="mb-14">
        <h2 id="about-stats" className="sr-only">
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

      <section aria-labelledby="about-what" className="mb-14">
        <h2
          id="about-what"
          className="mb-4 font-display text-2xl leading-tight"
        >
          {t("whatHeading")}
        </h2>
        <ul className="grid auto-rows-fr grid-cols-1 gap-3 sm:grid-cols-2">
          {WHAT_CARDS.map(({ key, href, Icon }) => (
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
                    {t(`what.${key}.title`)}
                  </h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    {t(`what.${key}.body`, stats)}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="about-data" className="mb-14">
        <h2
          id="about-data"
          className="mb-4 font-display text-2xl leading-tight"
        >
          {t("dataHeading")}
        </h2>
        <div className="space-y-4 text-sm leading-relaxed text-muted-foreground">
          <p>{t("dataBody1")}</p>
          <p>{t("dataBody2")}</p>
          <p>{t("dataBody3")}</p>
        </div>
      </section>

      <section aria-labelledby="about-open" className="mb-14">
        <h2
          id="about-open"
          className="mb-4 font-display text-2xl leading-tight"
        >
          {t("openHeading")}
        </h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {t("openBody")}
        </p>
        <a
          href={SOURCE_REPO_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex items-center gap-2 rounded-md border border-border bg-surface/60 px-3 py-2 text-sm transition hover:border-roast-medium"
        >
          <GitHubIcon className="h-4 w-4" />
          {t("openCta")}
        </a>
      </section>

      <section aria-labelledby="about-privacy" className="mb-14">
        <h2
          id="about-privacy"
          className="mb-4 font-display text-2xl leading-tight"
        >
          {t("privacyHeading")}
        </h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {t("privacyBody")}
        </p>
      </section>

      <section aria-labelledby="about-faq">
        <h2 id="about-faq" className="mb-4 font-display text-2xl leading-tight">
          {t("faqHeading")}
        </h2>
        {/* Plain headings and paragraphs rather than a disclosure widget: the
            answers need to be in the rendered text, not behind a click, for
            both the FAQ rich result and anything summarizing the page. */}
        <dl className="divide-y divide-border border-y border-border">
          {faqItems.map((item) => (
            <div key={item.key} className="py-5">
              <dt className="font-display text-lg leading-tight">{item.q}</dt>
              <dd className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {item.a}
              </dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
}
