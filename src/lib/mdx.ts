import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import remarkGfm from "remark-gfm";
import type { MDXRemoteProps } from "next-mdx-remote/rsc";
import { routing } from "@/i18n/routing";

export type LearnCategory = "processing" | "brewing";

/**
 * Options passed to <MDXRemote> for our trusted, repo-local articles.
 *
 * - `remarkGfm` enables GitHub-flavored markdown (notably tables).
 * - `blockJS: false` is REQUIRED: next-mdx-remote v6 defaults to stripping all
 *   `{expression}` JSX attributes as a security measure, which silently drops
 *   props like `<BrewTimer totalSeconds={195} stages={[...]} />`. Our content is
 *   authored in this repo (never user-supplied), so this is safe. We leave
 *   `blockDangerousJS` at its default (true) for defense-in-depth.
 */
export const mdxRenderOptions: NonNullable<MDXRemoteProps["options"]> = {
  mdxOptions: { remarkPlugins: [remarkGfm] },
  blockJS: false,
};

export interface ArticleFrontmatter {
  title: string;
  description: string;
  summary?: string;
  readingTimeMinutes?: number;
  related?: string[];
}

export interface ArticleSummary {
  category: LearnCategory;
  slug: string;
  frontmatter: ArticleFrontmatter;
}

export interface ArticleSource {
  category: LearnCategory;
  slug: string;
  frontmatter: ArticleFrontmatter;
  content: string;
}

const CONTENT_DIR = path.join(process.cwd(), "src", "content");

// Articles live under `src/content/<locale>/<category>/<slug>.mdx`. English is
// the source language; a missing localized file falls back to English so the
// reader never hits a 404 while a translation is pending.
function categoryDir(category: LearnCategory, locale: string): string {
  return path.join(CONTENT_DIR, locale, category);
}

function readDirSafe(dir: string): string[] {
  try {
    return fs.readdirSync(dir, { withFileTypes: true })
      .filter((d) => d.isFile() && d.name.endsWith(".mdx"))
      .map((d) => d.name);
  } catch {
    return [];
  }
}

/**
 * Slugs are locale-invariant, so enumeration always reads the English tree.
 * This keeps `generateStaticParams` stable and guarantees both locales render
 * every article even before its translation exists.
 */
export function getArticleSlugs(category: LearnCategory): string[] {
  return readDirSafe(categoryDir(category, routing.defaultLocale)).map((f) =>
    f.replace(/\.mdx$/, ""),
  );
}

export function getArticle(
  category: LearnCategory,
  slug: string,
  locale: string = routing.defaultLocale,
): ArticleSource | null {
  const localized = path.join(categoryDir(category, locale), `${slug}.mdx`);
  const fallback = path.join(
    categoryDir(category, routing.defaultLocale),
    `${slug}.mdx`,
  );
  const filePath = fs.existsSync(localized) ? localized : fallback;
  if (!fs.existsSync(filePath)) return null;
  const raw = fs.readFileSync(filePath, "utf8");
  const parsed = matter(raw);
  const frontmatter = parsed.data as ArticleFrontmatter;
  return {
    category,
    slug,
    frontmatter,
    content: parsed.content,
  };
}

export function getAllArticles(
  category: LearnCategory,
  locale: string = routing.defaultLocale,
): ArticleSummary[] {
  return getArticleSlugs(category)
    .map((slug) => {
      const article = getArticle(category, slug, locale);
      return article
        ? { category, slug, frontmatter: article.frontmatter }
        : null;
    })
    .filter((a): a is ArticleSummary => a !== null);
}
