"use client";

import { useCallback, useMemo } from "react";
import { X } from "lucide-react";
import type { CoffeeBean, FlavorNotesData } from "@/types";
import { useBeanMap } from "@/store";
import { FlavorWheelLazy } from "@/components/visualization/FlavorWheelLazy";

interface Props {
  beans: CoffeeBean[];
  flavorNotes: FlavorNotesData;
}

export function FlavorWheelOverlay({ beans, flavorNotes }: Props) {
  const {
    isFlavorWheelOpen,
    setFlavorWheelOpen,
    filters,
    setFlavorNotes,
    clearFlavorNotes,
  } = useBeanMap();

  const selectedIds = useMemo(
    () => new Set(filters.flavorNoteIds),
    [filters.flavorNoteIds],
  );
  const selectionCount = filters.flavorNoteIds.length;

  // Single-select: clicking the currently-selected segment clears the
  // selection; clicking anything else replaces the selection with just that id.
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

  if (!isFlavorWheelOpen) return null;

  return (
    <div className="fixed right-3 top-18 z-40 w-[min(360px,calc(100vw-1.5rem))] rounded-lg border border-border bg-background/95 p-3 shadow-xl backdrop-blur">
      <div className="mb-1 flex items-center justify-between">
        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Flavor wheel
        </div>
        <div className="flex items-center gap-1">
          {selectionCount > 0 && (
            <button
              type="button"
              onClick={clearFlavorNotes}
              className="text-[10px] text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
            >
              Clear
            </button>
          )}
          <button
            type="button"
            onClick={() => setFlavorWheelOpen(false)}
            aria-label="Close flavor wheel"
            className="rounded-md p-1 text-muted-foreground hover:bg-parchment hover:text-foreground dark:hover:bg-roast-dark"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div className="flex items-center justify-center">
        <FlavorWheelLazy
          beans={beans}
          flavorNotes={flavorNotes}
          size={300}
          selectedIds={selectedIds}
          onToggle={selectOne}
          compactCenter
        />
      </div>
      <p className="mt-1 text-center text-[10px] text-muted-foreground">
        Click any segment to filter the map.
      </p>
    </div>
  );
}
