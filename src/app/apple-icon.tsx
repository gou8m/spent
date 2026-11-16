import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

// iOS rounds the corners itself, so this one is full-bleed.
export default async function AppleIcon() {
  const fontData = await readFile(join(process.cwd(), "src/app/_font/plus-jakarta-sans-800.ttf"));

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#1B6B33" }}>
        <span style={{ fontFamily: "Plus Jakarta Sans", fontSize: 92, color: "#ffffff", letterSpacing: -4 }}>S.</span>
      </div>
    ),
    { ...size, fonts: [{ name: "Plus Jakarta Sans", data: fontData, style: "normal", weight: 800 }] },
  );
}
