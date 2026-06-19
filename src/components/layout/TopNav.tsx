"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, Search, X } from "lucide-react";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { useSearchUi } from "@/components/shared/SearchCommand";
import { cn } from "@/lib/utils";

export function TopNav() {
  const setOpen = useSearchUi((s) => s.setOpen);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const closeMenu = () => setMenuOpen(false);

  useEffect(() => {
    if (!menuOpen) return;
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  return (
    <header className="sticky top-0 z-40 h-14 shrink-0 border-b border-border bg-background/70 backdrop-blur-md">
      <div className="mx-auto grid h-full max-w-screen-2xl grid-cols-[1fr_auto_1fr] items-center px-4">
        <Link href="/" className="flex items-center gap-2 justify-self-start">
          <Image
            src="/logo.png"
            alt="BeanMap logo"
            width={24}
            height={24}
            className="h-6 w-6"
            priority
          />
          <span className="font-display text-lg tracking-tight">BeanMap</span>
        </Link>

        <button
          type="button"
          onClick={() => setOpen(true)}
          className="hidden items-center gap-2 rounded-md border border-border bg-surface/60 px-3 py-1.5 text-sm text-muted-foreground justify-self-center hover:border-roast-medium md:inline-flex"
          aria-label="Search beans"
        >
          <Search className="h-4 w-4" />
          <span>Search beans…</span>
          <kbd className="ml-2 rounded bg-parchment px-1.5 py-0.5 text-[10px] font-mono text-roast-dark dark:bg-roast-dark dark:text-parchment">
            ⌘K
          </kbd>
        </button>

        <nav className="flex items-center gap-3 justify-self-end">
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Search"
            className="rounded-md p-1.5 text-muted-foreground hover:text-foreground md:hidden"
          >
            <Search className="h-4 w-4" />
          </button>
          <Link
            href="/"
            className="hidden rounded-md px-2 py-1 text-sm hover:text-roast-medium sm:inline-block"
          >
            Explore
          </Link>
          <Link
            href="/beans"
            className="hidden rounded-md px-2 py-1 text-sm hover:text-roast-medium sm:inline-block"
          >
            Beans
          </Link>
          <Link
            href="/explore/insights"
            className="hidden rounded-md px-2 py-1 text-sm hover:text-roast-medium sm:inline-block"
          >
            Insights
          </Link>
          <Link
            href="/explore/flavors"
            className="hidden rounded-md px-2 py-1 text-sm hover:text-roast-medium md:inline-block"
          >
            Flavors
          </Link>
          <Link
            href="/learn"
            className="hidden rounded-md px-2 py-1 text-sm hover:text-roast-medium md:inline-block"
          >
            Learn
          </Link>
          <ThemeToggle />

          <div ref={menuRef} className="relative sm:hidden">
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
              className="rounded-md p-1.5 text-muted-foreground hover:text-foreground"
            >
              {menuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
            <div
              className={cn(
                "absolute right-0 top-full mt-2 w-44 origin-top-right rounded-md border border-border bg-background/95 p-1 shadow-lg backdrop-blur-md transition",
                menuOpen
                  ? "pointer-events-auto scale-100 opacity-100"
                  : "pointer-events-none scale-95 opacity-0",
              )}
              role="menu"
            >
              <Link
                href="/"
                onClick={closeMenu}
                className="block rounded-md px-3 py-2 text-sm hover:bg-parchment/60 dark:hover:bg-roast-dark/40"
                role="menuitem"
              >
                Explore
              </Link>
              <Link
                href="/beans"
                onClick={closeMenu}
                className="block rounded-md px-3 py-2 text-sm hover:bg-parchment/60 dark:hover:bg-roast-dark/40"
                role="menuitem"
              >
                Beans
              </Link>
              <Link
                href="/explore/insights"
                onClick={closeMenu}
                className="block rounded-md px-3 py-2 text-sm hover:bg-parchment/60 dark:hover:bg-roast-dark/40"
                role="menuitem"
              >
                Insights
              </Link>
              <Link
                href="/explore/flavors"
                onClick={closeMenu}
                className="block rounded-md px-3 py-2 text-sm hover:bg-parchment/60 dark:hover:bg-roast-dark/40"
                role="menuitem"
              >
                Flavors
              </Link>
              <Link
                href="/learn"
                onClick={closeMenu}
                className="block rounded-md px-3 py-2 text-sm hover:bg-parchment/60 dark:hover:bg-roast-dark/40"
                role="menuitem"
              >
                Learn
              </Link>
            </div>
          </div>
        </nav>
      </div>
    </header>
  );
}
