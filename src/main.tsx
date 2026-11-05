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
import { App } from "./App";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <MotionConfig reducedMotion="user">
      <App />
    </MotionConfig>
  </React.StrictMode>,
);
