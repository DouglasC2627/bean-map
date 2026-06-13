import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import { ChevronLeft } from "lucide-react";
import {
  getArticle,
  getArticleSlugs,
  mdxRenderOptions,
} from "@/lib/mdx";
import { mdxComponents } from "@/lib/mdx-components";

export const dynamicParams = false;

interface Params {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return getArticleSlugs("brewing").map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticle("brewing", slug);
  if (!article) return { title: "Not found · BeanMap" };
  return {
    title: `${article.frontmatter.title} · BeanMap`,
    description: article.frontmatter.description,
  };
}

export default async function BrewingArticlePage({ params }: Params) {
  const { slug } = await params;
  const article = getArticle("brewing", slug);
  if (!article) notFound();

  return (
    <article className="mx-auto w-full max-w-(--breakpoint-md) px-4 py-8 pb-24">
      <Link
        href="/learn"
        className="mb-4 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-3.5 w-3.5" />
        Back to Learn
      </Link>
      <header className="mb-6 border-b border-border pb-4">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">
          Brewing guide
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
