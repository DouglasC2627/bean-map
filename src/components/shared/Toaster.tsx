"use client";

import { useTheme } from "next-themes";
import { Toaster as SonnerToaster } from "sonner";

// Warm coffee palette for toasts (favorite saved, link copied, note saved…).
// Applied inline so it wins over sonner's theme in both light and dark mode.
const VANILLA_CREAM = "#F0E6D1"; // background
const PALE_OAK = "#CBBDAA"; // border
const DUSTY_TAUPE = "#A69382"; // shadow + icon accent
const ROAST_DARK = "#3B2314"; // text, for contrast on the cream

/**
 * App-wide toast host. Bridges next-themes → sonner, and dresses the toast in
 * the BeanMap coffee palette (Vanilla cream / Pale Oak / Dusty Taupe).
 */
export function Toaster() {
  const { resolvedTheme } = useTheme();

  return (
    <SonnerToaster
      theme={resolvedTheme === "dark" ? "dark" : "light"}
      position="bottom-center"
      toastOptions={{
        style: {
          background: VANILLA_CREAM,
          color: ROAST_DARK,
          border: `1px solid ${PALE_OAK}`,
          boxShadow: `0 6px 22px -8px ${DUSTY_TAUPE}`,
        },
        classNames: {
          toast: "font-sans",
          icon: "text-[#A69382]",
          description: "text-[#3B2314]/70",
          actionButton: "bg-[#A69382]! text-[#F0E6D1]!",
          closeButton: "bg-[#F0E6D1]! border-[#CBBDAA]! text-[#3B2314]!",
        },
      }}
    />
  );
}
