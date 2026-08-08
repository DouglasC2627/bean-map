import type { Metadata } from "next";
import { localizedPath, pageMetadata } from "@/lib/seo";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getBeanBySlug, getBrewingMethod } from "@/lib/data";
import { ShareRecipeCard } from "@/components/brewing/ShareRecipeCard";

interface Params {
  params: Promise<{ locale: string; slug: string; method: string }>;
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { locale, slug, method } = await params;
  const bean = getBeanBySlug(slug, locale);
  const rec = bean?.brewingRecommendations.find((r) => r.methodId === method);
  if (!bean || !rec) return {};
  const m = getBrewingMethod(method, locale);
  const t = await getTranslations({ locale, namespace: "recipeCard" });
  const methodName = m?.name ?? method;
  const title = t("metaTitle", { method: methodName, name: bean.name });
  const description = t("metaDescription", { method: methodName, name: bean.name });
  const ogImage = `/api/og/recipe?bean=${bean.slug}&method=${method}&locale=${locale}`;
  const base = pageMetadata({
    locale,
    path: `/bean/${bean.slug}/recipe/${method}`,
    title,
    description,
    images: [ogImage],
  });
  return {
    ...base,
    openGraph: { ...base.openGraph, type: "article" },
    // These exist to be shared (that's what the OG card is for), not to rank:
    // every bean × every method is ~440 near-identical pages per locale whose
    // content is already on the parent bean page. `follow` passes authority
    // back to that page, which is the canonical destination.
    alternates: { canonical: localizedPath(locale, `/bean/${bean.slug}`) },
    robots: { index: false, follow: true },
  };
}

export default async function RecipePage({ params }: Params) {
  const { locale, slug, method } = await params;
  setRequestLocale(locale);
  const bean = getBeanBySlug(slug, locale);
  const rec = bean?.brewingRecommendations.find((r) => r.methodId === method);
  if (!bean || !rec) notFound();
  const m = getBrewingMethod(method, locale);
  const methodName = m?.name ?? method;
  const t = await getTranslations({ locale, namespace: "recipeCard" });

  return (
    <div className="mx-auto w-full max-w-md px-4 py-10">
      <Link
        href={`/bean/${bean.slug}`}
        className="text-sm text-roast-medium hover:underline"
      >
        {t("backToBean", { name: bean.name })}
      </Link>
      <h1 className="mt-3 font-display text-2xl leading-tight">
        {t("pageTitle", { method: methodName, name: bean.name })}
      </h1>
      <p className="mt-1 mb-5 text-sm text-muted-foreground">{t("subtitle")}</p>

      <ShareRecipeCard
        bean={bean}
        recommendation={rec}
        methodName={methodName}
      />

      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          href={`/bean/${bean.slug}`}
          className="rounded-md bg-roast-medium px-3 py-1.5 text-sm text-cream hover:bg-roast-dark"
        >
          {t("viewBean")}
        </Link>
        <Link
          href={`/?bean=${bean.slug}`}
          className="rounded-md border border-border px-3 py-1.5 text-sm hover:border-roast-medium"
        >
          {t("viewOnMap")}
        </Link>
      </div>
    </div>
  );
}
