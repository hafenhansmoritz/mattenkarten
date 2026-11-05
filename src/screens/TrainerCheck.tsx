import { useEffect, useMemo, useRef, useState } from "react";
import { CARDS } from "../data/cards";
import { POSITION_GUIDE } from "../data/positions";
import { KIND_LABEL, plainTitle } from "../components/cardText";
import type { CardDef, PositionId } from "../engine/types";
import { copyText } from "./ShareDeck";
import "../styles/trainer.css";

export const TRAINER_KEY = "mattenkarten-trainer-v1";
const ORDER: PositionId[] = ["dist", "clinch", "fhl", "guard", "side", "mount", "back"];

export type Verdict = "ok" | "change";
export interface Review { verdict?: Verdict; note: string; at?: string }
export type Reviews = Record<string, Review>;

/** Karten, die ein Trainer prüfen soll: `check: true` oder ohne Quelle. */
export function cardsToReview(cards: CardDef[] = CARDS): CardDef[] {
  return cards.filter((c) => c.check || !c.source);
}

function loadReviews(): Reviews {
  try {
    const raw = localStorage.getItem(TRAINER_KEY);
    const v = raw ? JSON.parse(raw) : {};
    return v && typeof v === "object" ? (v as Reviews) : {};
  } catch {
    return {};
  }
}
function saveReviews(r: Reviews) {
  try { localStorage.setItem(TRAINER_KEY, JSON.stringify(r)); } catch { /* Speichern nicht möglich */ }
}

function why(c: CardDef): string {
  if (c.check && !c.source) return "ohne Quelle, zur Prüfung markiert";
  if (!c.source) return "ohne Quelle";
  return "nur Sekundärquelle, zur Prüfung markiert";
}

function roles(c: CardDef): string {
  const r = [...new Set(c.slots.map((s) => s.role))];
  return r.map((x) => (x === "top" ? "oben" : x === "bottom" ? "unten" : "Stand")).join(" / ");
}

/** Markdown-Prüfbericht aller Urteile und Notizen. */
export function buildReport(cards: CardDef[], reviews: Reviews, reviewer: string, date = new Date()): string {
  const done = cards.filter((c) => reviews[c.id]?.verdict);
  const ok = done.filter((c) => reviews[c.id].verdict === "ok");
  const change = done.filter((c) => reviews[c.id].verdict === "change");
  const open = cards.filter((c) => !reviews[c.id]?.verdict);
  const line = (c: CardDef) => {
    const r = reviews[c.id];
    const pos = POSITION_GUIDE[c.slots[0].pos];
    const note = r?.note?.trim() ? `\n  - Notiz: ${r.note.trim().replace(/\n+/g, " / ")}` : "";
    return `- **${plainTitle(c)}** (${c.name}, \`${c.id}\`) – ${pos.term}${note}`;
  };
  const out: string[] = [
    "# Mattenkarten – Trainer-Prüfbericht",
    "",
    `- Datum: ${date.toISOString().slice(0, 10)}`,
    `- Geprüft von: ${reviewer.trim() || "(ohne Namen)"}`,
    `- Stand: ${done.length}/${cards.length} geprüft – ${ok.length} stimmt, ${change.length} ändern, ${open.length} offen`,
    "",
  ];
  if (change.length) out.push("## Ändern", "", ...change.map(line), "");
  if (ok.length) out.push("## Stimmt", "", ...ok.map(line), "");
  if (open.length) out.push("## Noch offen", "", ...open.map(line), "");
  return out.join("\n");
}

function ReviewCard({ c, r, onChange }: { c: CardDef; r: Review; onChange: (r: Review) => void }) {
  const noteRef = useRef<HTMLTextAreaElement>(null);
  const [showNote, setShowNote] = useState(r.verdict === "change" || !!r.note);
  const set = (verdict: Verdict) => {
    onChange({ ...r, verdict: r.verdict === verdict ? undefined : verdict, at: new Date().toISOString() });
    if (verdict === "change") { setShowNote(true); setTimeout(() => noteRef.current?.focus(), 0); }
  };
  return (
    <article className={`tr-card tr-k-${c.kind} ${r.verdict ? `is-${r.verdict}` : ""}`}>
      <header className="tr-card-h">
        <div>
          <h4 className="tr-plain">{plainTitle(c)}</h4>
          <p className="tr-term">{c.name}{c.de && c.de !== plainTitle(c) ? ` · ${c.de}` : ""}</p>
        </div>
        <span className="tr-kind label">{KIND_LABEL[c.kind]}</span>
      </header>
      <p className="tr-meta small"><span>{roles(c)}</span><span className="tr-why">{why(c)}</span></p>
      {c.plainDo && <p className="tr-do">{c.plainDo}</p>}
      <p className="small muted">{c.desc}</p>
      {c.keys.length > 0 && (
        <div className="tr-block"><span className="label">Darauf achten</span><ul>{c.keys.map((k) => <li key={k}>{k}</li>)}</ul></div>
      )}
      {c.mistakes.length > 0 && (
        <div className="tr-block tr-mistakes"><span className="label">Typische Fehler</span><ul>{c.mistakes.map((k) => <li key={k}>{k}</li>)}</ul></div>
      )}
      {c.safety && <div className="tr-block tr-safety"><span className="label">Sicherheit</span><p>{c.safety}</p></div>}
      <p className="small tr-src">
        Quelle:{" "}
        {c.source ? <a href={c.source.url} target="_blank" rel="noopener noreferrer">{c.source.title}</a> : <span className="tr-warn">keine – bitte ergänzen, wenn du eine kennst</span>}
      </p>
      <div className="tr-verdict" role="group" aria-label={`Urteil zu ${plainTitle(c)}`}>
        <button className={`btn small tr-yes ${r.verdict === "ok" ? "on" : ""}`} aria-pressed={r.verdict === "ok"} onClick={() => set("ok")}>Stimmt</button>
        <button className={`btn small tr-no ${r.verdict === "change" ? "on" : ""}`} aria-pressed={r.verdict === "change"} onClick={() => set("change")}>Ändern</button>
        {!showNote && <button className="btn ghost small" onClick={() => setShowNote(true)}>Notiz</button>}
      </div>
      {showNote && (
        <label className="tr-field">
          <span className="label">{r.verdict === "change" ? "Was soll anders sein?" : "Notiz"}</span>
          <textarea ref={noteRef} className="tr-input tr-note" rows={3} value={r.note}
            placeholder="z. B. Kopf außen statt innen, besser: …"
            onChange={(e) => onChange({ ...r, note: e.target.value })} />
        </label>
      )}
    </article>
  );
}

