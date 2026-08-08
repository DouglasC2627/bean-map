import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import { ChevronLeft } from "lucide-react";
import { Link } from "@/i18n/navigation";
import {
  getArticle,
  getArticleSlugs,
  mdxRenderOptions,
} from "@/lib/mdx";
import { mdxComponents } from "@/lib/mdx-components";
import { JsonLd } from "@/components/shared/JsonLd";
import { breadcrumbSchema, learnArticleSchema } from "@/lib/structured-data";

export const dynamicParams = false;

interface Params {
  params: Promise<{ locale: string; slug: string }>;
}

export function generateStaticParams() {
  return getArticleSlugs("processing").map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { locale, slug } = await params;
  const t = await getTranslations({ locale, namespace: "learn" });
  const article = getArticle("processing", slug, locale);
  if (!article) return { title: t("notFoundTitle") };
  const base = pageMetadata({
    locale,
    path: `/learn/processing/${slug}`,
    title: `${article.frontmatter.title} · BeanMap`,
    description: article.frontmatter.description,
  });
  return {
    ...base,
    openGraph: { ...base.openGraph, type: "article" },
  };
}

export default async function ProcessingArticlePage({ params }: Params) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "learn" });
  const tNav = await getTranslations({ locale, namespace: "nav" });
  const article = getArticle("processing", slug, locale);
  if (!article) notFound();

  return (
    <article className="mx-auto w-full max-w-(--breakpoint-md) px-4 py-8 pb-24">
      <JsonLd
        data={learnArticleSchema({
          locale,
          category: "processing",
          slug,
          title: article.frontmatter.title,
          description: article.frontmatter.description,
        })}
      />
      <JsonLd
        data={breadcrumbSchema(locale, [
          { name: tNav("explore"), path: "/" },
          { name: t("heading"), path: "/learn" },
          { name: article.frontmatter.title, path: `/learn/processing/${slug}` },
        ])}
      />
      <Link
        href="/learn"
        className="mb-4 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-3.5 w-3.5" />
        {t("backToLearn")}
      </Link>
      <header className="mb-6 border-b border-border pb-4">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">
          {t("processingLabel")}
        </p>
        <h1 className="mt-1 font-display text-3xl leading-tight">
          {article.frontmatter.title}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {article.frontmatter.description}
        </p>
      </header>
      <div className="prose-bean">
        <MDXRemote
          source={article.content}
          components={mdxComponents}
          options={mdxRenderOptions}
        />
      </div>
    </article>
  );
}
