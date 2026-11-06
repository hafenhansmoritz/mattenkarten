// Kern 2 – Glossar: alle Schlüsselwörter mit Regel, „Im echten Grappling“ und Beispielkarten; dazu die Fachbegriffe (B19).
import { useMemo } from "react";
import { KEYWORDS, keywordsOf } from "../data/keywords";
import { CARDS2, TERMS2 } from "../data/cards";
import { KeywordExplain } from "./Keywords";
import "../../styles/keywords.css";

/** Beispielkarten je Schlüsselwort (eindeutige Namen, höchstens n). */
export function examplesFor(id: string, n = 4): { names: string[]; total: number } {
  const all = CARDS2.filter((c) => keywordsOf(c).some((k) => k.id === id));
  const names = [...new Set(all.map((c) => c.plain))];
  return { names: names.slice(0, n), total: all.length };
}

export function Glossar({ onBack }: { onBack: () => void }) {
  const ex = useMemo(() => Object.fromEntries(KEYWORDS.map((k) => [k.id, examplesFor(k.id)])), []);
  return (
    <div className="screen more" lang="de">
      <button className="btn small ghost" onClick={onBack}>← Zurück</button>
      <h2 className="display" style={{ fontSize: 30 }}>Glossar</h2>
      <p className="muted small">
        Schlüsselwörter stehen fett auf den Karten. Jedes Wort bedeutet auf jeder Karte genau dieselbe Regel.
        Tippe im Kampf auf ein Wort, dann siehst du diese Erklärung.
      </p>
      <ul className="gl-list">
        {KEYWORDS.map((k) => (
          <li key={k.id} className="gl-item" id={`kw-${k.id}`}>
            <KeywordExplain id={k.id} />
            <p className="gl-ex"><b>Zum Beispiel:</b> {ex[k.id].names.join(" · ")}{ex[k.id].total > ex[k.id].names.length ? ` · insgesamt ${ex[k.id].total} Karten` : ""}</p>
          </li>
        ))}
      </ul>
      <h3 className="display">Fachbegriffe</h3>
      <p className="muted small">Ein Griff hat immer denselben Namen – deutsch auf der Karte, englisch als No-Gi-Fachwort.</p>
      <table className="gl-terms">
        <thead><tr><th scope="col">Auf der Karte</th><th scope="col">Fachbegriff</th></tr></thead>
        <tbody>{TERMS2.map((t) => <tr key={t.nogi}><td>{t.de}</td><td lang="en"><b>{t.nogi}</b></td></tr>)}</tbody>
      </table>
    </div>
  );
}
