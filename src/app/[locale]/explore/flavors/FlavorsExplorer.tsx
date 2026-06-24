"use client";

import { useCallback, useMemo } from "react";
import { useTranslations } from "next-intl";
import { Crosshair } from "lucide-react";
import type { CoffeeBean, FlavorNotesData } from "@/types";
import { Link, useRouter } from "@/i18n/navigation";
import { useBeanMap, filterBeans } from "@/store";
import { FlavorWheelLazy } from "@/components/visualization/FlavorWheelLazy";
import { flavorNoteLabel, countryFlagEmoji } from "@/lib/utils";

interface Props {
  beans: CoffeeBean[];
  flavorNotes: FlavorNotesData;
}

interface SelectionPath {
  /** Most specific level chosen — what the user actually clicked. */
  level: "category" | "subcategory" | "note";
  categoryId: string;
  categoryName: string;
  categoryColor: string;
  subcategoryId?: string;
  subcategoryName?: string;
  noteId?: string;
  noteName?: string;
}

/**
 * Resolve a selected flavor id to its full hierarchy path. Prefers the deepest
 * match (note > subcategory > category) when ids overlap across levels.
 */
function resolveSelection(
  data: FlavorNotesData,
  id: string,
): SelectionPath | null {
  const note = data.notes.find((n) => n.id === id);
  if (note) {
    const sub = data.subcategories.find((s) => s.id === note.subcategoryId);
    const cat = sub
      ? data.categories.find((c) => c.id === sub.categoryId)
      : undefined;
    if (!sub || !cat) return null;
    return {
      level: "note",
      categoryId: cat.id,
      categoryName: cat.name,
      categoryColor: cat.color,
      subcategoryId: sub.id,
      subcategoryName: sub.name,
      noteId: note.id,
      noteName: note.name,
    };
  }
  const sub = data.subcategories.find((s) => s.id === id);
  if (sub) {
    const cat = data.categories.find((c) => c.id === sub.categoryId);
    if (!cat) return null;
    return {
      level: "subcategory",
      categoryId: cat.id,
      categoryName: cat.name,
      categoryColor: cat.color,
      subcategoryId: sub.id,
      subcategoryName: sub.name,
    };
  }
  const cat = data.categories.find((c) => c.id === id);
  if (cat) {
    return {
      level: "category",
      categoryId: cat.id,
      categoryName: cat.name,
      categoryColor: cat.color,
    };
  }
  return null;
}

