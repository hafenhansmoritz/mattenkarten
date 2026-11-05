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
import { registerSW } from "./pwa";
registerSW();
import { App } from "./App";

// Entwickler-Labor für die Kämpfer-Szenen (?figlab) – eigener Chunk, im normalen Spiel nie geladen.
const FighterLab = React.lazy(() => import("./core2/ui/FighterLab"));
const LAB = new URLSearchParams(location.search).has("figlab");

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <MotionConfig reducedMotion="user">
      {LAB ? <React.Suspense fallback={null}><FighterLab /></React.Suspense> : <App />}
    </MotionConfig>
  </React.StrictMode>,
);
