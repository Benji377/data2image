import { defineConfig } from "vite";

export default defineConfig({
  base: "/data2image/",
  root: ".",
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
});
