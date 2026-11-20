import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Screens you opened a moment ago are kept in the browser, so going back to one shows it at once instead of
  // a loading outline. Any save, edit or delete clears them, so what you see is never behind your own changes.
  experimental: {
    staleTimes: { dynamic: 60, static: 300 },
  },
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
          // Always HTTPS, never inside someone else's frame, and no access to sensors the app does not use.
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
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
