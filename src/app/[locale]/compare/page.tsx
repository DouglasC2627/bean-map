import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import {
  getBeans,
  getBrewingMethods,
  getFlavorNotes,
} from "@/lib/data";
import { ComparisonView } from "@/components/compare/ComparisonView";

interface Props {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ beans?: string }>;
}

export async function generateMetadata({
  params,
  searchParams,
}: Props): Promise<Metadata> {
  const { locale } = await params;
  const { beans: param } = await searchParams;
  const t = await getTranslations({ locale, namespace: "metadata.compare" });
  const slugs = (param ?? "").split(",").filter(Boolean);
  const all = getBeans(locale);
  const matched = slugs
    .map((s) => all.find((b) => b.slug === s))
    .filter((b): b is NonNullable<typeof b> => Boolean(b));

  if (matched.length === 0) {
    return { title: t("title"), description: t("description") };
  }
  const names = matched.map((b) => b.name).join(" vs ");
  return {
    title: t("titleWith", { names }),
    description: t("descriptionWith", { names }),
  };
}

export default async function ComparePage({ params, searchParams }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "compare" });
  const { beans: param } = await searchParams;
  const slugs = (param ?? "").split(",").filter(Boolean).slice(0, 3);

  const all = getBeans(locale);
  const matched = slugs
    .map((s) => all.find((b) => b.slug === s))
    .filter((b): b is NonNullable<typeof b> => Boolean(b));

  const methods = getBrewingMethods(locale);
  const flavorNotes = getFlavorNotes(locale);

  return (
    <div className="mx-auto w-full max-w-(--breakpoint-xl) px-4 py-8">
      <header className="mb-6">
        <h1 className="font-display text-3xl">{t("heading")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("subtitle")}</p>
      </header>

      {matched.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-12 text-center">
          <p className="text-sm text-muted-foreground">
            {t.rich("empty", {
              compare: (chunks) => (
                <span className="font-medium text-foreground">{chunks}</span>
              ),
            })}
          </p>
          <div className="mt-4 flex justify-center gap-3">
            <Link
              href="/"
              className="rounded-md bg-roast-medium px-3 py-1.5 text-sm text-cream hover:bg-roast-dark"
            >
              {t("openMap")}
            </Link>
            <Link
              href="/beans"
              className="rounded-md border border-border px-3 py-1.5 text-sm hover:border-roast-medium"
            >
              {t("browseBeans")}
            </Link>
          </div>
        </div>
      ) : (
        <ComparisonView
          beans={matched}
          methods={methods}
          flavorNotes={flavorNotes}
        />
      )}
    </div>
  );
}
