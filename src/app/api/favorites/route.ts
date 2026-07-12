import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { getDb, isDbConfigured } from "@/db";
import { favorites } from "@/db/schema";

/** GET /api/favorites — the signed-in user's favorites. */
export async function GET() {
  if (!isDbConfigured()) {
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  }
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const db = getDb();
  const rows = await db
    .select()
    .from(favorites)
    .where(eq(favorites.userId, session.user.id));
  return NextResponse.json({
    favorites: rows.map((r) => ({
      beanSlug: r.beanSlug,
      addedAt: r.createdAt.getTime(),
    })),
  });
}

/**
 * POST /api/favorites — add favorite(s).
 * Body: `{ beanSlug: string }` (single) or `{ beanSlugs: string[] }` (bulk
 * merge, used on first login). Existing rows are left untouched.
 */
export async function POST(req: Request) {
  if (!isDbConfigured()) {
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  }
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const body = (await req.json().catch(() => null)) as
    | { beanSlug?: unknown; beanSlugs?: unknown }
    | null;

  const slugs: string[] = [];
  if (typeof body?.beanSlug === "string") slugs.push(body.beanSlug);
  if (Array.isArray(body?.beanSlugs)) {
    for (const s of body.beanSlugs) if (typeof s === "string") slugs.push(s);
  }
  const unique = [...new Set(slugs.filter(Boolean))];
  if (unique.length === 0) {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const db = getDb();
  await db
    .insert(favorites)
    .values(unique.map((beanSlug) => ({ userId: session.user.id, beanSlug })))
    .onConflictDoNothing();

  return NextResponse.json({ ok: true, added: unique.length });
}
