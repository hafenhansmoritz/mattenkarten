import React from "react";
import ReactDOM from "react-dom/client";
import { MotionConfig } from "framer-motion";
import "./styles/theme.css";
import "./styles/cards.css";
import "./styles/app.css";
import "./styles/screens.css";
import "./styles/fx.css";
import "./styles/learn.css";
import "./styles/arena.css";
import "./styles/coach.css";
import "./styles/puzzles.css";
import "./styles/demo.css";
import "./styles/trainer.css";
import "./styles/hotseat.css";
// Bildschirm-Styles global (gleiche Reihenfolge wie vor dem Code-Splitting), damit lazy geladene
// Chunks nichts am Aussehen ändern und z. B. „Mehr“ (Schalter, Rechtliches) sofort richtig aussieht.
import "./styles/k2frames.css";
import "./styles/core2.css";
import "./styles/sammlung.css";
import "./program/program.css";
import "./journey/journey.css";
import "./leglock/leglock.css";
import "./legal/legal.css";
import { registerSW } from "./pwa";
registerSW();
import { App, ScreenFallback } from "./App";

// Entwickler-Labor für die Kämpfer-Szenen (?figlab) – eigener Chunk, im normalen Spiel nie geladen.
const FighterLab = React.lazy(() => import("./core2/ui/FighterLab"));
const LAB = new URLSearchParams(location.search).has("figlab");

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <MotionConfig reducedMotion="user">
      {/* Ein main-Landmark und eine h1 für alle Bildschirme (Screenreader-Navigation); display: contents → Layout unverändert. */}
      <main className="mk-root">
        <h1 className="sr-only">Mattenkarten</h1>
        <React.Suspense fallback={<ScreenFallback />}>{LAB ? <FighterLab /> : <App />}</React.Suspense>
      </main>
    </MotionConfig>
  </React.StrictMode>,
);
