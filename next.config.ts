import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pdfkit reads its own data files from disk at runtime, which breaks when it is bundled.
  serverExternalPackages: ["pdfkit"],
  // The statement route embeds Plus Jakarta Sans from src/app/_font; make sure those
  // files are shipped with the serverless function.
  outputFileTracingIncludes: {
    "/api/export/statement": ["./src/app/_font/**/*"],
  },
};

export default nextConfig;
