import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { auth } from "@/auth";
import { getDb, isDbConfigured } from "@/db";
import { favorites } from "@/db/schema";

/** DELETE /api/favorites/[beanSlug] — remove a favorite for the signed-in user. */
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ beanSlug: string }> },
) {
  if (!isDbConfigured()) {
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  }
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { beanSlug } = await params;
  const db = getDb();
  await db
    .delete(favorites)
    .where(
      and(
        eq(favorites.userId, session.user.id),
        eq(favorites.beanSlug, beanSlug),
      ),
    );
  return NextResponse.json({ ok: true });
}
