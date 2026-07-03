import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  // Run on every path except Next internals, the API, and files with an
  // extension (favicon.ico, icon.png, apple-icon.png, /logo.png, etc.) so
  // static assets are never locale-prefixed.
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
