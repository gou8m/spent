import { defineConfig } from "vitest/config";
import path from "node:path";

const root = import.meta.dirname;

export default defineConfig({
  resolve: { alias: { "@": path.resolve(root, "src") } },
  test: { include: ["tests/**/*.test.ts"], environment: "node" },
});
