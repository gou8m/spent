import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Spent",
    short_name: "Spent",
    description: "A calm place for your money.",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#F4FAF2",
    theme_color: "#1B6B33",
    icons: [{ src: "/icon", sizes: "32x32", type: "image/png" }],
  };
}
