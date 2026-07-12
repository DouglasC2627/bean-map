"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Star } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { BrewNote, MethodOption } from "@/lib/notes-types";

interface Props {
  beanSlug: string;
  methods: MethodOption[];
  /** When provided, the form edits this note instead of creating a new one. */
  initial?: BrewNote;
  onSaved: (note: BrewNote) => void;
  onCancel?: () => void;
}

export function BrewNoteForm({
  beanSlug,
  methods,
  initial,
  onSaved,
  onCancel,
}: Props) {
  const t = useTranslations("brewNotes");
  const [methodId, setMethodId] = useState(initial?.methodId ?? "");
  const [rating, setRating] = useState<number>(initial?.rating ?? 0);
  const [brewedAt, setBrewedAt] = useState(initial?.brewedAt ?? "");
  const [note, setNote] = useState(initial?.note ?? "");
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        beanSlug,
        methodId: methodId || null,
        rating: rating || null,
        brewedAt: brewedAt || null,
        note,
      };
      const res = initial
        ? await fetch(`/api/notes/${initial.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await fetch("/api/notes", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
      if (!res.ok) throw new Error(String(res.status));
      const data = (await res.json()) as { note: BrewNote };
      onSaved(data.note);
      toast.success(initial ? t("updated") : t("saved"));
      if (!initial) {
        setNote("");
        setRating(0);
        setBrewedAt("");
        setMethodId("");
      }
    } catch {
      toast.error(t("saveFailed"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form
      onSubmit={submit}
      className="space-y-3 rounded-lg border border-border bg-surface/60 p-4"
    >
      <div className="flex flex-wrap items-end gap-4">
        <label className="flex flex-col gap-1 text-xs text-muted-foreground">
          {t("method")}
          <select
            value={methodId}
            onChange={(e) => setMethodId(e.target.value)}
            className="rounded-md border border-border bg-background px-2 py-1.5 text-sm text-foreground"
          >
            <option value="">{t("noMethod")}</option>
            {methods.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-xs text-muted-foreground">
          {t("brewedOn")}
          <input
            type="date"
            value={brewedAt}
            onChange={(e) => setBrewedAt(e.target.value)}
            className="rounded-md border border-border bg-background px-2 py-1.5 text-sm text-foreground"
          />
        </label>

        <div className="flex flex-col gap-1 text-xs text-muted-foreground">
          {t("rating")}
          <div
            className="flex items-center gap-0.5"
            role="radiogroup"
            aria-label={t("rating")}
          >
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setRating(rating === n ? 0 : n)}
                aria-label={t("stars", { n })}
                aria-pressed={n <= rating}
                className="p-0.5"
              >
                <Star
                  className={cn(
                    "h-5 w-5 transition",
                    n <= rating
                      ? "fill-roast-medium text-roast-medium"
                      : "text-muted-foreground/40 hover:text-roast-medium",
                  )}
                />
              </button>
            ))}
          </div>
        </div>
      </div>

      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder={t("notePlaceholder")}
        rows={3}
        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground"
      />

      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={saving}
          className="rounded-md bg-roast-medium px-3 py-1.5 text-sm text-cream hover:bg-roast-dark disabled:opacity-60"
        >
          {saving ? t("saving") : initial ? t("update") : t("add")}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md border border-border px-3 py-1.5 text-sm text-muted-foreground hover:border-roast-medium hover:text-foreground"
          >
            {t("cancel")}
          </button>
        )}
      </div>
    </form>
  );
}
