import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // Performance: disable source maps in production builds
  productionBrowserSourceMaps: false,
  // Security: remove build-time server info (already handled by poweredByHeader)
  generateEtags: false,
  // Performance: keep package optimization
  experimental: { optimizePackageImports: ["lucide-react"] },
  // Security: add basic security headers (simple — production-grade should be at the edge / CDN level)
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
  // Performance: set max-age headers for static chunks in production
  async rewrites() {
    return [];
  },
};

export default nextConfig;
