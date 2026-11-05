// KI-Coach: Vollbild-Chat und Match-Analyse für den Endbildschirm.
import { useCallback, useEffect, useRef, useState } from "react";
import { CoachAvatar } from "../components/learn/icons";
import { askCoach, coachAvailable, CoachError } from "./client";
import { useCoachConsent } from "./consent";
import { COACH_LIMITS, type CoachMatchSummary, type CoachMessage } from "./types";

export const COACH_CHIPS = [
  "Was mache ich unten im Mount?",
  "Erklär mir Kontern",
  "Quiz mich zu Positionen",
  "Warum früh abklopfen?",
] as const;

const GREETING =
  "Hi, ich bin dein Coach. Frag mich zu Positionen, Karten oder Regeln – ich gebe dir erst einen Tipp, dann die ganze Erklärung.";

type Availability = "checking" | "on" | "off";

const PRIVACY_URL = "/landing/datenschutz.html";

/** Pflicht-Kennzeichnung: KI-generiert, kann falsch sein, kein Ersatz für Trainer/Arzt. */
export function CoachAiLabel() {
  return (
    <p className="co-ai-label" role="note">
      <b>KI-generiert.</b> Antworten können falsch sein und ersetzen weder Trainer noch Arzt.
    </p>
  );
}

/** Hinweis vor der ersten Frage: Frage geht zur Verarbeitung an Anthropic. Zustimmung wird lokal gemerkt. */
export function CoachConsentCard({ onAccept, compact }: { onAccept: () => void; compact?: boolean }) {
  return (
    <div className={`co-consent${compact ? " compact" : ""}`} role="region" aria-label="Hinweis zum KI-Coach">
      <b>Bevor du fragst</b>
      <p>
        Der Coach ist eine KI. Damit er antworten kann, wird {compact ? "eine Zusammenfassung deines Matches" : "deine Frage (mit dem bisherigen Gespräch)"} über
        unseren Server an <b>Anthropic</b> (USA) geschickt und dort verarbeitet. Kein Name, kein Konto.
      </p>
      {!compact && <p>Schreib keine Namen oder Gesundheitsangaben hinein. Unter 16? Nur mit Erlaubnis deiner Eltern.</p>}
      <p className="co-consent-links">
        <a href={PRIVACY_URL} target="_blank" rel="noopener">Datenschutz</a> · Du kannst die Zustimmung jederzeit zurücknehmen.
      </p>
      <button type="button" className="btn primary" onClick={onAccept}>Einverstanden</button>
    </div>
  );
}

function useAvailability(): Availability {
  const [a, setA] = useState<Availability>("checking");
  useEffect(() => {
    let live = true;
    coachAvailable().then((ok) => live && setA(ok ? "on" : "off"));
    return () => {
      live = false;
    };
  }, []);
  return a;
}

/** Text mit "- "-Zeilen als Liste, Leerzeilen als Absätze. */
function CoachText({ text }: { text: string }) {
  const blocks = text.split(/\n{2,}/);
  return (
    <>
      {blocks.map((b, i) => {
        const lines = b.split("\n").filter((l) => l.trim());
        if (lines.length && lines.every((l) => /^\s*[-•*]\s+/.test(l))) {
          return (
            <ul key={i}>
              {lines.map((l, j) => <li key={j}>{l.replace(/^\s*[-•*]\s+/, "")}</li>)}
            </ul>
          );
        }
        return <p key={i}>{lines.map((l, j) => <span key={j}>{j > 0 && <br />}{l}</span>)}</p>;
      })}
    </>
  );
}

function Typing() {
  return (
    <span className="co-typing" aria-label="Coach schreibt">
      <i /><i /><i />
    </span>
  );
}

interface Bubble extends CoachMessage {
  error?: boolean;
}

