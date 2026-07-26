import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  // Rewrite barrel imports to direct paths so only the used members ship.
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "framer-motion",
      "d3-hierarchy",
      "d3-shape",
    ],
  },
};

export default withNextIntl(nextConfig);
