import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";

// GitHub Pages: the Documentation workflow passes the real base path from actions/configure-pages
// ("/" on the custom domain, "/ecosystem-config/" on the project URL). Keep DOCS_BASE for continuity.
const base = process.env.DOCS_BASE || "/";

export default defineConfig({
  root: fileURLToPath(new URL(".", import.meta.url)),
  base: base.endsWith("/") ? base : `${base}/`,
  plugins: [react()],
  build: {
    outDir: "dist",
    emptyOutDir: true,
    assetsInlineLimit: 0,
  },
  server: { port: 5181, strictPort: false },
  preview: { port: 4181 },
});