export function TrainerCheck({ onBack }: { onBack: () => void }) {
  const cards = useMemo(() => cardsToReview(), []);
  const [reviews, setReviews] = useState<Reviews>(loadReviews);
  const [reviewer, setReviewer] = useState(() => loadReviews()["__reviewer"]?.note ?? "");
  const [onlyOpen, setOnlyOpen] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const reportRef = useRef<HTMLTextAreaElement>(null);
  const [showReport, setShowReport] = useState(false);

  useEffect(() => { saveReviews({ ...reviews, __reviewer: { note: reviewer } }); }, [reviews, reviewer]);

  const done = cards.filter((c) => reviews[c.id]?.verdict).length;
  const groups = ORDER.map((p) => ({
    p,
    cards: cards.filter((c) => c.slots[0].pos === p && (!onlyOpen || !reviews[c.id]?.verdict)),
  })).filter((g) => g.cards.length);
  const report = buildReport(cards, reviews, reviewer);

  const copyReport = async () => {
    setShowReport(true);
    await new Promise((r) => setTimeout(r, 0));
    const ok = await copyText(report, reportRef.current);
    setMsg(ok ? "Prüfbericht kopiert – schick ihn uns per Mail oder Chat." : "Kopieren ging nicht – der Bericht ist markiert, kopiere ihn selbst.");
  };

  return (
    <div className="screen tr-screen">
      <header className="tr-head">
        <button className="btn ghost small" onClick={onBack} aria-label="Zurück">← Zurück</button>
        <h2 className="display">Trainer-Modus</h2>
      </header>

      <section className="tr-panel tr-intro">
        <h3 className="tr-h">Hilf uns, die Inhalte zu prüfen</h3>
        <p className="small">
          Du trainierst BJJ, Judo, Ringen oder MMA? Diese Karten haben noch keine Primärquelle oder sind zur Prüfung markiert.
          Lies, was Anfänger hier lernen, und sag uns: <strong>Stimmt</strong> es – oder sollen wir es <strong>ändern</strong>?
        </p>
        <p className="small muted">
          Deine Urteile bleiben nur auf diesem Gerät. Am Ende kopierst du den Prüfbericht und schickst ihn uns.
          Weitere offene Fragen (Regeln, Punkte, Konter-Ketten) stehen in der Wissensbasis unter „Offene Prüfpunkte“.
        </p>
        <label className="tr-field">
          <span className="label">Dein Name / Verein (optional)</span>
          <input className="tr-input" value={reviewer} onChange={(e) => setReviewer(e.target.value)} placeholder="z. B. Anna, BJJ Braungurt, Team Nord" />
        </label>
      </section>

      <div className="tr-progress" role="status" aria-label={`${done} von ${cards.length} geprüft`}>
        <div className="tr-progress-t"><span className="num">{done}/{cards.length}</span> geprüft</div>
        <div className="tr-progress-bar"><i style={{ width: `${cards.length ? (done / cards.length) * 100 : 0}%` }} /></div>
        <label className="tr-toggle small"><input type="checkbox" checked={onlyOpen} onChange={(e) => setOnlyOpen(e.target.checked)} /> nur offene</label>
      </div>

      {groups.map((g) => (
        <section key={g.p} className="tr-group">
          <h3 className="tr-group-h">
            {POSITION_GUIDE[g.p].plain} <span className="muted small">{POSITION_GUIDE[g.p].term}</span>
          </h3>
          {g.cards.map((c) => (
            <ReviewCard key={c.id} c={c} r={reviews[c.id] ?? { note: "" }} onChange={(r) => setReviews((all) => ({ ...all, [c.id]: r }))} />
          ))}
        </section>
      ))}
      {groups.length === 0 && <p className="muted center">{onlyOpen ? "Alles geprüft – danke!" : "Gerade gibt es nichts zu prüfen."}</p>}

      <section className="tr-panel tr-report">
        <div className="tr-row">
          <button className="btn primary" onClick={copyReport} disabled={!cards.length}>Prüfbericht kopieren</button>
          <button className="btn ghost small" onClick={() => setShowReport((v) => !v)}>{showReport ? "Bericht ausblenden" : "Bericht ansehen"}</button>
        </div>
        {msg && <p className="small tr-status" role="status">{msg}</p>}
        {showReport && <textarea ref={reportRef} className="tr-input tr-report-text" readOnly rows={10} value={report} />}
      </section>
    </div>
  );
}
