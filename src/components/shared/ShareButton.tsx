"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Share2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { ShareDialog } from "./ShareDialog";

interface Props {
  /**
   * Locale-less, root-relative path (e.g. "/bean/ethiopia-yirgacheffe").
   * The current locale prefix and origin are added at click time.
   */
  path: string;
  /** Content title (brand is prepended in the share menu). */
  title: string;
  /** Share sheet body text. */
  text: string;
  variant?: "default" | "compact";
  className?: string;
}

/**
 * Opens a small share menu: copy the link, or — on devices that support it —
 * the native share sheet.
 */
export function ShareButton({
  path,
  title,
  text,
  variant = "default",
  className,
}: Props) {
  const t = useTranslations("share");
  const [open, setOpen] = useState(false);

  return (
    <>
      {variant === "compact" ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={t("share")}
          title={t("share")}
          className={cn(
            "inline-flex items-center justify-center rounded-md p-1 text-muted-foreground transition hover:text-roast-medium",
            className,
          )}
        >
          <Share2 className="h-4 w-4" />
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={cn(
            "inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs text-muted-foreground transition hover:border-roast-medium hover:text-foreground",
            className,
          )}
        >
          <Share2 className="h-3 w-3" />
          {t("share")}
        </button>
      )}
      <ShareDialog
        open={open}
        onOpenChange={setOpen}
        path={path}
        title={title}
        text={text}
      />
    </>
  );
}
