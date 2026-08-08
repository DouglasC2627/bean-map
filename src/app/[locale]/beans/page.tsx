import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { getTranslations, setRequestLocale } from "next-intl/server";
import {
  getBeans,
  getBrewingMethods,
  getFlavorNotes,
} from "@/lib/data";
import { BeansBrowser } from "@/components/bean/BeansBrowser";
import { BeanCollections } from "@/components/bean/BeanCollections";
import { FilterPanel } from "@/components/filter/FilterPanel";
import { ComparisonTray } from "@/components/compare/ComparisonTray";
import { JsonLd } from "@/components/shared/JsonLd";
import { beanListSchema, breadcrumbSchema } from "@/lib/structured-data";

// Refresh at most daily so the "In season now" collection tracks the calendar.
export const revalidate = 86400;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata.beans" });
  return pageMetadata({
    locale,
    path: "/beans",
    title: t("title"),
    description: t("description"),
  });
}

export default async function BeansPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "beans" });
  const tNav = await getTranslations({ locale, namespace: "nav" });
  const tMeta = await getTranslations({ locale, namespace: "metadata.beans" });
  const beans = getBeans(locale);
  const flavorNotes = getFlavorNotes(locale);
  const methods = getBrewingMethods(locale);
  return (
    <div className="mx-auto w-full max-w-screen-2xl px-4 py-6 pb-24">
      <JsonLd
        data={beanListSchema(locale, beans, t("heading"), tMeta("description"))}
      />
      <JsonLd
        data={breadcrumbSchema(locale, [
          { name: tNav("explore"), path: "/" },
          { name: tNav("beans"), path: "/beans" },
        ])}
      />
      <FilterPanel beans={beans} flavorNotes={flavorNotes} />
      <header className="mb-6 text-center">
        <h1 className="font-display text-3xl">{t("heading")}</h1>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
      </header>
      <BeanCollections beans={beans} flavorNotes={flavorNotes} locale={locale} />
      <h2 className="mb-3 font-display text-xl leading-tight">
        {t("browseAll")}
      </h2>
      <BeansBrowser beans={beans} flavorNotes={flavorNotes} />
      <ComparisonTray
        beans={beans}
        methods={methods}
        flavorNotes={flavorNotes}
      />
    </div>
  );
}
