import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  // Available locales. `en` is the source language; `zh-TW` is Traditional
  // Chinese (Taiwan). Add new locales here and they flow through the proxy,
  // navigation helpers, and `generateStaticParams`.
  locales: ["en", "zh-TW"],
  defaultLocale: "en",
  // Every language gets an explicit URL prefix (`/en/...`, `/zh-TW/...`). This
  // keeps the language switcher trivial and avoids ambiguity with nuqs query
  // strings on the map.
  localePrefix: "always",
});

export type Locale = (typeof routing.locales)[number];
