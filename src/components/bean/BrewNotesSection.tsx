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

  const methodName = (id: string | null) =>
    id ? (methods.find((m) => m.id === id)?.name ?? id) : null;

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

  const onDelete = async (id: string) => {
    const prev = notes;
    setNotes(notes.filter((n) => n.id !== id));
    try {
      const res = await fetch(`/api/notes/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(String(res.status));
      toast.success(t("deleted"));
    } catch {
      setNotes(prev);
      toast.error(t("deleteFailed"));
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
                  {n.brewedAt ??
                    new Date(n.createdAt).toLocaleDateString()}
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
                    onClick={() => onDelete(n.id)}
                    aria-label={t("delete")}
                    className="rounded p-1 text-muted-foreground hover:text-cherry-red"
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
    </section>
  );
}
