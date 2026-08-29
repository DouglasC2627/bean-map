import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { GitHubIcon } from "@/components/shared/BrandIcons";
import { SOURCE_REPO_URL } from "@/lib/structured-data";

/**
 * Site-wide footer.
 *
 * Server component, so its links are in the initial HTML of every route with
 * no client JS. That is most of the point: before this existed the only
 * internal links a crawler could see without executing the nav were whatever
 * the page body happened to contain, and the map home page contains none.
 * A consistent, crawlable link block on every page is also what Google reads
 * to work out a site's main sections when choosing sitelinks.
 */
export async function SiteFooter({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: "footer" });

  const columns = [
    {
      heading: t("exploreHeading"),
      links: [
        { href: "/", label: t("map") },
        { href: "/beans", label: t("beans") },
        { href: "/explore/flavors", label: t("flavors") },
        { href: "/explore/insights", label: t("insights") },
        { href: "/compare", label: t("compare") },
      ],
    },
    {
      heading: t("learnHeading"),
      links: [
        { href: "/learn", label: t("learnIndex") },
        { href: "/learn/processing/washed", label: t("processing") },
        { href: "/learn/brewing/v60", label: t("brewing") },
      ],
    },
  ];

  return (
    <footer className="mt-auto border-t border-border bg-surface/40">
      <div className="mx-auto w-full max-w-screen-2xl px-4 py-10">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-1">
            <Link href="/" className="flex items-center gap-2">
              <Image
                src="/logo.png"
                alt=""
                width={24}
                height={24}
                className="h-6 w-6"
              />
              <span className="font-display text-lg tracking-tight">
                BeanMap
              </span>
            </Link>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted-foreground">
              {t("tagline")}
            </p>
          </div>

          {columns.map((column) => (
            <nav key={column.heading} aria-label={column.heading}>
              <h2 className="text-xs font-semibold tracking-wider text-foreground uppercase">
                {column.heading}
              </h2>
              <ul className="mt-3 space-y-2">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-roast-medium dark:hover:text-roast-light"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}

          <nav aria-label={t("projectHeading")}>
            <h2 className="text-xs font-semibold tracking-wider text-foreground uppercase">
              {t("projectHeading")}
            </h2>
            <ul className="mt-3 space-y-2">
              <li>
                <Link
                  href="/about"
                  className="text-sm text-muted-foreground hover:text-roast-medium dark:hover:text-roast-light"
                >
                  {t("about")}
                </Link>
              </li>
              <li>
                <a
                  href={SOURCE_REPO_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-roast-medium dark:hover:text-roast-light"
                >
                  <GitHubIcon className="h-3.5 w-3.5" />
                  {t("source")}
                </a>
              </li>
              <li>
                <a
                  href={`${SOURCE_REPO_URL}/blob/main/LICENSE`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-muted-foreground hover:text-roast-medium dark:hover:text-roast-light"
                >
                  {t("license")}
                </a>
              </li>
            </ul>
          </nav>
        </div>

        <div className="mt-10 flex flex-col gap-2 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-2xl">{t("note")}</p>
          {/* String, not number: ICU would format 2026 as "2,026". */}
          <p className="shrink-0">
            {t("copyright", { year: String(new Date().getFullYear()) })}
          </p>
        </div>
      </div>
    </footer>
  );
}
