"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { Pencil, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { useAuthDialog } from "@/store/auth-dialog";
import type { BrewNote, MethodOption } from "@/lib/notes-types";
import { BrewNoteForm } from "./BrewNoteForm";
import { DeleteNoteDialog } from "./DeleteNoteDialog";

interface Props {
  beans: Array<{ slug: string; name: string }>;
  methods: MethodOption[];
}

/** Personal brewing journal — every note across all beans, edit/delete inline. */
export function NotesJournal({ beans, methods }: Props) {
  const t = useTranslations("notes");
  const tn = useTranslations("brewNotes");
  const { status } = useSession();
  const openSignIn = useAuthDialog((s) => s.setOpen);
  const [notes, setNotes] = useState<BrewNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<BrewNote | null>(null);
  const [deleting, setDeleting] = useState(false);

  const beanName = (slug: string) =>
    beans.find((b) => b.slug === slug)?.name ?? slug;
  const methodName = (id: string | null) =>
    id ? (methods.find((m) => m.id === id)?.name ?? id) : null;

  const noteDate = (n: BrewNote) =>
    n.brewedAt ?? new Date(n.createdAt).toLocaleDateString();

  /** Identifies the note in the confirm dialog, in the row's own words. */
  const noteSummary = (n: BrewNote) =>
    [beanName(n.beanSlug), methodName(n.methodId), noteDate(n)]
      .filter(Boolean)
      .join(" · ");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/notes");
      if (res.ok) {
        const data = (await res.json()) as { notes?: BrewNote[] };
        setNotes(data.notes ?? []);
      }
    } catch {
      // leave list empty
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === "authenticated") void load();
    else if (status === "unauthenticated") setLoading(false);
  }, [status, load]);

  if (status === "loading" || (status === "authenticated" && loading)) {
    return (
      <p className="rounded-lg border border-dashed border-border p-12 text-center text-sm text-muted-foreground">
        {t("loading")}
      </p>
    );
  }

  if (status !== "authenticated") {
    return (
      <div className="rounded-lg border border-dashed border-border p-12 text-center">
        <p className="text-sm text-muted-foreground">{t("signInPrompt")}</p>
        <button
          type="button"
          onClick={() => openSignIn(true)}
          className="mt-4 rounded-md bg-roast-medium px-3 py-1.5 text-sm text-cream hover:bg-roast-dark"
        >
          {t("signInCta")}
        </button>
      </div>
    );
  }

  if (notes.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border p-12 text-center">
        <p className="text-sm text-muted-foreground">{t("empty")}</p>
        <Link
          href="/beans"
          className="mt-4 inline-block rounded-md bg-roast-medium px-3 py-1.5 text-sm text-cream hover:bg-roast-dark"
        >
          {t("emptyCta")}
        </Link>
      </div>
    );
  }

  const onSaved = (saved: BrewNote) => {
    setNotes((prev) => {
      const idx = prev.findIndex((n) => n.id === saved.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = saved;
        return copy;
      }
      return [saved, ...prev];
    });
    setEditingId(null);
  };

  // See BrewNotesSection: confirmed first, so the row goes on success only.
  const onConfirmDelete = async () => {
    if (!pendingDelete) return;
    const id = pendingDelete.id;
    setDeleting(true);
    try {
      const res = await fetch(`/api/notes/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(String(res.status));
      setNotes((prev) => prev.filter((n) => n.id !== id));
      toast.success(tn("deleted"));
    } catch {
      toast.error(tn("deleteFailed"));
    } finally {
      setDeleting(false);
      setPendingDelete(null);
    }
  };

  return (
    <>
      <ul className="space-y-3">
        {notes.map((n) =>
          editingId === n.id ? (
            <li key={n.id}>
              <BrewNoteForm
                beanSlug={n.beanSlug}
                methods={methods}
                initial={n}
                onSaved={onSaved}
                onCancel={() => setEditingId(null)}
              />
            </li>
          ) : (
            <li
              key={n.id}
              className="rounded-lg border border-border bg-surface/60 p-4"
            >
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                <Link
                  href={`/bean/${n.beanSlug}`}
                  className="font-medium hover:text-roast-medium"
                >
                  {beanName(n.beanSlug)}
                </Link>
                {methodName(n.methodId) && (
                  <span className="text-muted-foreground">
                    {methodName(n.methodId)}
                  </span>
                )}
                <span className="text-xs text-muted-foreground">
                  {noteDate(n)}
                </span>
                {n.rating != null && (
                  <span
                    className="flex items-center gap-0.5"
                    aria-label={tn("stars", { n: n.rating })}
                  >
                    {Array.from({ length: 5 }, (_, i) => (
                      <Star
                        key={i}
                        className={cn(
                          "h-3.5 w-3.5",
                          i < n.rating!
                            ? "fill-roast-medium text-roast-medium"
                            : "text-muted-foreground/30",
                        )}
                      />
                    ))}
                  </span>
                )}
                <span className="ml-auto flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setEditingId(n.id)}
                    aria-label={tn("edit")}
                    className="rounded p-1 text-muted-foreground hover:text-roast-medium"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setPendingDelete(n)}
                    aria-label={tn("delete")}
                    className="rounded p-1 text-muted-foreground hover:text-wine-accent"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </span>
              </div>
              {n.note && (
                <p className="mt-2 text-sm whitespace-pre-wrap">{n.note}</p>
              )}
            </li>
          ),
        )}
      </ul>

      <DeleteNoteDialog
        note={
          pendingDelete
            ? { id: pendingDelete.id, summary: noteSummary(pendingDelete) }
            : null
        }
        pending={deleting}
        onCancel={() => setPendingDelete(null)}
        onConfirm={onConfirmDelete}
      />
    </>
  );
}
