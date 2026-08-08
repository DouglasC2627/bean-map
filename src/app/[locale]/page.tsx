import { setRequestLocale } from "next-intl/server";
import { MapView } from "@/components/map/MapView";
import { getBeans, getBrewingMethods, getFlavorNotes } from "@/lib/data";
import { JsonLd } from "@/components/shared/JsonLd";
import { websiteSchema } from "@/lib/structured-data";

export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const beans = getBeans(locale);
  const methods = getBrewingMethods(locale);
  const flavorNotes = getFlavorNotes(locale);
  return (
    <>
      <JsonLd data={websiteSchema(locale)} />
      <MapView beans={beans} methods={methods} flavorNotes={flavorNotes} />
    </>
  );
}
