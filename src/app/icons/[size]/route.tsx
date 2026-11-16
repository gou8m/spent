import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

// Pre-rendered at build time: /icons/192, /icons/512 and /icons/maskable-512 (the PNGs the web app
// manifest points at, which the Android app build also uses for its launcher icon).
export const dynamic = "force-static";

const VARIANTS = ["192", "512", "maskable-512"] as const;

export function generateStaticParams() {
  return VARIANTS.map((size) => ({ size }));
}

export async function GET(_request: Request, { params }: { params: Promise<{ size: string }> }) {
  const { size: raw } = await params;
  if (!VARIANTS.includes(raw as (typeof VARIANTS)[number])) return new Response("Not found", { status: 404 });

  const maskable = raw.startsWith("maskable");
  const size = Number(raw.replace("maskable-", ""));
  const fontData = await readFile(join(process.cwd(), "src/app/_font/plus-jakarta-sans-800.ttf"));

  // A maskable icon is cropped by the launcher into a circle, squircle or square, so it must be
  // full-bleed with the mark inside the central 80% "safe zone". The plain icon is a rounded square.
  const fontSize = Math.round(size * (maskable ? 0.4 : 0.52));

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#1B6B33",
          borderRadius: maskable ? 0 : Math.round(size * 0.22),
        }}
      >
        <span style={{ fontFamily: "Plus Jakarta Sans", fontSize, color: "#ffffff", letterSpacing: -Math.round(size * 0.02) }}>S.</span>
      </div>
    ),
    {
      width: size,
      height: size,
      fonts: [{ name: "Plus Jakarta Sans", data: fontData, style: "normal", weight: 800 }],
    },
  );
}
