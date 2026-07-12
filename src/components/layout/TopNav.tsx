"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Menu, Search, X } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { LocaleSwitcher } from "@/components/layout/LocaleSwitcher";
import { UserMenu } from "@/components/layout/UserMenu";
import { useSearchUi } from "@/components/shared/SearchCommand";
import { cn } from "@/lib/utils";

export function TopNav() {
  const t = useTranslations("nav");
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
      <div className="mx-auto grid h-full max-w-screen-2xl grid-cols-[1fr_auto_1fr] items-center gap-2 px-4">
        <Link href="/" className="flex items-center gap-2 justify-self-start">
          <Image
            src="/logo.png"
            alt={t("logoAlt")}
            width={24}
            height={24}
            className="h-6 w-6"
            priority
          />
          <span className="font-display text-lg tracking-tight">BeanMap</span>
        </Link>

        <div className="flex items-center justify-self-center">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="hidden items-center gap-2 rounded-md border border-border bg-surface/60 px-3 py-1.5 text-sm text-muted-foreground hover:border-roast-medium md:inline-flex"
            aria-label={t("searchBeans")}
          >
            <Search className="h-4 w-4" />
            <span>{t("searchPlaceholder")}</span>
            <kbd className="ml-2 rounded bg-parchment px-1.5 py-0.5 text-[10px] font-mono text-roast-dark dark:bg-roast-dark dark:text-parchment">
              ⌘K
            </kbd>
          </button>
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label={t("search")}
            className="rounded-md p-1.5 text-muted-foreground hover:text-foreground md:hidden"
          >
            <Search className="h-4 w-4" />
          </button>
        </div>

        <nav className="flex items-center gap-3 justify-self-end">
          <Link
            href="/"
            className="hidden rounded-md px-2 py-1 text-sm whitespace-nowrap hover:text-roast-medium sm:inline-block"
          >
            {t("explore")}
          </Link>
          <Link
            href="/beans"
            className="hidden rounded-md px-2 py-1 text-sm whitespace-nowrap hover:text-roast-medium sm:inline-block"
          >
            {t("beans")}
          </Link>
          <Link
            href="/explore/insights"
            className="hidden rounded-md px-2 py-1 text-sm whitespace-nowrap hover:text-roast-medium md:inline-block"
          >
            {t("insights")}
          </Link>
          <Link
            href="/explore/flavors"
            className="hidden rounded-md px-2 py-1 text-sm whitespace-nowrap hover:text-roast-medium lg:inline-block"
          >
            {t("flavors")}
          </Link>
          <Link
            href="/learn"
            className="hidden rounded-md px-2 py-1 text-sm whitespace-nowrap hover:text-roast-medium lg:inline-block"
          >
            {t("learn")}
          </Link>
          <LocaleSwitcher />
          <ThemeToggle />
          <UserMenu />

          <div ref={menuRef} className="relative sm:hidden">
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label={menuOpen ? t("closeMenu") : t("openMenu")}
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
                {t("explore")}
              </Link>
              <Link
                href="/beans"
                onClick={closeMenu}
                className="block rounded-md px-3 py-2 text-sm hover:bg-parchment/60 dark:hover:bg-roast-dark/40"
                role="menuitem"
              >
                {t("beans")}
              </Link>
              <Link
                href="/explore/insights"
                onClick={closeMenu}
                className="block rounded-md px-3 py-2 text-sm hover:bg-parchment/60 dark:hover:bg-roast-dark/40"
                role="menuitem"
              >
                {t("insights")}
              </Link>
              <Link
                href="/explore/flavors"
                onClick={closeMenu}
                className="block rounded-md px-3 py-2 text-sm hover:bg-parchment/60 dark:hover:bg-roast-dark/40"
                role="menuitem"
              >
                {t("flavors")}
              </Link>
              <Link
                href="/learn"
                onClick={closeMenu}
                className="block rounded-md px-3 py-2 text-sm hover:bg-parchment/60 dark:hover:bg-roast-dark/40"
                role="menuitem"
              >
                {t("learn")}
              </Link>
            </div>
          </div>
        </nav>
      </div>
    </header>
  );
}
