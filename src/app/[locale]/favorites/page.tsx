import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getBeans, getFlavorNotes } from "@/lib/data";
import { FavoritesBrowser } from "@/components/bean/FavoritesBrowser";

interface Params {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata.favorites" });
  return { title: t("title"), description: t("description") };
}

export default async function FavoritesPage({ params }: Params) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "favoritesPage" });
  const beans = getBeans(locale);
  const flavorNotes = getFlavorNotes(locale);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8">
      <h1 className="font-display text-3xl leading-tight">{t("title")}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{t("subtitle")}</p>
      <div className="mt-6">
        <FavoritesBrowser beans={beans} flavorNotes={flavorNotes} />
      </div>
    </div>
  );
}
