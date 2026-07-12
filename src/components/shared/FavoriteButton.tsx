"use client";

import { useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import { Heart } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useFavorites } from "@/store/favorites";
import { useAuthDialog } from "@/store/auth-dialog";

interface Props {
  /** Bean slug — the stable key shared with share URLs and the DB. */
  slug: string;
  /** Bean name, used in the toast + accessible label. */
  name: string;
  variant?: "default" | "compact";
  className?: string;
}

/**
 * Heart toggle for favoriting a bean. Favorites require an account: when signed
 * out, clicking opens the sign-in dialog; when signed in, it toggles optimistically
 * and mirrors the change to the account API (rolling back on failure).
 */
export function FavoriteButton({
  slug,
  name,
  variant = "default",
  className,
}: Props) {
  const t = useTranslations("favorites");
  const { status } = useSession();
  const isFav = useFavorites((s) => Boolean(s.favorites[slug]));
  const add = useFavorites((s) => s.add);
  const remove = useFavorites((s) => s.remove);
  const openSignIn = useAuthDialog((s) => s.setOpen);

  const onClick = () => {
    // Signed out → prompt to sign in instead of favoriting.
    if (status !== "authenticated") {
      toast.info(t("signInToSave"));
      openSignIn(true);
      return;
    }

    const wasFav = isFav;
    if (wasFav) remove(slug);
    else add(slug);
    toast.success(wasFav ? t("removed", { name }) : t("added", { name }));

    const req = wasFav
      ? fetch(`/api/favorites/${encodeURIComponent(slug)}`, { method: "DELETE" })
      : fetch("/api/favorites", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ beanSlug: slug }),
        });

    req
      .then((res) => {
        if (!res.ok) throw new Error(String(res.status));
      })
      .catch(() => {
        if (wasFav) add(slug);
        else remove(slug);
        toast.error(t("syncError"));
      });
  };

  const filled = status === "authenticated" && isFav;
  const label = filled ? t("remove", { name }) : t("add", { name });

  if (variant === "compact") {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-pressed={filled}
        aria-label={label}
        title={label}
        className={cn(
          "inline-flex items-center justify-center rounded-md p-1 text-muted-foreground transition hover:text-cherry-red",
          filled && "text-cherry-red",
          className,
        )}
      >
        <Heart className={cn("h-4 w-4", filled && "fill-current")} />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={filled}
      aria-label={label}
      title={label}
      className={cn(
        "inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs transition",
        filled
          ? "border-cherry-red bg-cherry-red/10 text-cherry-red"
          : "border-border text-muted-foreground hover:border-cherry-red hover:text-cherry-red",
        className,
      )}
    >
      <Heart className={cn("h-3 w-3", filled && "fill-current")} />
      {filled ? t("saved") : t("save")}
    </button>
  );
}
