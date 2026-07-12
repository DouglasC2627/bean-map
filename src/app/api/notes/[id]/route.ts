import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { auth } from "@/auth";
import { getDb, isDbConfigured } from "@/db";
import { brewNotes } from "@/db/schema";
import { serializeNote } from "../route";

function clampRating(v: unknown): number | null {
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n)) return null;
  return Math.max(1, Math.min(5, Math.round(n)));
}

/** PATCH /api/notes/[id] — update a brew note owned by the signed-in user. */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!isDbConfigured()) {
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  }
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const body = (await req.json().catch(() => null)) as Record<
    string,
    unknown
  > | null;
  if (!body) {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const patch: Record<string, unknown> = { updatedAt: new Date() };
  if (typeof body.note === "string") patch.note = body.note;
  if ("methodId" in body)
    patch.methodId = typeof body.methodId === "string" ? body.methodId : null;
  if ("rating" in body) patch.rating = clampRating(body.rating);
  if ("brewedAt" in body) {
    const d =
      typeof body.brewedAt === "string" && body.brewedAt
        ? new Date(body.brewedAt)
        : null;
    patch.brewedAt = d && !Number.isNaN(d.getTime()) ? d : null;
  }

  const db = getDb();
  const [row] = await db
    .update(brewNotes)
    .set(patch)
    .where(and(eq(brewNotes.id, id), eq(brewNotes.userId, session.user.id)))
    .returning();
  if (!row) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  return NextResponse.json({ note: serializeNote(row) });
}

/** DELETE /api/notes/[id] — delete a brew note owned by the signed-in user. */
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!isDbConfigured()) {
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  }
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const db = getDb();
  await db
    .delete(brewNotes)
    .where(and(eq(brewNotes.id, id), eq(brewNotes.userId, session.user.id)));
  return NextResponse.json({ ok: true });
}
