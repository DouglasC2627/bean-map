import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import {
  getBeans,
  getBrewingMethods,
  getFlavorNotes,
} from "@/lib/data";
import { BeansBrowser } from "@/components/bean/BeansBrowser";
import { FilterPanel } from "@/components/filter/FilterPanel";
import { ComparisonTray } from "@/components/compare/ComparisonTray";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata.beans" });
  return { title: t("title"), description: t("description") };
}

export default async function BeansPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "beans" });
  const beans = getBeans(locale);
  const flavorNotes = getFlavorNotes(locale);
  const methods = getBrewingMethods(locale);
  return (
    <div className="mx-auto w-full max-w-screen-2xl px-4 py-6 pb-24">
      <FilterPanel beans={beans} flavorNotes={flavorNotes} />
      <header className="mb-6 text-center">
        <h1 className="font-display text-3xl">{t("heading")}</h1>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
      </header>
      <BeansBrowser beans={beans} flavorNotes={flavorNotes} />
      <ComparisonTray
        beans={beans}
        methods={methods}
        flavorNotes={flavorNotes}
      />
    </div>
  );
}
