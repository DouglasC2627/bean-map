"use client";

import { useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { toPng } from "html-to-image";
import { Download, Link2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import type { BrewRecommendation, CoffeeBean } from "@/types";
import { formatBrewTime } from "@/lib/utils";

// Coffee palette, inlined as hex so html-to-image rasterizes reliably (Tailwind
// v4 oklch tokens / CSS variables don't always survive canvas serialization).
const BG_FROM = "#1A0F09";
const BG_TO = "#3B2314";
const CREAM = "#FAF6F1";
const TAN = "#D4C4A8";
const CHERRY = "#C1440E";
const SANS = "ui-sans-serif, system-ui, sans-serif";
const MONO = "ui-monospace, SFMono-Regular, Menlo, monospace";

interface Props {
  bean: CoffeeBean;
  recommendation: BrewRecommendation;
  methodName: string;
}

/** Standalone visual card + share actions (copy recipe link, download PNG). */
export function ShareRecipeCard({ bean, recommendation: rec, methodName }: Props) {
  const t = useTranslations("recipeCard");
  const tShare = useTranslations("share");
  const locale = useLocale();
  const cardRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

  const onCopyLink = async () => {
    const origin =
      typeof window !== "undefined" ? window.location.origin : "";
    const url = `${origin}/${locale}/bean/${bean.slug}/recipe/${rec.methodId}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success(tShare("copied"));
    } catch {
      toast.error(tShare("copyFailed"));
    }
  };

  const onDownload = async () => {
    if (!cardRef.current) return;
    setDownloading(true);
    try {
      const dataUrl = await toPng(cardRef.current, {
        pixelRatio: 2,
        cacheBust: true,
      });
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `beanmap-${bean.slug}-${rec.methodId}.png`;
      a.click();
    } catch {
      toast.error(t("downloadFailed"));
    } finally {
      setDownloading(false);
    }
  };

  const params: Array<{ label: string; value: string }> = [
    { label: t("grind"), value: `~${rec.grindMicrons}μm` },
    { label: t("temp"), value: `${rec.waterTempC}°C` },
    { label: t("ratio"), value: rec.ratio },
    { label: t("time"), value: formatBrewTime(rec.brewSeconds) },
  ];

  return (
    <div>
      <div
        ref={cardRef}
        style={{
          width: "100%",
          borderRadius: 16,
          padding: 28,
          backgroundImage: `linear-gradient(135deg, ${BG_FROM}, ${BG_TO})`,
          color: CREAM,
          fontFamily: SANS,
        }}
      >
        <div style={{ fontSize: 14, letterSpacing: 1, color: TAN }}>
          ☕ BeanMap · {t("badge")}
        </div>
        <div style={{ marginTop: 14, fontSize: 30, fontWeight: 700 }}>
          {methodName}
        </div>
        <div style={{ marginTop: 4, fontSize: 16, color: TAN }}>
          {bean.name} · {bean.country}
        </div>
        <div
          style={{
            marginTop: 20,
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 10,
          }}
        >
          {params.map((p) => (
            <div
              key={p.label}
              style={{
                padding: "12px 14px",
                borderRadius: 10,
                border: `1px solid ${TAN}`,
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  textTransform: "uppercase",
                  letterSpacing: 1,
                  color: TAN,
                }}
              >
                {p.label}
              </div>
              <div
                style={{
                  marginTop: 4,
                  fontSize: 20,
                  fontWeight: 700,
                  color: CHERRY,
                  fontFamily: MONO,
                }}
              >
                {p.value}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={onCopyLink}
          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-md border border-border px-3 py-2 text-sm text-muted-foreground transition hover:border-roast-medium hover:text-foreground"
        >
          <Link2 className="h-4 w-4" />
          {t("copyLink")}
        </button>
        <button
          type="button"
          onClick={onDownload}
          disabled={downloading}
          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-md bg-roast-medium px-3 py-2 text-sm text-cream transition hover:bg-roast-dark disabled:opacity-60"
        >
          <Download className="h-4 w-4" />
          {downloading ? t("downloading") : t("downloadPng")}
        </button>
      </div>
    </div>
  );
}

/** Dialog wrapper used by the brew detail modal's "Share recipe" button. */
export function ShareRecipeDialog({
  open,
  onOpenChange,
  bean,
  recommendation,
  methodName,
}: Props & { open: boolean; onOpenChange: (open: boolean) => void }) {
  const t = useTranslations("recipeCard");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("subtitle")}</DialogDescription>
        </DialogHeader>
        <ShareRecipeCard
          bean={bean}
          recommendation={recommendation}
          methodName={methodName}
        />
      </DialogContent>
    </Dialog>
  );
}
