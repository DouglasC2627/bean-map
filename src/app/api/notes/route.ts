import { NextResponse } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import { auth } from "@/auth";
import { getDb, isDbConfigured } from "@/db";
import { brewNotes, type BrewNoteRow } from "@/db/schema";

export function serializeNote(r: BrewNoteRow) {
  return {
    id: r.id,
    beanSlug: r.beanSlug,
    methodId: r.methodId,
    note: r.note,
    rating: r.rating,
    brewedAt: r.brewedAt ? r.brewedAt.toISOString().slice(0, 10) : null,
    createdAt: r.createdAt.getTime(),
    updatedAt: r.updatedAt.getTime(),
  };
}

function clampRating(v: unknown): number | null {
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n)) return null;
  return Math.max(1, Math.min(5, Math.round(n)));
}

/** GET /api/notes[?beanSlug=] — the signed-in user's brew notes. */
export async function GET(req: Request) {
  if (!isDbConfigured()) {
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  }
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const beanSlug = new URL(req.url).searchParams.get("beanSlug");
  const db = getDb();
  const where = beanSlug
    ? and(
        eq(brewNotes.userId, session.user.id),
        eq(brewNotes.beanSlug, beanSlug),
      )
    : eq(brewNotes.userId, session.user.id);
  const rows = await db
    .select()
    .from(brewNotes)
    .where(where)
    .orderBy(desc(brewNotes.createdAt));
  return NextResponse.json({ notes: rows.map(serializeNote) });
}

/** POST /api/notes — create a brew note. */
export async function POST(req: Request) {
  if (!isDbConfigured()) {
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  }
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const body = (await req.json().catch(() => null)) as Record<
    string,
    unknown
  > | null;
  const beanSlug = body?.beanSlug;
  if (typeof beanSlug !== "string" || !beanSlug) {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }
  const brewedAtRaw = body?.brewedAt;
  const brewedAt =
    typeof brewedAtRaw === "string" && brewedAtRaw
      ? new Date(brewedAtRaw)
      : null;

  const db = getDb();
  const [row] = await db
    .insert(brewNotes)
    .values({
      userId: session.user.id,
      beanSlug,
      methodId: typeof body?.methodId === "string" ? body.methodId : null,
      note: typeof body?.note === "string" ? body.note : "",
      rating: clampRating(body?.rating),
      brewedAt: brewedAt && !Number.isNaN(brewedAt.getTime()) ? brewedAt : null,
    })
    .returning();
  return NextResponse.json({ note: serializeNote(row) });
}
