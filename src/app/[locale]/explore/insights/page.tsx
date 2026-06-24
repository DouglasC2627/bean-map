import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getBeans, getFlavorNotes } from "@/lib/data";
import { InsightsClient } from "./InsightsClient";
import { FilterPanel } from "@/components/filter/FilterPanel";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata.insights" });
  return { title: t("title"), description: t("description") };
}

export default async function InsightsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "insights" });
  const beans = getBeans(locale);
  const flavorNotes = getFlavorNotes(locale);
  return (
    <div className="mx-auto w-full max-w-(--breakpoint-xl) overflow-x-hidden px-4 py-8 pb-24">
      <FilterPanel beans={beans} flavorNotes={flavorNotes} />
      <header className="mb-6 text-center">
        <h1 className="font-display text-3xl">{t("heading")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("subtitle")}</p>
      </header>
      <InsightsClient beans={beans} flavorNotes={flavorNotes} />
    </div>
  );
}
