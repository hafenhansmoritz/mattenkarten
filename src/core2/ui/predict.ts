// Kern 2 – „Was passiert jetzt?“: Vorhersage vor dem Aufdecken (KB 8.5, Brod et al. 2018).
// Die Antwort wird aus dem echten Engine-Ergebnis abgeleitet (playRound ist rein, s bleibt unverändert).
import type { Round2 } from "../types";
import { cardById } from "../engine";
import type { TutorialK2Def } from "./tutorialTypes";

export type Prediction = "win" | "stopped" | "nothing";

export const PREDICTION_LABEL: Record<Prediction, string> = {
  win: "Du gewinnst die Zone",
  stopped: "Er stoppt dich",
  nothing: "Nichts passiert",
};
export const PREDICTIONS: Prediction[] = ["win", "stopped", "nothing"];

/** Lektionen 1–2 des Startprogramms: jede Runde vorhersagen. */
export const PREDICT_ALL_LESSONS = new Set(["k2-raus-von-unten", "p-side-escape"]);

/**
 * Was ist aus Sicht des Spielers passiert?
 * - win:     deine Karte hat gewirkt (Rundensieger du, oder beide wirken in verschiedenen Zonen)
 * - stopped: gleiche Zone, er gewinnt das Duell
 * - nothing: du passt, dein Rahmen geht ins Leere, oder keiner kommt voran
 */
export function outcomeOf(r: Round2): Prediction {
  const pc = cardById(r.pCard);
  if (!pc) return "nothing";
  if (r.winner === "p" || r.winner === "both") return "win";
  const oc = cardById(r.oCard);
  if (r.winner === "o" && oc && oc.zone === pc.zone) return "stopped";
  return "nothing";
}

/** Soll in dieser Runde vorhergesagt werden? */
export function shouldPredict(tut: TutorialK2Def | undefined, round: number): boolean {
  if (!tut) return false;
  if (tut.predictAll || PREDICT_ALL_LESSONS.has(tut.id)) return true;
  return tut.steps.some((st) => st.predict && (st.round == null || st.round === round));
}

/** Kurzer Feedback-Satz. Falsche Vorhersage → Überraschung nutzen, Erklärung prominent. */
export function predictionFeedback(guess: Prediction, r: Round2): { ok: boolean; title: string } {
  const truth = outcomeOf(r);
  const ok = guess === truth;
  return { ok, title: ok ? "Richtig vorhergesagt!" : `Anders: ${PREDICTION_LABEL[truth]}.` };
}
