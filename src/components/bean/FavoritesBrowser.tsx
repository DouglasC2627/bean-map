"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import { Download, Heart } from "lucide-react";
import type { CoffeeBean, FlavorNotesData } from "@/types";
import { Link } from "@/i18n/navigation";
import { useFavorites } from "@/store/favorites";
import { useAuthDialog } from "@/store/auth-dialog";
import { BeanCard } from "./BeanCard";

type SortKey = "dateAdded" | "name" | "region";

interface Props {
  beans: CoffeeBean[];
  flavorNotes: FlavorNotesData;
}

export function FavoritesBrowser({ beans, flavorNotes }: Props) {
  const t = useTranslations("favoritesPage");
  const locale = useLocale();
  const { status } = useSession();
  const favorites = useFavorites((s) => s.favorites);
  const loaded = useFavorites((s) => s.loaded);
  const openSignIn = useAuthDialog((s) => s.setOpen);
  const [sortKey, setSortKey] = useState<SortKey>("dateAdded");

  const bySlug = useMemo(
    () => new Map(beans.map((b) => [b.slug, b])),
    [beans],
  );

  const items = useMemo(() => {
    const entries = Object.entries(favorites)
      .map(([slug, addedAt]) => ({ bean: bySlug.get(slug), addedAt }))
      .filter(
        (x): x is { bean: CoffeeBean; addedAt: number } => Boolean(x.bean),
      );
    entries.sort((a, b) => {
      switch (sortKey) {
        case "name":
          return a.bean.name.localeCompare(b.bean.name, locale);
        case "region":
          return (
            a.bean.country.localeCompare(b.bean.country, locale) ||
            a.bean.region.localeCompare(b.bean.region, locale)
          );
        case "dateAdded":
        default:
          return b.addedAt - a.addedAt;
      }
    });
    return entries.map((e) => e.bean);
  }, [favorites, bySlug, sortKey, locale]);

  const onExport = () => {
    const payload = Object.entries(favorites)
      .sort((a, b) => b[1] - a[1])
      .map(([slug, addedAt]) => ({ slug, addedAt }));
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "beanmap-favorites.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  // Signed out → prompt to sign in (favorites require an account).
  if (status !== "authenticated") {
    if (status === "loading") {
      return (
        <div className="rounded-lg border border-dashed border-border p-12 text-center text-sm text-muted-foreground">
          {t("loading")}
        </div>
      );
    }
    return (
      <div className="rounded-lg border border-dashed border-border p-12 text-center">
        <Heart className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
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

  if (!loaded) {
    return (
      <div className="rounded-lg border border-dashed border-border p-12 text-center text-sm text-muted-foreground">
        {t("loading")}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border p-12 text-center">
        <Heart className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
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

  return (
    <>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="text-sm text-muted-foreground">
          {t("count", { count: items.length })}
        </div>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
            {t("sortBy")}
            <select
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value as SortKey)}
              className="rounded-md border border-border bg-background px-2 py-1 text-xs text-foreground"
            >
              <option value="dateAdded">{t("sort.dateAdded")}</option>
              <option value="name">{t("sort.name")}</option>
              <option value="region">{t("sort.region")}</option>
            </select>
          </label>
          <button
            type="button"
            onClick={onExport}
            className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1.5 text-xs text-muted-foreground hover:border-roast-medium hover:text-foreground"
          >
            <Download className="h-3.5 w-3.5" />
            {t("export")}
          </button>
        </div>
      </div>
      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {items.map((bean, i) => (
          <BeanCard
            key={bean.id}
            bean={bean}
            flavorNotes={flavorNotes}
            index={i}
          />
        ))}
      </ul>
    </>
  );
}
