"use client";

import { useLocale, useTranslations } from "next-intl";
import { Link2, Share2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Locale-less, root-relative path (e.g. "/bean/ethiopia-yirgacheffe"). */
  path: string;
  /** Content title (the brand is prepended for the share sheet + heading). */
  title: string;
  /** Share sheet body text. */
  text: string;
}

/** Share menu: copy the link, or open the native share sheet. */
export function ShareDialog({ open, onOpenChange, path, title, text }: Props) {
  const t = useTranslations("share");
  const locale = useLocale();

  const brandedTitle = title.startsWith("BeanMap")
    ? title
    : `BeanMap · ${title}`;

  const buildUrl = () => {
    const origin =
      typeof window !== "undefined" ? window.location.origin : "";
    return `${origin}/${locale}${path}`;
  };

  const canNativeShare =
    typeof navigator !== "undefined" && typeof navigator.share === "function";

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(buildUrl());
      toast.success(t("copied"));
      onOpenChange(false);
    } catch {
      toast.error(t("copyFailed"));
    }
  };

  const onNativeShare = async () => {
    try {
      await navigator.share({ title: brandedTitle, text, url: buildUrl() });
      onOpenChange(false);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      // Fall back to copying if the native sheet failed for another reason.
      await onCopy();
    }
  };

  const rowClass =
    "inline-flex items-center gap-2.5 rounded-md border border-border px-3 py-2.5 text-sm font-medium transition hover:border-roast-medium hover:bg-muted";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{t("share")}</DialogTitle>
          <DialogDescription>{brandedTitle}</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          <button type="button" onClick={onCopy} className={rowClass}>
            <Link2 className="h-4 w-4" />
            {t("copyLink")}
          </button>
          {canNativeShare && (
            <button type="button" onClick={onNativeShare} className={rowClass}>
              <Share2 className="h-4 w-4" />
              {t("shareVia")}
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
