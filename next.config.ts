import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  experimental: {
    // Product forms upload up to 8 images of 5MB each.
    serverActions: { bodySizeLimit: "50mb" },
    proxyClientMaxBodySize: "50mb",
  },
  images: {
    localPatterns: [{ pathname: "/media/**" }, { pathname: "/placeholder/**" }, { pathname: "/images/**" }],
  },
};

export default nextConfig;
