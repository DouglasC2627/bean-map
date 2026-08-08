import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { notFound } from "next/navigation";
import { MapPin } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import {
  getBeanBySlug,
  getBeans,
  getBrewingMethods,
  getFlavorNotes,
} from "@/lib/data";
import {
  countryFlagEmoji,
  flavorNoteLabel,
  formatAltitude,
  monthName,
} from "@/lib/utils";
import { findSimilarBeans } from "@/lib/similar";
import { FlavorRadar } from "@/components/visualization/FlavorRadar";
import { FavoriteButton } from "@/components/shared/FavoriteButton";
import { ShareButton } from "@/components/shared/ShareButton";
import { BrewNotesSection } from "@/components/bean/BrewNotesSection";
import { JsonLd } from "@/components/shared/JsonLd";
import { beanSchema, breadcrumbSchema } from "@/lib/structured-data";

interface Params {
  params: Promise<{ locale: string; slug: string }>;
}

export async function generateStaticParams() {
  return getBeans().map((b) => ({ slug: b.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { locale, slug } = await params;
  const t = await getTranslations({ locale, namespace: "bean" });
  const bean = getBeanBySlug(slug, locale);
  if (!bean) return { title: t("notFoundTitle") };
  const ogTitle = `BeanMap · ${bean.name} · ${bean.country}`;
  const ogImage = `/api/og?bean=${bean.slug}&locale=${locale}`;
  const base = pageMetadata({
    locale,
    path: `/bean/${bean.slug}`,
    title: t("title", { name: bean.name }),
    description: bean.description,
    images: [ogImage],
  });
  return {
    ...base,
    keywords: [
      bean.name,
      bean.country,
      bean.region,
      ...bean.varieties,
      "coffee",
      "single origin",
    ],
    openGraph: { ...base.openGraph, type: "article", title: ogTitle },
    twitter: { ...base.twitter, title: ogTitle },
  };
}

export default async function BeanDetailPage({ params }: Params) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "bean" });
  const tEnum = await getTranslations({ locale, namespace: "enums" });
  const tCommon = await getTranslations({ locale, namespace: "common" });
  const tShare = await getTranslations({ locale, namespace: "share" });
  const tNav = await getTranslations({ locale, namespace: "nav" });

  const bean = getBeanBySlug(slug, locale);
  if (!bean) notFound();

  const listSep = locale === "zh-TW" ? "、" : ", ";
  const methods = getBrewingMethods(locale);
  const methodById = new Map(methods.map((m) => [m.id, m]));
  const related = findSimilarBeans(bean, getBeans(locale), 3);
  const flavorNotes = getFlavorNotes(locale);

  return (
    <article className="mx-auto w-full max-w-3xl px-5 py-10">
      <JsonLd
        data={beanSchema(bean, locale, {
          processing: tEnum(`processing.${bean.processing}`),
          roast: tEnum(`roast.${bean.roastRecommendation}`),
          flavorNotes: bean.flavorNotes.map((id) =>
            flavorNoteLabel(flavorNotes, id),
          ),
        })}
      />
      <JsonLd
        data={breadcrumbSchema(locale, [
          { name: tNav("explore"), path: "/" },
          { name: tNav("beans"), path: "/beans" },
          { name: bean.name, path: `/bean/${bean.slug}` },
        ])}
      />
      <Link
        href="/beans"
        className="text-sm text-roast-medium hover:underline"
      >
        {t("backToBeans")}
      </Link>

      <header className="mt-4 border-b border-border pb-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span aria-hidden className="text-lg leading-none">
            {countryFlagEmoji(bean.countryCode)}
          </span>
          <span>{bean.country}</span>
        </div>
        <h1 className="mt-1 font-display text-4xl leading-tight">
          {bean.name}
        </h1>
        <p className="mt-2 text-muted-foreground">
          {bean.region} · {formatAltitude(bean.altitudeMasl, tCommon("masl"))} ·{" "}
          <Link
            href={`/learn/processing/${bean.processing}`}
            className="text-roast-medium hover:underline"
          >
            {tEnum(`processing.${bean.processing}`)}
          </Link>
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Link
            href={`/?bean=${bean.slug}`}
            className="inline-flex items-center gap-1.5 rounded-md bg-roast-medium px-3 py-1.5 text-sm text-cream transition hover:bg-roast-dark"
          >
            <MapPin aria-hidden className="h-4 w-4" />
            {t("viewOnMap")}
          </Link>
          <FavoriteButton slug={bean.slug} name={bean.name} />
          <ShareButton
            path={`/bean/${bean.slug}`}
            title={bean.name}
            text={tShare("beanText", { name: bean.name, region: bean.region })}
          />
        </div>
      </header>

      <section className="py-6">
        <p className="text-base leading-relaxed">{bean.description}</p>
      </section>

      {bean.funFact && (
        <aside className="rounded-lg border border-border bg-parchment/40 p-4 dark:bg-roast-dark/40">
          <div className="text-xs font-semibold uppercase tracking-wider text-roast-medium">
            {t("didYouKnow")}
          </div>
          <p className="mt-1 text-sm leading-relaxed">{bean.funFact}</p>
        </aside>
      )}

      <section className="grid gap-6 border-t border-border py-6 sm:grid-cols-2">
        <div>
          <h2 className="font-display text-xl">{t("flavorProfile")}</h2>
          <div className="mt-3">
            <FlavorRadar
              series={[
                {
                  id: bean.id,
                  label: bean.name,
                  profile: bean.flavorProfile,
                },
              ]}
              size={260}
            />
          </div>
        </div>
        <div>
          <h2 className="font-display text-xl">{t("details")}</h2>
          <dl className="mt-2 space-y-1 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">{t("varieties")}</dt>
              <dd className="text-right">{bean.varieties.join(listSep)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">{t("processing")}</dt>
              <dd>
                <Link
                  href={`/learn/processing/${bean.processing}`}
                  className="text-roast-medium hover:underline"
                >
                  {tEnum(`processing.${bean.processing}`)}
                </Link>
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">{t("roast")}</dt>
              <dd>{tEnum(`roast.${bean.roastRecommendation}`)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">{t("harvest")}</dt>
              <dd>
                {bean.harvestMonths
                  .map((m) => monthName(m, locale))
                  .join(listSep)}
              </dd>
            </div>
          </dl>
        </div>
      </section>

      <section className="border-t border-border py-6">
        <h2 className="font-display text-xl">{t("tastingNotes")}</h2>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {bean.flavorNotes.map((id) => (
            <span
              key={id}
              className="rounded-full bg-parchment px-2.5 py-0.5 text-xs text-roast-dark dark:bg-roast-dark dark:text-parchment"
            >
              {flavorNoteLabel(flavorNotes, id)}
            </span>
          ))}
        </div>
      </section>

      <section className="border-t border-border py-6">
        <h2 className="font-display text-xl">{t("brewingRecommendations")}</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {[...bean.brewingRecommendations]
            .sort((a, b) => b.affinity - a.affinity)
            .map((rec) => {
              const method = methodById.get(rec.methodId);
              return (
                <div
                  key={rec.methodId}
                  className="rounded-md border border-border bg-surface/60 p-4"
                >
                  <div className="flex items-baseline justify-between">
                    <span className="font-medium">
                      {method?.name ?? rec.methodId}
                    </span>
                    <span className="font-mono text-xs text-muted-foreground">
                      {t("affinity", { score: rec.affinity })}
                    </span>
                  </div>
                  <dl className="mt-2 grid grid-cols-2 gap-1 font-mono text-xs text-muted-foreground">
                    <div>{t("grind")}</div>
                    <div className="text-right text-foreground">
                      {tEnum(`grind.${rec.grindSize}`)} ({rec.grindMicrons}µm)
                    </div>
                    <div>{t("temp")}</div>
                    <div className="text-right text-foreground">
                      {rec.waterTempC}°C
                    </div>
                    <div>{t("ratio")}</div>
                    <div className="text-right text-foreground">
                      {rec.ratio}
                    </div>
                    <div>{t("brew")}</div>
                    <div className="text-right text-foreground">
                      {rec.brewSeconds >= 600
                        ? `${Math.round(rec.brewSeconds / 3600)}h`
                        : `${rec.brewSeconds}s`}
                    </div>
                  </dl>
                  <p className="mt-2 text-sm">{rec.tastingNotes}</p>
                </div>
              );
            })}
        </div>
      </section>

      {related.length > 0 && (
        <section className="border-t border-border py-6">
          <h2 className="font-display text-xl">{t("similarBeans")}</h2>
          <ul className="mt-3 grid gap-2 sm:grid-cols-3">
            {related.map((r) => (
              <li key={r.id}>
                <Link
                  href={`/bean/${r.slug}`}
                  className="block rounded-md border border-border bg-surface/60 p-3 hover:border-roast-medium"
                >
                  <div className="text-sm font-medium">{r.name}</div>
                  <div className="text-xs text-muted-foreground">{r.region}</div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <BrewNotesSection
        beanSlug={bean.slug}
        methods={methods.map((m) => ({ id: m.id, name: m.name }))}
      />
    </article>
  );
}
