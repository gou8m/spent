import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pdfkit reads its own data files from disk at runtime, which breaks when it is bundled.
  serverExternalPackages: ["pdfkit"],
  // The statement route embeds Plus Jakarta Sans from src/app/_font; make sure those
  // files are shipped with the serverless function.
  outputFileTracingIncludes: {
    "/api/export/statement": ["./src/app/_font/**/*"],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
      {
        // The Android app download: always saved as a file, never served from a stale cache.
        source: "/downloads/:path*",
        headers: [
          { key: "Content-Type", value: "application/vnd.android.package-archive" },
          { key: "Content-Disposition", value: "attachment; filename=spent.apk" },
          { key: "Cache-Control", value: "no-cache, must-revalidate" },
        ],
      },
      {
        // The service worker must never be served from a stale cache, or app updates would not reach users.
        // Chrome checks this file before it will show the Android app full screen; a long cache keeps that check instant.
        source: "/.well-known/assetlinks.json",
        headers: [
          { key: "Content-Type", value: "application/json" },
          { key: "Cache-Control", value: "public, max-age=86400" },
        ],
      },
      {
        source: "/sw.js",
        headers: [
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Content-Security-Policy", value: "default-src 'self'; script-src 'self'" },
        ],
      },
    ];
  },
};

export default nextConfig;
