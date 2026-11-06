// Freie Wiedergabe: „Erklär in einem Satz …“ (Question.kind "erklaeren").
// Mit Coach-Zustimmung und aktivem Coach bewertet die KI (api/coach.ts, mode "grade"),
// sonst Musterantwort + Kernpunkte zeigen und selbst bewerten („Hatte ich drin“ / „Fehlte“).
// Die Antwort wird nicht gespeichert; gesendet wird sie nur mit Zustimmung.
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { gradeAnswer, type GradeOutcome } from "../coach/grade";
import { COACH_LIMITS, type GradeVerdict } from "../coach/types";
import type { Question } from "./questions";
import "./program.css";

type Phase =
  | { kind: "write" }
  | { kind: "grading" }
  | { kind: "coach"; verdict: GradeVerdict }
  | { kind: "self"; reason: "consent" | "off" | "error" | "skip" }
  | { kind: "done"; ok: boolean; by: "coach" | "self" | "skip" };

const MIN_CHARS = 8;

export function FreeRecall({ q, onResult, onNext, repeats = true, grade = gradeAnswer }: {
  q: Question;
  /** Kommt die Frage bei „falsch“ noch einmal? (Nur beim ersten Mal – Quiz.afterAnswer.) */
  repeats?: boolean;
  /** Erster Versuch bewertet (genau einmal pro Anzeige). */
  onResult: (ok: boolean) => void;
  onNext: () => void;
  /** Für Tests austauschbar. */
  grade?: (id: string, answer: string, opts: { signal?: AbortSignal }) => Promise<GradeOutcome>;
}) {
  const [text, setText] = useState("");
  const [phase, setPhase] = useState<Phase>({ kind: "write" });
  const [coachVerdict, setCoachVerdict] = useState<GradeVerdict | null>(null);
  const ctrl = useRef<AbortController | null>(null);
  useEffect(() => () => ctrl.current?.abort(), []);

  const points = q.explain?.points ?? [];
  const tooShort = text.trim().length < MIN_CHARS;

  async function check() {
    if (tooShort || phase.kind !== "write") return;
    setPhase({ kind: "grading" });
    ctrl.current = new AbortController();
    const out = await grade(q.id, text, { signal: ctrl.current.signal });
    if (out.kind === "coach") {
      setCoachVerdict(out.verdict);
      onResult(out.verdict.ok);
      setPhase({ kind: "done", ok: out.verdict.ok, by: "coach" });
    } else {
      setPhase({ kind: "self", reason: out.reason });
    }
  }

  function selfGrade(ok: boolean) {
    onResult(ok);
    setPhase({ kind: "done", ok, by: "self" });
  }

  /** „Weiß ich nicht“: Musterantwort zeigen, einmal als falsch zählen (Fehlerdeck) – keine Selbstbewertung nötig. */
  function skip() {
    setText("");
    onResult(false);
    setPhase({ kind: "done", ok: false, by: "skip" });
  }

  const writing = phase.kind === "write" || phase.kind === "grading";

  return (
    <div className="pg-fr">
      {writing ? (
        <>
          <label className="pg-fr-label small muted" htmlFor={`fr-${q.id}`}>Deine Antwort – ein Satz, eigene Worte</label>
          <textarea id={`fr-${q.id}`} className="pg-fr-input" rows={3} value={text} maxLength={COACH_LIMITS.maxAnswerChars}
            placeholder="Weil …" disabled={phase.kind === "grading"} onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void check(); } }} />
          <div className="pg-fr-actions">
            <button type="button" className="btn primary big" onClick={() => void check()} disabled={tooShort || phase.kind === "grading"}>
              {phase.kind === "grading" ? "Der Coach liest …" : "Prüfen"}
            </button>
            <button type="button" className="btn ghost" onClick={skip} disabled={phase.kind === "grading"}>Weiß ich nicht</button>
          </div>
          <p className="small muted pg-fr-hint">Keine Namen oder Gesundheitsangaben hineinschreiben.</p>
        </>
      ) : (
        <motion.div className="pg-fr-result" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          {text.trim() && (
            <div className="pg-fr-mine">
              <span className="label">Deine Antwort</span>
              <p>{text.trim()}</p>
            </div>
          )}

          {phase.kind === "self" && (
            <p className="small muted" role="status">
              {phase.reason === "consent"
                ? "Vergleiche selbst mit der Musterantwort."
                : "Der Coach ist gerade nicht erreichbar – vergleiche selbst."}
            </p>
          )}

          {phase.kind === "done" && phase.by === "coach" && coachVerdict && (
            <div className={`pg-why ${coachVerdict.ok ? "ok" : "no"}`}>
              <strong className="display">{coachVerdict.ok ? "Richtig erklärt!" : "Fast – da fehlte etwas:"}</strong>
              {!coachVerdict.ok && coachVerdict.missing && <p>{coachVerdict.missing}</p>}
              {coachVerdict.tip && <p className="muted">{coachVerdict.tip}</p>}
              <p className="pg-fr-ai small" role="note"><b>KI-Bewertung.</b> Kann falsch sein – im Zweifel frag deinen Trainer.</p>
            </div>
          )}

          <div className="pg-fr-model">
            <span className="label">Musterantwort</span>
            <p>{q.why}</p>
            {points.length > 0 && (
              <>
                <span className="label">Kernpunkte</span>
                <ul className="pg-fr-points">{points.map((p) => <li key={p}>{p}</li>)}</ul>
              </>
            )}
          </div>

          {phase.kind === "self" && (
            <div className="pg-fr-self">
              <span className="small">Hattest du den ersten Kernpunkt sinngemäß drin?</span>
              <div className="pg-fr-actions">
                <button type="button" className="btn primary big" onClick={() => selfGrade(true)}>Hatte ich drin</button>
                <button type="button" className="btn big" onClick={() => selfGrade(false)}>Fehlte</button>
              </div>
            </div>
          )}

          {phase.kind === "done" && (
            <>
              {phase.by !== "coach" && (
                <p className={`pg-fr-self-res ${phase.ok ? "ok" : "no"}`}>
                  <strong className="display">{phase.ok ? "Gut erklärt!" : "Kein Problem – merk dir die Kernpunkte."}</strong>
                </p>
              )}
              {!phase.ok && (repeats
                ? <p className="muted small">Die Frage kommt gleich noch einmal.</p>
                : <p className="muted small">Sie landet in deinem Fehlerdeck unter „Wiederholen“.</p>)}
              <button type="button" className="btn primary big pg-next" onClick={onNext}>Weiter</button>
            </>
          )}
        </motion.div>
      )}
    </div>
  );
}
