import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Transpile mapbox-gl for proper SSR handling
  transpilePackages: ["mapbox-gl"],

  // Empty turbopack config to use Turbopack (Next.js 16 default)
  turbopack: {},
};

export default nextConfig;
// Build trigger 1769201598
