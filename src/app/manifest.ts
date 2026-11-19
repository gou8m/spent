import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Spent.",
    short_name: "Spent.",
    description: "A calm place for your money. Track spending, budgets and goals.",
    lang: "en",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#F4FAF2",
    theme_color: "#1B6B33",
    categories: ["finance", "productivity"],
    icons: [
      { src: "/icons/192", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/512", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-512", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    // Long-press the launcher icon for these.
    shortcuts: [
      { name: "Transactions", url: "/transactions", icons: [{ src: "/icons/192", sizes: "192x192", type: "image/png" }] },
      { name: "Budgets", url: "/budgets", icons: [{ src: "/icons/192", sizes: "192x192", type: "image/png" }] },
      { name: "Reports", url: "/reports", icons: [{ src: "/icons/192", sizes: "192x192", type: "image/png" }] },
    ],
  };
}
