import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";

/**
 * Web app manifest. Served at /manifest.webmanifest and linked automatically
 * by Next's metadata layer.
 *
 * `start_url` carries the default locale prefix because every route is
 * locale-prefixed — a bare "/" would bounce through the i18n proxy on every
 * launch of the installed app.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "BeanMap — Coffee origins, flavors & brewing",
    short_name: "BeanMap",
    description:
      "An interactive world map of coffee beans, their origins, flavor profiles, and recommended brewing methods.",
    start_url: `/${routing.defaultLocale}`,
    scope: "/",
    display: "standalone",
    orientation: "any",
    background_color: "#faf6f1",
    theme_color: "#6f4e37",
    categories: ["food", "education", "travel"],
    icons: [
      {
        src: "/icon.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/apple-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  };
}
