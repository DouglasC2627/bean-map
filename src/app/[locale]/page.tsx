import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { MapView } from "@/components/map/MapView";
import { getBeans, getBrewingMethods, getFlavorNotes } from "@/lib/data";
import { JsonLd } from "@/components/shared/JsonLd";
import { getCatalogStats } from "@/lib/catalog-stats";
import { pageMetadata } from "@/lib/seo";
import { websiteSchema } from "@/lib/structured-data";
import { HomeIntro } from "./HomeIntro";

/**
 * The map page carries its own metadata rather than inheriting the layout's,
 * so the stat counts can be interpolated into the description. The layout
 * still supplies the site-wide defaults for every other route.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata.home" });
  const stats = getCatalogStats();
  return pageMetadata({
    locale,
    path: "/",
    title: t("title", stats),
    description: t("description", stats),
  });
}

export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "metadata.home" });
  const stats = getCatalogStats();
  const beans = getBeans(locale);
  const methods = getBrewingMethods(locale);
  const flavorNotes = getFlavorNotes(locale);
  return (
    <>
      <JsonLd
        data={websiteSchema(locale, {
          name: t("title", stats),
          description: t("description", stats),
        })}
      />
      <MapView beans={beans} methods={methods} flavorNotes={flavorNotes} />
      <HomeIntro locale={locale} />
    </>
  );
}
