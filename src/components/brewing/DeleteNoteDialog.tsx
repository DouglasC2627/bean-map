"use client";

import { useTranslations } from "next-intl";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/**
 * Confirmation step for deleting a brew note.
 *
 * Brew notes are the one thing on BeanMap that a visitor authored and that
 * nothing else can reconstruct — a mis-tapped trash icon loses a tasting note
 * for good, since the DELETE is immediate and there is no undo. Hence a
 * confirm rather than an undo toast.
 *
 * Shared by the bean-page timeline and the journal so the two delete paths
 * can't drift apart. Rendered by the parent, which owns "which note is
 * pending" — `note === null` is the closed state.
 */
interface Props {
  /** The note awaiting confirmation; `null` closes the dialog. */
  note: { id: string; summary: string } | null;
  /** Whether the DELETE request is in flight. */
  pending?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function DeleteNoteDialog({
  note,
  pending = false,
  onCancel,
  onConfirm,
}: Props) {
  const t = useTranslations("brewNotes");

  return (
    <Dialog
      open={note !== null}
      onOpenChange={(open) => {
        // Never close mid-request: the parent removes the row optimistically
        // on confirm and needs to keep the dialog's pending state coherent.
        if (!open && !pending) onCancel();
      }}
    >
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{t("confirmTitle")}</DialogTitle>
          <DialogDescription>{t("confirmBody")}</DialogDescription>
        </DialogHeader>

        {/* Which note, in the same words the row uses — the dialog covers the
            list, so without this there is nothing left on screen to check. */}
        {note?.summary && (
          <p className="rounded-md border border-border bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
            {note.summary}
          </p>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onCancel} disabled={pending}>
            {t("cancel")}
          </Button>
          <Button
            onClick={onConfirm}
            disabled={pending}
            // Wine red. `--wine` is the fill token, deep in both themes, so
            // cream text works throughout (8.9:1 light, 6.1:1 dark).
            className="bg-wine text-cream hover:bg-wine/90 focus-visible:border-wine focus-visible:ring-wine/30"
          >
            <Trash2 />
            {pending ? t("deleting") : t("confirmCta")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
