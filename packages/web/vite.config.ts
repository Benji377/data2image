import { defineConfig } from "vite";
import path from "path";

export default defineConfig({
  base: "/data2image/",
  root: ".",
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      "@data2image/core": path.resolve(__dirname, "../core/dist/index.mjs"),
    },
  },
});
