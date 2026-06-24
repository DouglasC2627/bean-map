import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

// Locale-aware drop-in replacements for `next/link` and the `next/navigation`
// hooks. `Link` auto-prefixes the active locale; `usePathname` returns the
// pathname WITHOUT the locale prefix (so route comparisons like `pathname ===
// "/"` keep working). Import these instead of the `next/*` originals anywhere a
// component navigates or inspects the path.
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
