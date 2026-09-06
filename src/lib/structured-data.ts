import type { CoffeeBean } from "@/types";
import { routing } from "@/i18n/routing";
import { siteUrl } from "@/lib/site";
import { localizedUrl } from "@/lib/seo";

/**
 * JSON-LD builders.
 *
 * A note on the bean pages: `Product` is tempting, but BeanMap sells nothing —
 * there is no price, no seller, no rating. `Product` without `offers`,
 * `review`, or `aggregateRating` earns no rich result and reports missing
 * required fields in Google's Rich Results Test. So a bean page is modelled as
 * what it actually is: an `Article` *about* a `Thing` (the origin), with the
 * concrete attributes hung off that Thing as `additionalProperty`. Everything
 * asserted below is data we genuinely have.
 */

const ORGANIZATION_ID = `${siteUrl}/#organization`;
const WEBSITE_ID = `${siteUrl}/#website`;

export const SOURCE_REPO_URL = "https://github.com/DouglasC2627/bean-map";

/**
 * The names this project is actually known by, in both languages it publishes.
 */
const ALTERNATE_NAMES = [
  "Bean Map",
  "咖啡地圖",
  "咖啡豆地圖",
  "咖啡產地地圖",
];

export function organizationSchema() {
  return {
    "@type": "Organization",
    "@id": ORGANIZATION_ID,
    name: "BeanMap",
    alternateName: ALTERNATE_NAMES,
    url: siteUrl,
    logo: `${siteUrl}/logo.png`,
    description:
      "An interactive world map of coffee beans, their origins, flavor profiles, and recommended brewing methods.",
    // The only public profile that actually belongs to the project. `sameAs`
    // is how an engine (and an LLM summarizing the site) reconciles "BeanMap"
    // the name with a verifiable entity elsewhere on the web.
    sameAs: [SOURCE_REPO_URL],
  };
}

/**
 * The `Organization` + `WebSite` pair every page hangs off, plus the home
 * page's own `WebPage`.
 *
 * `about` / `mainEntity` links the map page to the About page: the About page
 * is where the prose describing BeanMap lives, and the map page is mostly a
 * canvas, so this is what tells a crawler the two are one subject.
 */
export function websiteSchema(
  locale: string,
  home?: { name: string; description: string },
) {
  return {
    "@context": "https://schema.org",
    "@graph": [
      organizationSchema(),
      {
        "@type": "WebSite",
        "@id": WEBSITE_ID,
        name: "BeanMap",
        alternateName: ALTERNATE_NAMES,
        url: localizedUrl(locale, "/"),
        inLanguage: locale,
        publisher: { "@id": ORGANIZATION_ID },
      },
      ...(home
        ? [
            {
              "@type": "WebPage",
              "@id": `${localizedUrl(locale, "/")}#webpage`,
              url: localizedUrl(locale, "/"),
              name: home.name,
              description: home.description,
              inLanguage: locale,
              isPartOf: { "@id": WEBSITE_ID },
              about: { "@id": `${localizedUrl(locale, "/about")}#about` },
              primaryImageOfPage: `${siteUrl}/logo.png`,
            },
          ]
        : []),
    ],
  };
}

/**
 * The About page, modelled as an `AboutPage` whose `mainEntity` *is* the
 * organization. That identity is the point: it gives "BeanMap" a single node
 * carrying the description, the license, and the feature list, which is the
 * shape an AI overview can quote from without inferring anything.
 */
export function aboutPageSchema({
  locale,
  name,
  description,
  features,
}: {
  locale: string;
  name: string;
  description: string;
  features: string[];
}) {
  const url = localizedUrl(locale, "/about");
  return {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    "@id": `${url}#about`,
    url,
    name,
    description,
    inLanguage: locale,
    isPartOf: { "@id": WEBSITE_ID },
    mainEntity: {
      "@type": "WebApplication",
      name: "BeanMap",
      url: localizedUrl(locale, "/"),
      applicationCategory: "ReferenceApplication",
      operatingSystem: "Any (web browser)",
      browserRequirements: "Requires JavaScript and WebGL for the map view.",
      description,
      inLanguage: [...routing.locales],
      license: "https://opensource.org/licenses/MIT",
      isAccessibleForFree: true,
      publisher: { "@id": ORGANIZATION_ID },
      featureList: features,
      // Explicit: BeanMap sells nothing. Without this a crawler seeing a
      // catalog of coffee has every reason to guess it is a storefront.
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
        availability: "https://schema.org/InStock",
      },
    },
  };
}

