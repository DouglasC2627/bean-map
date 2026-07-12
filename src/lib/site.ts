/**
 * Canonical absolute base URL for the deployment. Used for `metadataBase`
 * (so relative OG image paths resolve to absolute URLs) and for building
 * shareable links in client components.
 *
 * Resolution order:
 *   1. NEXT_PUBLIC_SITE_URL — set this to the production origin.
 *   2. VERCEL_URL — auto-provided on Vercel preview/prod deployments.
 *   3. http://localhost:3000 — local dev fallback.
 */
function resolveSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit.replace(/\/$/, "");

  const vercel = process.env.NEXT_PUBLIC_VERCEL_URL ?? process.env.VERCEL_URL;
  if (vercel) return `https://${vercel.replace(/\/$/, "")}`;

  return "http://localhost:3000";
}

export const siteUrl = resolveSiteUrl();

/** Build an absolute URL from a root-relative path (e.g. "/bean/foo"). */
export function absoluteUrl(path: string): string {
  return `${siteUrl}${path.startsWith("/") ? path : `/${path}`}`;
}
