"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { Pencil, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useAuthDialog } from "@/store/auth-dialog";
import type { BrewNote, MethodOption } from "@/lib/notes-types";
import { BrewNoteForm } from "@/components/brewing/BrewNoteForm";
import { DeleteNoteDialog } from "@/components/brewing/DeleteNoteDialog";

interface Props {
  beanSlug: string;
  methods: MethodOption[];
}

/**
 * Private, author-only brew-note timeline rendered as a client island on the
 * (statically generated) bean detail page. Fetches notes only when signed in.
 */
export function BrewNotesSection({ beanSlug, methods }: Props) {
  const t = useTranslations("brewNotes");
  const { status } = useSession();
  const openSignIn = useAuthDialog((s) => s.setOpen);
  const [notes, setNotes] = useState<BrewNote[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<BrewNote | null>(null);
  const [deleting, setDeleting] = useState(false);

  const methodName = (id: string | null) =>
    id ? (methods.find((m) => m.id === id)?.name ?? id) : null;

  const noteDate = (n: BrewNote) =>
    n.brewedAt ?? new Date(n.createdAt).toLocaleDateString();

  /** Identifies the note in the confirm dialog, in the row's own words. */
  const noteSummary = (n: BrewNote) =>
    [methodName(n.methodId), noteDate(n)].filter(Boolean).join(" · ");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/notes?beanSlug=${encodeURIComponent(beanSlug)}`,
      );
      if (res.ok) {
        const data = (await res.json()) as { notes?: BrewNote[] };
        setNotes(data.notes ?? []);
      }
    } catch {
      // leave the list as-is
    } finally {
      setLoading(false);
    }
  }, [beanSlug]);

  useEffect(() => {
    if (status === "authenticated") void load();
    else setNotes([]);
  }, [status, load]);

  if (status === "loading") return null;

  if (status !== "authenticated") {
    return (
      <section className="border-t border-border py-6">
        <h2 className="font-display text-xl">{t("title")}</h2>
        <div className="mt-3 rounded-lg border border-dashed border-border p-6 text-center">
          <p className="text-sm text-muted-foreground">{t("signInPrompt")}</p>
          <button
            type="button"
            onClick={() => openSignIn(true)}
            className="mt-3 rounded-md bg-roast-medium px-3 py-1.5 text-sm text-cream hover:bg-roast-dark"
          >
            {t("signInCta")}
          </button>
        </div>
      </section>
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

  // Confirmed in DeleteNoteDialog first, so the row is removed on success
  // rather than optimistically: the user has already waited for a dialog, and
  // a row that vanishes and springs back on failure reads as a second bug.
  const onConfirmDelete = async () => {
    if (!pendingDelete) return;
    const id = pendingDelete.id;
    setDeleting(true);
    try {
      const res = await fetch(`/api/notes/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(String(res.status));
      setNotes((prev) => prev.filter((n) => n.id !== id));
      toast.success(t("deleted"));
    } catch {
      toast.error(t("deleteFailed"));
    } finally {
      setDeleting(false);
      setPendingDelete(null);
    }
  };

  return (
    <section className="border-t border-border py-6">
      <h2 className="font-display text-xl">{t("title")}</h2>
      <p className="mt-0.5 text-xs text-muted-foreground">{t("private")}</p>

      <div className="mt-4">
        <BrewNoteForm beanSlug={beanSlug} methods={methods} onSaved={onSaved} />
      </div>

      <ul className="mt-4 space-y-3">
        {notes.map((n) =>
          editingId === n.id ? (
            <li key={n.id}>
              <BrewNoteForm
                beanSlug={beanSlug}
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
                {methodName(n.methodId) && (
                  <span className="font-medium">{methodName(n.methodId)}</span>
                )}
                <span className="text-xs text-muted-foreground">
                  {noteDate(n)}
                </span>
                {n.rating != null && (
                  <span className="flex items-center gap-0.5" aria-label={t("stars", { n: n.rating })}>
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
                    aria-label={t("edit")}
                    className="rounded p-1 text-muted-foreground hover:text-roast-medium"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setPendingDelete(n)}
                    aria-label={t("delete")}
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
        {notes.length === 0 && !loading && (
          <li className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            {t("empty")}
          </li>
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
    </section>
  );
}