export function faqSchema(
  locale: string,
  path: string,
  items: Array<{ q: string; a: string }>,
) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "@id": `${localizedUrl(locale, path)}#faq`,
    inLanguage: locale,
    isPartOf: { "@id": WEBSITE_ID },
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };
}

interface Crumb {
  name: string;
  /** Locale-less path, e.g. "/beans". */
  path: string;
}

export function breadcrumbSchema(locale: string, crumbs: Crumb[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.name,
      item: localizedUrl(locale, c.path),
    })),
  };
}

export function beanSchema(
  bean: CoffeeBean,
  locale: string,
  /**
   * Localized display *values* for the coded fields. Property `name`s stay in
   * English below — they're machine-facing keys, and keeping them stable across
   * locales lets a consumer compare the same attribute between translations.
   */
  values: {
    processing: string;
    roast: string;
    flavorNotes: string[];
  },
) {
  const url = localizedUrl(locale, `/bean/${bean.slug}`);
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    "@id": `${url}#article`,
    headline: bean.name,
    description: bean.description,
    inLanguage: locale,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    image: `${siteUrl}/api/og?bean=${bean.slug}&locale=${locale}`,
    publisher: { "@id": ORGANIZATION_ID },
    isPartOf: { "@id": WEBSITE_ID },
    about: {
      "@type": "Thing",
      name: bean.name,
      description: bean.description,
      additionalProperty: [
        { "@type": "PropertyValue", name: "Country", value: bean.country },
        { "@type": "PropertyValue", name: "Region", value: bean.region },
        {
          "@type": "PropertyValue",
          name: "Altitude",
          minValue: bean.altitudeMasl[0],
          maxValue: bean.altitudeMasl[1],
          unitCode: "MTR",
        },
        {
          "@type": "PropertyValue",
          name: "Processing",
          value: values.processing,
        },
        { "@type": "PropertyValue", name: "Roast", value: values.roast },
        {
          "@type": "PropertyValue",
          name: "Varieties",
          value: bean.varieties.join(", "),
        },
        {
          "@type": "PropertyValue",
          name: "Flavor notes",
          value: values.flavorNotes.join(", "),
        },
      ],
    },
    contentLocation: {
      "@type": "Place",
      name: `${bean.region}, ${bean.country}`,
      address: { "@type": "PostalAddress", addressCountry: bean.countryCode },
      geo: {
        "@type": "GeoCoordinates",
        longitude: bean.coordinates[0],
        latitude: bean.coordinates[1],
      },
    },
  };
}

export function learnArticleSchema({
  locale,
  category,
  slug,
  title,
  description,
}: {
  locale: string;
  category: "processing" | "brewing";
  slug: string;
  title: string;
  description: string;
}) {
  const url = localizedUrl(locale, `/learn/${category}/${slug}`);
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    "@id": `${url}#article`,
    headline: title,
    description,
    inLanguage: locale,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    publisher: { "@id": ORGANIZATION_ID },
    isPartOf: { "@id": WEBSITE_ID },
    articleSection: category === "brewing" ? "Brewing" : "Processing",
  };
}

/** The bean index as a browsable collection. */
export function beanListSchema(
  locale: string,
  beans: Pick<CoffeeBean, "slug" | "name">[],
  name: string,
  description: string,
) {
  const url = localizedUrl(locale, "/beans");
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": `${url}#collection`,
    name,
    description,
    inLanguage: locale,
    url,
    isPartOf: { "@id": WEBSITE_ID },
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: beans.length,
      itemListElement: beans.map((b, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: b.name,
        url: localizedUrl(locale, `/bean/${b.slug}`),
      })),
    },
  };
}
