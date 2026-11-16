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
        // The service worker must never be served from a stale cache, or app updates would not reach users.
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