export function CoachChat({ onBack, initialQuestion }: { onBack: () => void; initialQuestion?: string }) {
  const avail = useAvailability();
  const [consent, setConsent] = useCoachConsent();
  const [msgs, setMsgs] = useState<Bubble[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const sentInitial = useRef(false);

  // Mitscrollen
  useEffect(() => {
    const el = logRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [msgs]);

  // Laufende Anfrage beim Verlassen abbrechen
  useEffect(() => () => abortRef.current?.abort(), []);

  const send = useCallback(
    async (raw: string) => {
      const text = raw.trim().slice(0, COACH_LIMITS.maxChars);
      if (!text || busy || avail !== "on" || !consent) return;
      const history: Bubble[] = [...msgs.filter((m) => !m.error), { role: "user", content: text }];
      setMsgs([...history, { role: "assistant", content: "" }]);
      setDraft("");
      setBusy(true);
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      const setLast = (b: Bubble) => setMsgs((cur) => [...cur.slice(0, -1), b]);
      try {
        const full = await askCoach(
          { mode: "chat", messages: history.map(({ role, content }) => ({ role, content })) },
          (t) => setLast({ role: "assistant", content: t }),
          ctrl.signal,
        );
        setLast({ role: "assistant", content: full.trim() || "Dazu habe ich gerade keine Antwort. Frag mich anders?" });
      } catch (e) {
        if (e instanceof CoachError && e.code === "aborted") {
          setMsgs((cur) => (cur[cur.length - 1]?.content ? cur : cur.slice(0, -1)));
        } else {
          setLast({ role: "assistant", content: e instanceof Error ? e.message : String(e), error: true });
        }
      } finally {
        abortRef.current = null;
        setBusy(false);
        inputRef.current?.focus();
      }
    },
    [avail, busy, msgs, consent],
  );

  useEffect(() => {
    if (avail === "on" && consent && initialQuestion && !sentInitial.current) {
      sentInitial.current = true;
      void send(initialQuestion);
    }
  }, [avail, consent, initialQuestion, send]);

  const stop = () => abortRef.current?.abort();
  const reset = () => {
    stop();
    setMsgs([]);
  };
  const tooLong = msgs.length >= COACH_LIMITS.maxMessages - 1;
  const canType = avail === "on" && consent && !busy && !tooLong;

  return (
    <section className="co-screen" aria-label="Coach">
      <header className="co-head">
        <button type="button" className="co-icon-btn" onClick={onBack} aria-label="Zurück">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>
        </button>
        <CoachAvatar size={36} />
        <div className="co-head-txt">
          <span className="co-kicker">KI-Coach</span>
          <h2 className="co-title">Frag den Coach</h2>
        </div>
        {msgs.length > 0 && (
          <button type="button" className="co-text-btn" onClick={reset}>Neu</button>
        )}
      </header>
      <CoachAiLabel />

      <div className="co-log" ref={logRef} role="log" aria-live="polite" aria-busy={busy}>
        <div className="co-row coach">
          <CoachAvatar size={32} />
          <div className="co-bubble"><p>{GREETING}</p></div>
        </div>

        {avail === "off" && (
          <div className="co-off" role="status">
            <b>Der Coach ist noch nicht aktiviert.</b>
            <p>Er braucht eine Internetverbindung und muss vom Betreiber eingeschaltet werden. Bis dahin helfen dir die Karten-Steckbriefe und die Coach-Tipps in der Arena.</p>
          </div>
        )}

        {avail !== "off" && !consent && (
          <CoachConsentCard onAccept={() => { setConsent(true); requestAnimationFrame(() => inputRef.current?.focus()); }} />
        )}

        {msgs.map((m, i) => (
          <div key={i} className={`co-row ${m.role === "user" ? "me" : "coach"}${m.error ? " err" : ""}`}>
            {m.role === "assistant" && <CoachAvatar size={32} />}
            <div className="co-bubble">
              {m.content ? <CoachText text={m.content} /> : <Typing />}
              {m.role === "assistant" && !m.error && m.content && <span className="co-ai-tag">KI-Antwort</span>}
            </div>
          </div>
        ))}

        {tooLong && !busy && (
          <p className="co-note">Langes Gespräch! Tipp auf „Neu“, um frisch zu starten.</p>
        )}
      </div>

      <div className="co-foot">
        {msgs.length === 0 && (
          <div className="co-chips" role="group" aria-label="Schnellfragen">
            {COACH_CHIPS.map((c) => (
              <button key={c} type="button" className="co-chip" disabled={avail !== "on" || !consent} onClick={() => void send(c)}>
                {c}
              </button>
            ))}
          </div>
        )}
        <form
          className="co-input"
          onSubmit={(e) => {
            e.preventDefault();
            void send(draft);
          }}
        >
          <label className="sr-only" htmlFor="co-q">Deine Frage</label>
          <textarea
            id="co-q"
            ref={inputRef}
            rows={1}
            value={draft}
            maxLength={COACH_LIMITS.maxChars}
            disabled={!canType}
            placeholder={avail === "checking" ? "Coach wird geweckt …" : avail === "off" ? "Coach nicht aktiv" : !consent ? "Erst den Hinweis oben bestätigen" : "Frag zum Beispiel: Was ist ein Sprawl?"}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                void send(draft);
              }
            }}
          />
          {busy ? (
            <button type="button" className="co-send stop" onClick={stop} aria-label="Antwort stoppen">
              <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor" /></svg>
            </button>
          ) : (
            <button type="submit" className="co-send" disabled={!canType || !draft.trim()} aria-label="Senden">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h13M13 6l6 6-6 6" /></svg>
            </button>
          )}
        </form>
        <p className="co-disclaimer">
          Technik lernst du auf der Matte mit deinem Trainer. Bei Schmerzen: aufhören und abklären lassen.
          {consent && (
            <> <button type="button" className="co-link-btn" onClick={() => { stop(); setConsent(false); }}>Zustimmung zurücknehmen</button></>
          )}
        </p>
      </div>
    </section>
  );
}

