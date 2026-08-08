import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from '@vercel/speed-insights/next';
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import {
  DM_Serif_Display,
  Inter,
  JetBrains_Mono,
  Noto_Sans_TC,
  Noto_Serif_TC,
} from "next/font/google";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import "../globals.css";
import { ThemeProvider } from "@/components/shared/ThemeProvider";
import { MotionProvider } from "@/components/shared/MotionProvider";
import { SessionProviderWrapper } from "@/components/shared/SessionProviderWrapper";
import { FavoritesSync } from "@/components/shared/FavoritesSync";
import { SignInDialog } from "@/components/shared/SignInDialog";
import { Toaster } from "@/components/shared/Toaster";
import { TopNav } from "@/components/layout/TopNav";
import { SearchCommand } from "@/components/shared/SearchCommand";
import { getBeans, getFlavorNotes } from "@/lib/data";
import { toSearchableBeans } from "@/lib/search";
import { routing } from "@/i18n/routing";
import { siteUrl } from "@/lib/site";
import { pageMetadata } from "@/lib/seo";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const dmSerif = DM_Serif_Display({
  variable: "--font-display",
  weight: "400",
  subsets: ["latin"],
});

const jetbrains = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

// Traditional Chinese faces are large and have no Latin-style subset, so we
// skip preloading: they sit as fallbacks in the font stack (globals.css) and
// the browser only fetches them when a CJK glyph is actually painted — English
// pages never download them.
const notoSansTC = Noto_Sans_TC({
  variable: "--font-sans-cjk",
  weight: ["400", "500", "700"],
  preload: false,
  display: "swap",
});

const notoSerifTC = Noto_Serif_TC({
  variable: "--font-serif-cjk",
  weight: ["400", "600", "700"],
  preload: false,
  display: "swap",
});

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

// Tints the browser/OS chrome to match the active theme (and the manifest's
// theme_color) instead of leaving it default white in installed/standalone mode.
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#faf6f1" },
    { media: "(prefers-color-scheme: dark)", color: "#1a0f09" },
  ],
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata.home" });
  return {
    ...pageMetadata({
      locale,
      path: "/",
      title: t("title"),
      description: t("description"),
    }),
    metadataBase: new URL(siteUrl),
    applicationName: "BeanMap",
    // No `title.template` here: every `metadata.*` message already carries the
    // "· BeanMap" brand suffix, so a template would double it.
  };
}

export default async function LocaleLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  // Enables static rendering: makes the locale available to `getTranslations`
  // and the data loaders during static generation of all locale pages.
  setRequestLocale(locale);

  // Localized once on the server and projected down to just the fields search
  // indexes and renders. This prop is serialized into the RSC payload of every
  // page, so the projection (rather than full `CoffeeBean` records) is what
  // keeps the shared payload small. Chinese labels are resolved here, so the
  // dialog needs no `FlavorNotesData`.
  const searchBeans = toSearchableBeans(getBeans(locale), getFlavorNotes(locale));

  return (
    <html
      lang={locale}
      suppressHydrationWarning
      className={`${inter.variable} ${dmSerif.variable} ${jetbrains.variable} ${notoSansTC.variable} ${notoSerifTC.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {/* Warm the Mapbox connection so map style/tiles/glyphs start sooner
            (helps LCP on the map view). React 19 hoists these to <head>. */}
        <link
          rel="preconnect"
          href="https://api.mapbox.com"
          crossOrigin="anonymous"
        />
        <link rel="dns-prefetch" href="https://api.mapbox.com" />
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <NuqsAdapter>
            <NextIntlClientProvider>
              <SessionProviderWrapper>
                <MotionProvider>
                  <TopNav />
                  <main className="flex-1 flex flex-col">{children}</main>
                  <SearchCommand beans={searchBeans} />
                  <Toaster />
                  <FavoritesSync />
                  <SignInDialog />
                </MotionProvider>
              </SessionProviderWrapper>
            </NextIntlClientProvider>
          </NuqsAdapter>
        </ThemeProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
