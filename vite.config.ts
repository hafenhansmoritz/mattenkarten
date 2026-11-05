import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  base: "./",
  plugins: [
    react(),
    VitePWA({
      // Registrierung übernimmt src/pwa.ts (nur in Production).
      injectRegister: null,
      registerType: "autoUpdate",
      manifestFilename: "manifest.webmanifest",
      // Manifest liegt handgeschrieben in public/manifest.webmanifest.
      manifest: false,
      workbox: {
        globPatterns: ["**/*.{js,css,html,png,svg,ico,webmanifest,woff2,json}"],
        // Landingpage nicht precachen – Impressum/Datenschutz schon (App zeigt sie unter „Mehr“, auch offline).
        globIgnores: ["landing/index.html", "landing/*.{webp,jpg,png}"],
        navigateFallback: "index.html",
        navigateFallbackDenylist: [/^\/api\//, /^\/landing/],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
      },
      devOptions: { enabled: false },
    }),
  ],
  test: { environment: "node" },
} as any);
