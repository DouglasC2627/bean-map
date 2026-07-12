"use client";

import { useLocale, useTranslations } from "next-intl";
import { Share2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Props {
  /**
   * Locale-less, root-relative path (e.g. "/bean/ethiopia-yirgacheffe").
   * The current locale prefix and origin are added at click time.
   */
  path: string;
  /** Share sheet title (Web Share API). */
  title: string;
  /** Share sheet body text. */
  text: string;
  variant?: "default" | "compact";
  className?: string;
}

/**
 * Share control. Uses the native Web Share API where available (mobile),
 * otherwise falls back to copying the link to the clipboard with a toast.
 */
export function ShareButton({
  path,
  title,
  text,
  variant = "default",
  className,
}: Props) {
  const t = useTranslations("share");
  const locale = useLocale();

  const onClick = async () => {
    const origin =
      typeof window !== "undefined" ? window.location.origin : "";
    const url = `${origin}/${locale}${path}`;

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title, text, url });
        return;
      } catch (err) {
        // User dismissed the share sheet — do nothing.
        if (err instanceof DOMException && err.name === "AbortError") return;
        // Any other failure falls through to the clipboard path.
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      toast.success(t("copied"));
    } catch {
      toast.error(t("copyFailed"));
    }
  };

  if (variant === "compact") {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label={t("share")}
        title={t("share")}
        className={cn(
          "inline-flex items-center justify-center rounded-md p-1 text-muted-foreground transition hover:text-roast-medium",
          className,
        )}
      >
        <Share2 className="h-4 w-4" />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs text-muted-foreground transition hover:border-roast-medium hover:text-foreground",
        className,
      )}
    >
      <Share2 className="h-3 w-3" />
      {t("share")}
    </button>
  );
}
