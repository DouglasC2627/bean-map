import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getBeans, getFlavorNotes } from "@/lib/data";
import { FlavorsExplorer } from "./FlavorsExplorer";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata.flavors" });
  return { title: t("title"), description: t("description") };
}

export default async function FlavorsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "flavors" });
  const beans = getBeans(locale);
  const flavorNotes = getFlavorNotes(locale);
  return (
    <div className="mx-auto w-full max-w-(--breakpoint-xl) px-4 py-8 pb-24">
      <header className="mb-6 text-center">
        <h1 className="font-display text-3xl">{t("heading")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("subtitle")}</p>
      </header>
      <FlavorsExplorer beans={beans} flavorNotes={flavorNotes} />
    </div>
  );
}
