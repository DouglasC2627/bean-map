"use client";

import { useEffect, useRef, useState } from "react";
import { signOut, useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { LogOut, NotebookPen, User as UserIcon } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { useAuthDialog } from "@/store/auth-dialog";
import { cn } from "@/lib/utils";

export function UserMenu() {
  const t = useTranslations("auth");
  const { data: session, status } = useSession();
  const openSignIn = useAuthDialog((s) => s.setOpen);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

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

  // Reserve the slot while the session resolves to avoid layout shift.
  if (status === "loading") {
    return <div className="size-7" aria-hidden />;
  }

  // Signed out: a default-avatar button that opens the sign-in dialog.
  if (!session?.user) {
    return (
      <button
        type="button"
        onClick={() => openSignIn(true)}
        aria-label={t("signIn")}
        title={t("signIn")}
        className="flex size-7 items-center justify-center rounded-full border border-border bg-surface text-muted-foreground hover:border-roast-medium hover:text-foreground"
      >
        <UserIcon className="h-4 w-4" />
      </button>
    );
  }

  const user = session.user;
  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setMenuOpen((v) => !v)}
        aria-label={t("account")}
        aria-expanded={menuOpen}
        className="flex size-7 items-center justify-center overflow-hidden rounded-full border border-border bg-surface text-muted-foreground hover:border-roast-medium"
      >
        {user.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={user.image}
            alt=""
            className="size-7 rounded-full object-cover"
            referrerPolicy="no-referrer"
          />
        ) : (
          <UserIcon className="h-4 w-4" />
        )}
      </button>
      <div
        className={cn(
          "absolute right-0 top-full mt-2 w-52 origin-top-right rounded-md border border-border bg-background/95 p-1 shadow-lg backdrop-blur-md transition",
          menuOpen
            ? "pointer-events-auto scale-100 opacity-100"
            : "pointer-events-none scale-95 opacity-0",
        )}
        role="menu"
      >
        <div className="border-b border-border px-3 py-2">
          <div className="truncate text-sm font-medium">
            {user.name ?? user.email}
          </div>
          {user.email && user.name && (
            <div className="truncate text-xs text-muted-foreground">
              {user.email}
            </div>
          )}
        </div>
        <Link
          href="/favorites"
          onClick={() => setMenuOpen(false)}
          role="menuitem"
          className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-parchment/60 dark:hover:bg-roast-dark/40"
        >
          <UserIcon className="h-4 w-4" />
          {t("myFavorites")}
        </Link>
        <Link
          href="/notes"
          onClick={() => setMenuOpen(false)}
          role="menuitem"
          className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-parchment/60 dark:hover:bg-roast-dark/40"
        >
          <NotebookPen className="h-4 w-4" />
          {t("myNotes")}
        </Link>
        <button
          type="button"
          onClick={() => signOut()}
          role="menuitem"
          className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm hover:bg-parchment/60 dark:hover:bg-roast-dark/40"
        >
          <LogOut className="h-4 w-4" />
          {t("signOut")}
        </button>
      </div>
    </div>
  );
}
