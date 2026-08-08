import type { CoffeeBean } from "@/types";
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

export function organizationSchema() {
  return {
    "@type": "Organization",
    "@id": ORGANIZATION_ID,
    name: "BeanMap",
    url: siteUrl,
    logo: `${siteUrl}/logo.png`,
    description:
      "An interactive world map of coffee beans, their origins, flavor profiles, and recommended brewing methods.",
  };
}

export function websiteSchema(locale: string) {
  return {
    "@context": "https://schema.org",
    "@graph": [
      organizationSchema(),
      {
        "@type": "WebSite",
        "@id": WEBSITE_ID,
        name: "BeanMap",
        url: localizedUrl(locale, "/"),
        inLanguage: locale,
        publisher: { "@id": ORGANIZATION_ID },
      },
    ],
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
