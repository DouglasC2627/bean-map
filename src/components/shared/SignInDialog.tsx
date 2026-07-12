"use client";

import { signIn } from "next-auth/react";
import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useAuthDialog } from "@/store/auth-dialog";
import { GitHubIcon, GoogleIcon } from "./BrandIcons";

/**
 * The single, app-wide sign-in dialog. Mounted once in the layout; opened from
 * anywhere via the `useAuthDialog` store (account avatar, favorite heart, etc.).
 */
export function SignInDialog() {
  const t = useTranslations("auth");
  const open = useAuthDialog((s) => s.open);
  const setOpen = useAuthDialog((s) => s.setOpen);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{t("signInTitle")}</DialogTitle>
          <DialogDescription>{t("signInSubtitle")}</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => signIn("google")}
            className="inline-flex items-center justify-center gap-2.5 rounded-md border border-border px-3 py-2 text-sm font-medium hover:border-roast-medium hover:bg-muted"
          >
            <GoogleIcon className="h-[18px] w-[18px]" />
            {t("continueGoogle")}
          </button>
          <button
            type="button"
            onClick={() => signIn("github")}
            className="inline-flex items-center justify-center gap-2.5 rounded-md border border-border px-3 py-2 text-sm font-medium hover:border-roast-medium hover:bg-muted"
          >
            <GitHubIcon className="h-[18px] w-[18px]" />
            {t("continueGithub")}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