/** Endbildschirm: "Analyse vom Coach" → gestreamte Kurz-Analyse (≤ 90 Wörter). */
export function MatchAnalysis({ summary }: { summary: CoachMatchSummary }) {
  const avail = useAvailability();
  const [consent, setConsent] = useCoachConsent();
  const [text, setText] = useState("");
  const [state, setState] = useState<"idle" | "consent" | "busy" | "done" | "error">("idle");
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => () => abortRef.current?.abort(), []);

  const run = async (accepted = false) => {
    if (!consent && !accepted) {
      setState("consent");
      return;
    }
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setText("");
    setState("busy");
    try {
      const full = await askCoach({ mode: "analysis", match: summary }, setText, ctrl.signal);
      setText(full.trim());
      setState("done");
    } catch (e) {
      if (e instanceof CoachError && e.code === "aborted") {
        setState("idle");
        return;
      }
      setText(e instanceof Error ? e.message : String(e));
      setState("error");
    } finally {
      abortRef.current = null;
    }
  };

  if (avail === "off") return null; // ohne Coach kein toter Knopf auf dem Endbildschirm

  return (
    <div className="co-analysis">
      {state === "idle" ? (
        <button type="button" className="co-analysis-btn" onClick={() => void run()} disabled={avail !== "on"}>
          <CoachAvatar size={34} />
          <span className="co-analysis-txt">
            <span className="co-kicker">KI-Coach</span>
            <b>Analyse vom Coach</b>
          </span>
        </button>
      ) : state === "consent" ? (
        <CoachConsentCard compact onAccept={() => { setConsent(true); void run(true); }} />
      ) : (
        <div className={`co-analysis-card${state === "error" ? " err" : ""}`} aria-live="polite" aria-busy={state === "busy"}>
          <div className="co-analysis-head">
            <CoachAvatar size={30} />
            <span className="co-kicker">Analyse vom Coach</span>
            {state === "busy" && (
              <button type="button" className="co-text-btn" onClick={() => abortRef.current?.abort()}>Stopp</button>
            )}
            {state === "error" && (
              <button type="button" className="co-text-btn" onClick={() => void run()}>Nochmal</button>
            )}
          </div>
          <div className="co-analysis-body">
            {text ? <CoachText text={text} /> : <Typing />}
          </div>
          {state !== "error" && <CoachAiLabel />}
        </div>
      )}
    </div>
  );
}
