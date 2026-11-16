"use client";

import { SUPPORT_EMAIL } from "@/lib/constants";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100dvh",
          background: "#F4FAF2",
          color: "#14231A",
          fontFamily: "'Plus Jakarta Sans', ui-sans-serif, system-ui, sans-serif",
        }}
      >
        <main style={{ maxWidth: 448, margin: "0 auto", padding: "28px 20px 40px" }}>
          <p style={{ margin: 0, fontSize: 28, fontWeight: 800, letterSpacing: -1, color: "#1B6B33" }}>Spent.</p>
          <div style={{ marginTop: 60, textAlign: "center" }}>
            <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, letterSpacing: -0.8 }}>Something went wrong</h1>
            <p style={{ margin: "8px auto 0", maxWidth: 300, fontSize: 15, lineHeight: 1.45, color: "#4A5D50" }}>
              Your data is safe. Try again, and if it keeps happening let us know.
            </p>
          </div>
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: 26,
              width: "100%",
              height: 58,
              border: 0,
              borderRadius: 20,
              background: "#1B6B33",
              color: "#fff",
              fontSize: 17,
              fontWeight: 700,
              fontFamily: "inherit",
              cursor: "pointer",
            }}
          >
            Try again
          </button>
          <a
            href={`mailto:${SUPPORT_EMAIL}`}
            style={{
              marginTop: 10,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: 52,
              borderRadius: 18,
              background: "#E8EEE9",
              color: "#14231A",
              fontSize: 15,
              fontWeight: 700,
              textDecoration: "none",
            }}
          >
            Contact support
          </a>
        </main>
      </body>
    </html>
  );
}
