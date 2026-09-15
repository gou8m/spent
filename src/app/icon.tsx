import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

// Same weight/family as the site's display font (Plus Jakarta Sans, see layout.tsx) —
// next/font can't be reused here, so its ExtraBold TTF is vendored in ./_font instead.
export default async function Icon() {
  const fontData = await readFile(join(process.cwd(), "src/app/_font/plus-jakarta-sans-800.ttf"));

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0a0b0d",
          borderRadius: 7,
        }}
      >
        <span style={{ fontFamily: "Plus Jakarta Sans", fontSize: 22, color: "#f7f8fa", letterSpacing: -1 }}>S.</span>
      </div>
    ),
    { ...size, fonts: [{ name: "Plus Jakarta Sans", data: fontData, style: "normal", weight: 800 }] },
  );
}
