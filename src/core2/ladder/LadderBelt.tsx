// Mechanik 10: Gürtel-Grafik der Rangliste (Band, Knoten, schwarzes Feld mit 4 Streifen) – Farben wie die Kampagnen-Gürtel.
import { BELT_COLOR, BELT_IDS, STRIPES, TOP, beltName, inGate, rankText, seasonName } from "./ladder";
import { readLadder } from "./store";
import "../../styles/rangliste.css";

export function LadderBelt({ belt, stripes, gate, size = "big" }: { belt: number; stripes: number; gate?: boolean; size?: "big" | "small" }) {
  const b = BELT_COLOR[BELT_IDS[belt]];
  const bar = belt === TOP ? "#c8102e" : "#111";
  return (
    <svg className={`lad-belt lad-belt-${size}`} viewBox="0 0 300 64" role="img"
      aria-label={`${beltName(belt)}-Gurt (Spielrang), ${stripes} von ${STRIPES} Streifen${gate ? ", Gürtelprüfung" : ""}`}>
      <rect x="2" y="16" width="296" height="26" rx="4" fill={b.c} stroke="rgba(255,255,255,.22)" />
      <rect x="2" y="27" width="296" height="2" fill="rgba(0,0,0,.12)" />
      <rect x="180" y="16" width="96" height="26" fill={bar} />
      {Array.from({ length: STRIPES }, (_, i) => {
        const on = i < stripes;
        return <rect key={i} x={190 + i * 21} y="19" width="11" height="20" rx="1.5" className={on ? "lad-stripe on" : "lad-stripe"}
          fill={on ? "#f4f4f4" : "rgba(255,255,255,.08)"} stroke={on ? "none" : "rgba(255,255,255,.35)"} strokeDasharray={on ? undefined : "3 2"} />;
      })}
      {/* Knoten mit Enden wie in der Kampagne */}
      <rect x="72" y="36" width="12" height="26" rx="2" fill={b.c} stroke="rgba(0,0,0,.25)" transform="rotate(10 78 36)" />
      <rect x="90" y="36" width="12" height="26" rx="2" fill={b.c} stroke="rgba(0,0,0,.25)" transform="rotate(-10 96 36)" />
      <rect x="74" y="10" width="26" height="36" rx="4" fill={b.c} stroke="rgba(0,0,0,.35)" strokeWidth="1.5" />
      {gate && <text x="228" y="12" textAnchor="middle" className="lad-gate-mark">Prüfung</text>}
    </svg>
  );
}


/** Eintrag „Rangliste“ auf der Startseite (Kampagne): Stand auf einen Blick, ohne den Ranglisten-Bildschirm zu laden. */
export function LadderCard({ onOpen }: { onOpen: () => void }) {
  const s = readLadder();
  return (
    <button type="button" className="lad-home" onClick={onOpen}>
      <LadderBelt belt={s?.belt ?? 0} stripes={s?.stripes ?? 0} gate={s ? inGate(s) : false} size="small" />
      <span>
        <strong className="display">Rangliste</strong>
        <span className="muted small">{s ? `${rankText(s)} · ${seasonName(s.season)}` : "Spielränge Weiß bis Schwarz gegen die KI."} Spielrang, kein echter Gürtel.</span>
      </span>
    </button>
  );
}
