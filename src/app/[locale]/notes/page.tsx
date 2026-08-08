import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getBeans, getBrewingMethods } from "@/lib/data";
import { NotesJournal } from "@/components/brewing/NotesJournal";

interface Params {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata.notes" });
  return {
    ...pageMetadata({
      locale,
      path: "/notes",
      title: t("title"),
      description: t("description"),
    }),
    // Private page — keep it out of search results.
    robots: { index: false, follow: true },
  };
}

export default async function NotesPage({ params }: Params) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "notes" });
  const beans = getBeans(locale).map((b) => ({ slug: b.slug, name: b.name }));
  const methods = getBrewingMethods(locale).map((m) => ({
    id: m.id,
    name: m.name,
  }));

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8">
      <h1 className="font-display text-3xl leading-tight">{t("title")}</h1>
      <p className="mt-1 mb-6 text-sm text-muted-foreground">{t("subtitle")}</p>
      <NotesJournal beans={beans} methods={methods} />
    </div>
  );
}
