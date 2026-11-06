import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// Lokale Vorschau (vite / vite preview) hat keine Vercel-Funktion /api/coach. Statt eines 404 in der Konsole
// antwortet GET hier „kein Coach“ – die App blendet den Coach dann still aus (UX-Review 2, Punkt 10).
function coachStub(req: any, res: any, next: () => void) {
  if (req.method === "GET" && String(req.url ?? "").split("?")[0] === "/api/coach") {
    res.setHeader("content-type", "application/json");
    res.end(JSON.stringify({ ok: false, hasKey: false }));
    return;
  }
  next();
}
const localCoachStub = {
  name: "local-coach-stub",
  configureServer(s: any) { s.middlewares.use(coachStub); },
  configurePreviewServer(s: any) { s.middlewares.use(coachStub); },
};

export default defineConfig({
  base: "./",
  plugins: [
    react(),
    localCoachStub,
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