export function FlavorsExplorer({ beans, flavorNotes }: Props) {
  const t = useTranslations("flavorsExplorer");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const {
    filters,
    setFlavorNotes,
    clearFlavorNotes,
    requestFitBounds,
  } = useBeanMap();
  const selectedIds = useMemo(
    () => new Set(filters.flavorNoteIds),
    [filters.flavorNoteIds],
  );
  const matching = useMemo(
    () => filterBeans(beans, filters, flavorNotes),
    [beans, filters, flavorNotes],
  );

  const selectionPath = useMemo<SelectionPath | null>(() => {
    const id = filters.flavorNoteIds[0];
    if (!id) return null;
    return resolveSelection(flavorNotes, id);
  }, [filters.flavorNoteIds, flavorNotes]);

  // Single-select: clicking the currently-selected segment clears the
  // selection; clicking anything else replaces it with just that id.
  const selectOne = useCallback(
    (id: string) => {
      if (selectedIds.size === 1 && selectedIds.has(id)) {
        clearFlavorNotes();
      } else {
        setFlavorNotes([id]);
      }
    },
    [selectedIds, setFlavorNotes, clearFlavorNotes],
  );

  const onShowOnMap = () => {
    requestFitBounds();
    router.push("/");
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_320px]">
        <div className="flex items-center justify-center">
          <FlavorWheelLazy
            beans={beans}
            flavorNotes={flavorNotes}
            size={560}
            selectedIds={selectedIds}
            onToggle={selectOne}
          />
        </div>

        <aside className="space-y-4">
          <section className="rounded-lg border border-border bg-surface/60 p-4">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t("beansMatching")}
            </h2>
            <p className="mt-1 font-display text-2xl">
              <span className="font-mono">{matching.length}</span>{" "}
              <span className="text-muted-foreground">
                {t("ofTotal", { total: beans.length })}
              </span>
            </p>

            {selectionPath ? (
              <>
                <div className="mt-4 border-t border-border pt-4">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {t("selection")}
                    </span>
                    <button
                      type="button"
                      onClick={clearFlavorNotes}
                      className="text-[10px] text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
                    >
                      {tCommon("clear")}
                    </button>
                  </div>
                  <ul className="space-y-1.5 text-sm">
                    <SelectionRow
                      label={t("category")}
                      value={selectionPath.categoryName}
                      swatchColor={selectionPath.categoryColor}
                      active={selectionPath.level === "category"}
                    />
                    {selectionPath.subcategoryName && (
                      <SelectionRow
                        label={t("subcategory")}
                        value={selectionPath.subcategoryName}
                        active={selectionPath.level === "subcategory"}
                      />
                    )}
                    {selectionPath.noteName && (
                      <SelectionRow
                        label={t("note")}
                        value={selectionPath.noteName}
                        active={selectionPath.level === "note"}
                      />
                    )}
                  </ul>
                </div>
              </>
            ) : (
              <p className="mt-3 text-xs text-muted-foreground">
                {t("clickToFilter")}
              </p>
            )}
          </section>

          <button
            type="button"
            onClick={onShowOnMap}
            disabled={matching.length === 0}
            className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-roast-medium px-3 py-2 text-sm text-cream hover:bg-roast-dark disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground"
          >
            <Crosshair className="h-4 w-4" />
            {t("showOnMap")}
          </button>
        </aside>
      </div>

      <section className="rounded-lg border border-border bg-surface/60 p-5">
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {selectedIds.size > 0
            ? t("matchingBeans", { count: matching.length })
            : t("allBeans", { count: beans.length })}
        </h2>
        {matching.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("noMatch")}</p>
        ) : (
          <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {matching.map((b) => (
              <li key={b.id}>
                <Link
                  href={`/?bean=${b.slug}`}
                  className="block rounded-md border border-border bg-background/60 p-2 transition hover:border-roast-medium"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-medium">
                      <span aria-hidden className="mr-1">
                        {countryFlagEmoji(b.countryCode)}
                      </span>
                      {b.name}
                    </span>
                  </div>
                  <div className="mt-0.5 truncate text-[10px] text-muted-foreground">
                    {b.flavorNotes
                      .slice(0, 3)
                      .map((id) => flavorNoteLabel(flavorNotes, id))
                      .join(" · ")}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-lg border border-border bg-surface/60 p-5" id="about">
        <h2 className="font-display text-xl">{t("aboutHeading")}</h2>
        <div className="mt-2 space-y-3 text-sm leading-relaxed">
          <p>
            {t.rich("aboutP1", {
              strong: (chunks) => <strong>{chunks}</strong>,
            })}
          </p>
          <p>{t("aboutP2")}</p>
          <p>{t("aboutP3")}</p>
        </div>
      </section>
    </div>
  );
}

function SelectionRow({
  label,
  value,
  active,
  swatchColor,
}: {
  label: string;
  value: string;
  active: boolean;
  swatchColor?: string;
}) {
  return (
    <li className="flex items-baseline justify-between gap-3">
      <div className="flex items-center gap-2">
        {swatchColor && (
          <span
            aria-hidden
            className="inline-block h-2.5 w-2.5 rounded-full border border-border"
            style={{ background: swatchColor }}
          />
        )}
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
      </div>
      <span
        className={
          active
            ? "text-right font-medium text-foreground"
            : "text-right text-muted-foreground"
        }
      >
        {value}
      </span>
    </li>
  );
}
