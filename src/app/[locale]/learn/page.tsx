import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getAllArticles, type ArticleSummary, type LearnCategory } from "@/lib/mdx";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata.learn" });
  return { title: t("title"), description: t("description") };
}

export default async function LearnPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "learn" });
  const processing = getAllArticles("processing", locale);
  const brewing = getAllArticles("brewing", locale);

  return (
    <div className="mx-auto w-full max-w-(--breakpoint-lg) px-4 py-8 pb-24">
      <header className="mb-8 text-center">
        <h1 className="font-display text-3xl">{t("heading")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("subtitle")}</p>
      </header>

      <Section
        title={t("processingHeading")}
        category="processing"
        articles={processing}
        empty={t("processingEmpty")}
        minReadLabel={(minutes) => t("minRead", { minutes })}
      />

      <Section
        title={t("brewingHeading")}
        category="brewing"
        articles={brewing}
        empty={t("brewingEmpty")}
        minReadLabel={(minutes) => t("minRead", { minutes })}
      />
    </div>
  );
}

function Section({
  title,
  category,
  articles,
  empty,
  minReadLabel,
}: {
  title: string;
  category: LearnCategory;
  articles: ArticleSummary[];
  empty: string;
  minReadLabel: (minutes: number) => string;
}) {
  return (
    <section className="mb-10">
      <h2 className="mb-3 font-display text-xl">{title}</h2>
      {articles.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border p-6 text-sm text-muted-foreground">
          {empty}
        </p>
      ) : (
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {articles.map((a) => (
            <li key={a.slug}>
              <Link
                href={`/learn/${category}/${a.slug}`}
                className="block rounded-lg border border-border bg-surface/60 p-4 transition hover:border-roast-medium"
              >
                <h3 className="font-display text-lg leading-tight">
                  {a.frontmatter.title}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {a.frontmatter.summary ?? a.frontmatter.description}
                </p>
                {a.frontmatter.readingTimeMinutes && (
                  <p className="mt-2 text-[10px] uppercase tracking-wider text-muted-foreground">
                    {minReadLabel(a.frontmatter.readingTimeMinutes)}
                  </p>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
