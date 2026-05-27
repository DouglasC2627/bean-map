import type { Metadata } from "next";
import { DM_Serif_Display, Inter, JetBrains_Mono } from "next/font/google";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import "./globals.css";
import { ThemeProvider } from "@/components/shared/ThemeProvider";
import { TopNav } from "@/components/layout/TopNav";
import { SearchCommand } from "@/components/shared/SearchCommand";
import { getBeans, getFlavorNotes } from "@/lib/data";

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

export const metadata: Metadata = {
  title: "BeanMap — Coffee origins, flavors & brewing",
  description:
    "An interactive world map of coffee beans, their origins, flavor profiles, and recommended brewing methods.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // Mounted once here so the search dialog is available on every page; its
  // behaviour adapts to the current route (see SearchCommand).
  const beans = getBeans();
  const flavorNotes = getFlavorNotes();
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${dmSerif.variable} ${jetbrains.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <NuqsAdapter>
            <TopNav />
            <main className="flex-1 flex flex-col">{children}</main>
            <SearchCommand beans={beans} flavorNotes={flavorNotes} />
          </NuqsAdapter>
        </ThemeProvider>
      </body>
    </html>
  );
}
