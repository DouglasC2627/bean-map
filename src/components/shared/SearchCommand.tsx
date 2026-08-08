"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import type { SearchableBean } from "@/lib/search";
import { useSearchUi } from "./search-ui";

// Re-exported so existing importers (TopNav) keep working unchanged.
export { useSearchUi } from "./search-ui";

// The cmdk-based dialog (~40KB gzipped) is only pulled in once search is
// first opened, keeping it out of the initial bundle on every page.
const SearchCommandDialog = dynamic(
  () => import("./SearchCommandDialog").then((m) => m.SearchCommandDialog),
  { ssr: false },
);

interface Props {
  beans: SearchableBean[];
}

export function SearchCommand({ beans }: Props) {
  const open = useSearchUi((s) => s.open);
  const [mounted, setMounted] = useState(false);

  // ⌘K / Ctrl+K toggles search (lightweight listener, always active).
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

  // Mount (and thus fetch) the heavy dialog only after the first open.
  useEffect(() => {
    if (open) setMounted(true);
  }, [open]);

  if (!mounted) return null;
  return <SearchCommandDialog beans={beans} />;
}
