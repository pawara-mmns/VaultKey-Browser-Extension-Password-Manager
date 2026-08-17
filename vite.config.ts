import { copyFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const projectRoot = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  plugins: [
    react(),
    {
      name: "copy-extension-release-files",
      closeBundle() {
        copyFileSync(resolve(projectRoot, "manifest.json"), resolve(projectRoot, "dist/manifest.json"));
        copyFileSync(resolve(projectRoot, "LICENSE"), resolve(projectRoot, "dist/LICENSE"));
        copyFileSync(resolve(projectRoot, "THIRD_PARTY_NOTICES.md"), resolve(projectRoot, "dist/THIRD_PARTY_NOTICES.md"));
      },
    },
  ],
  build: {
    outDir: "dist",
    emptyOutDir: true,
    sourcemap: false,
    modulePreload: { polyfill: false },
    rollupOptions: {
      input: {
        popup: resolve(projectRoot, "popup.html"),
        vault: resolve(projectRoot, "vault.html"),
        offscreen: resolve(projectRoot, "offscreen.html"),
        serviceWorker: resolve(projectRoot, "src/background/serviceWorker.ts"),
      },
      output: {
        entryFileNames: (chunk) =>
          chunk.name === "serviceWorker" ? "background/serviceWorker.js" : "assets/[name]-[hash].js",
        chunkFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash][extname]",
      },
    },
  },
});
