"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { create } from "zustand";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  createBeanSearch,
  getRecentSearches,
  pushRecentSearch,
  removeRecentSearch,
  clearAllRecentSearches,
} from "@/lib/search";
import { useBeanMap } from "@/store";
import { countryFlagEmoji, flavorNoteLabel } from "@/lib/utils";
import type { CoffeeBean, FlavorNotesData } from "@/types";

interface SearchUiStore {
  open: boolean;
  setOpen: (v: boolean) => void;
}

export const useSearchUi = create<SearchUiStore>((set) => ({
  open: false,
  setOpen: (open) => set({ open }),
}));

interface Props {
  beans: CoffeeBean[];
  flavorNotes: FlavorNotesData;
}

const RECENTS_LISTENERS = new Set<() => void>();
function subscribeRecents(cb: () => void) {
  RECENTS_LISTENERS.add(cb);
  return () => {
    RECENTS_LISTENERS.delete(cb);
  };
}
function notifyRecentsChanged() {
  RECENTS_LISTENERS.forEach((cb) => cb());
}
function getRecentsSnapshot() {
  return getRecentSearches().join(",");
}

/**
 * Where a search result should take the user, decided by the current route:
 * - "map": select the bean and fly the map to it (Explore / map view).
 * - "locate": scroll to and highlight the bean's row/card on this page
 *   (Beans, Insights).
 * - "navigate": no in-page target here, so open the map focused on the bean.
 */
type SearchMode = "map" | "locate" | "navigate";

function modeForPath(pathname: string): SearchMode {
  if (pathname === "/") return "map";
  if (pathname.startsWith("/beans") || pathname.startsWith("/explore/insights"))
    return "locate";
  return "navigate";
}

export function SearchCommand({ beans, flavorNotes }: Props) {
  const t = useTranslations("search");
  const { open, setOpen } = useSearchUi();
  const [query, setQuery] = useState("");
  const pathname = usePathname();
  const router = useRouter();
  const mode = modeForPath(pathname);

  const recentsKey = useSyncExternalStore(
    subscribeRecents,
    getRecentsSnapshot,
    () => "",
  );
  const recentIds = useMemo(
    () => (recentsKey ? recentsKey.split(",").filter(Boolean) : []),
    [recentsKey],
  );

  const fuse = useMemo(
    () => createBeanSearch(beans, flavorNotes),
    [beans, flavorNotes],
  );

  // Cmd/Ctrl + K toggles
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        useSearchUi.getState().setOpen(!useSearchUi.getState().open);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const results = useMemo(() => {
    if (!query.trim()) return [];
    return fuse.search(query, { limit: 12 }).map((r) => r.item);
  }, [fuse, query]);

  const recents = useMemo(
    () =>
      recentIds
        .map((id) => beans.find((b) => b.id === id))
        .filter((b): b is CoffeeBean => Boolean(b)),
    [recentIds, beans],
  );

  const onSelect = (bean: CoffeeBean) => {
    pushRecentSearch(bean.id);
    notifyRecentsChanged();
    setOpen(false);
    setQuery("");

    if (mode === "locate") {
      useBeanMap.getState().requestLocate(bean.id);
    } else if (mode === "navigate") {
      router.push(`/?bean=${bean.slug}`);
    } else {
      useBeanMap.getState().selectBean(bean.id);
      useBeanMap.getState().requestFlyTo(bean.coordinates, 5);
    }
  };

  const onRemoveRecent = (e: React.MouseEvent, beanId: string) => {
    e.preventDefault();
    e.stopPropagation();
    removeRecentSearch(beanId);
    notifyRecentsChanged();
  };

  const onClearAll = () => {
    clearAllRecentSearches();
    notifyRecentsChanged();
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput
        placeholder={
          mode === "locate"
            ? t("placeholderLocate")
            : t("placeholderGlobal")
        }
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        {!query.trim() && recents.length > 0 && (
          <CommandGroup heading={t("recentHeading")}>
            <div className="flex justify-end px-2 pb-1">
              <button
                onClick={onClearAll}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                {t("clearAll")}
              </button>
            </div>
            {recents.map((bean) => (
              <CommandItem
                key={bean.id}
                value={`recent-${bean.id}`}
                onSelect={() => onSelect(bean)}
                className="my-1"
              >
                <BeanRow bean={bean} flavorNotes={flavorNotes} />
                <button
                  onClick={(e) => onRemoveRecent(e, bean.id)}
                  aria-label={t("removeRecent")}
                  className="ml-auto text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  ✕
                </button>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {query.trim() && results.length === 0 && (
          <CommandEmpty>{t("noMatches")}</CommandEmpty>
        )}

        {results.length > 0 && (
          <CommandGroup heading={t("beansHeading")}>
            {results.map((bean) => (
              <CommandItem
                key={bean.id}
                value={`${bean.name} ${bean.country} ${bean.region}`}
                onSelect={() => onSelect(bean)}
                className="my-1"
              >
                <BeanRow bean={bean} flavorNotes={flavorNotes} />
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}

function BeanRow({
  bean,
  flavorNotes,
}: {
  bean: CoffeeBean;
  flavorNotes: FlavorNotesData;
}) {
  return (
    <div className="flex w-full items-center gap-2">
      <span aria-hidden className="flag text-base leading-none">
        {countryFlagEmoji(bean.countryCode)}
      </span>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium">{bean.name}</div>
        <div className="truncate text-xs text-muted-foreground">
          {bean.region} ·{" "}
          {bean.flavorNotes
            .slice(0, 2)
            .map((id) => flavorNoteLabel(flavorNotes, id))
            .join(" · ")}
        </div>
      </div>
    </div>
  );
}
