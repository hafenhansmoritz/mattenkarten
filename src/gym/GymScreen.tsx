// „Fürs Gym“: Positionsspiele (53), Partner-Modus (58), Trainer-Modus (59), Gym-Code / Wochenthema (60).
// Kein Server, keine Netzwerk-Aufrufe: Codes und Links entstehen und lesen sich nur im Gerät.
import { useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { Pos2 } from "../core2/types";
import { ArenaK2 } from "../core2/ui/ArenaK2";
import { FightersK2 } from "../core2/ui/FightersK2";
import { TUTORIALS_K2 } from "../core2/data/tutorials";
import { LESSONS_PROGRAM } from "../program/lessons";
import { Quiz, type QuizResult } from "../program/Quiz";
import { POS_LABEL } from "../journey/recommend";
import { localDate } from "../journey/schedule";
import { copyText } from "../screens/ShareDeck";
import { sfx } from "../sound";
import {
  GAME_BY_ID, GAME_POSITIONS, GAME_SOURCES, GAMES, INTENSITY_NOTE, SHOW_TRAINER, TRAINER_LABEL,
  durationLabel, gamesFor, intensityLabel, type PositionalGame,
} from "./games";
import { decodeGym, encodeGym, gymLink, GYM_POS_ORDER, readGymFromHash, type DecodedGym } from "./gymCode";
import { drillSources, gameSource, type ReaderSource } from "./reader";
import { ReaderView } from "./ReaderView";
import { TrainerView } from "./TrainerView";
import type { TrainerSource } from "./trainerMode";
import { clearGym, isStale, lessonDef, saveGym, themeTitle, useGym, weekPlan, type StoredGym } from "./store";
import "../program/program.css";
import "./gym.css";

export type GymStart = "home" | "week";

type View =
  | { kind: "home" }
  | { kind: "games"; pos: Pos2 | null }
  | { kind: "game"; id: string }
  | { kind: "readerPick" }
  | { kind: "reader"; src: ReaderSource }
  | { kind: "trainerPick" }
  | { kind: "trainer"; src: TrainerSource }
  | { kind: "create" }
  | { kind: "enter" }
  | { kind: "import"; gym: DecodedGym; code: string }
  | { kind: "week" }
  | { kind: "lesson"; id: string }
  | { kind: "quiz"; ids: string[] }
  | { kind: "quizDone"; res: QuizResult[] };

const ALL_LESSONS = [...TUTORIALS_K2, ...LESSONS_PROGRAM];

function formatDate(s: string): string {
  const [y, m, d] = s.split("-").map(Number);
  try {
    return new Date(y, m - 1, d, 12).toLocaleDateString("de-DE", { weekday: "short", day: "numeric", month: "short" });
  } catch { return s; }
}

function clearHash() {
  try { if (/gym=/.test(location.hash)) history.replaceState(null, "", location.pathname + location.search); } catch { /* egal */ }
}

export function GymScreen({ onBack, start = "home" }: { onBack: () => void; start?: GymStart }) {
  const gym = useGym();
  const [view, setView] = useState<View>(() => {
    try {
      const m = /(?:^#|&)gym=([^&]+)/.exec(location.hash);
      if (m) {
        const g = readGymFromHash();
        if (g) return { kind: "import", gym: g, code: decodeURIComponent(m[1]) };
        clearHash();
        return { kind: "enter" };
      }
    } catch { /* ohne Fenster */ }
    return start === "week" && gym ? { kind: "week" } : { kind: "home" };
  });
  const [stack, setStack] = useState<View[]>([]);
  const open = (v: View) => { sfx.select(); setStack((s) => [...s, view]); setView(v); };
  const back = () => {
    if (!stack.length) { onBack(); return; }
    setView(stack[stack.length - 1]);
    setStack((s) => s.slice(0, -1));
  };
  const home = () => { setStack([]); setView({ kind: "home" }); };

  if (view.kind === "lesson") {
    const t = lessonDef(view.id);
    if (t) return <ArenaK2 key={t.id} mode="tutorial" tutorial={t} aiLevel={t.aiLevel} onExit={back} />;
  }
  if (view.kind === "trainer") return <TrainerView src={view.src} onBack={back} />;
  if (view.kind === "reader") return <div className="pg-wrap"><ReaderView src={view.src} onBack={back} /></div>;

  return (
    <div className="pg-wrap">
      <div className="pg-screen gy-screen">
        <AnimatePresence mode="wait">
          <motion.div key={view.kind + ("id" in view ? view.id : "") + ("pos" in view ? String(view.pos) : "")}
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22, ease: [0.2, 0.7, 0.2, 1] }} className="pg-screen">
            <div className="pg-top">
              <button className="btn small ghost" onClick={view.kind === "home" ? onBack : back}>← Zurück</button>
              <span className="label muted">Fürs Gym</span>
            </div>
            {view.kind === "home" && <Hub gym={gym} open={open} />}
            {view.kind === "games" && <GameList pos={view.pos} onPos={(pos) => setView({ kind: "games", pos })} onOpen={(id) => open({ kind: "game", id })} />}
            {view.kind === "game" && GAME_BY_ID[view.id] && <GameDetail g={GAME_BY_ID[view.id]} open={open} />}
            {view.kind === "readerPick" && <ReaderPick onPick={(src) => open({ kind: "reader", src })} />}
            {view.kind === "trainerPick" && <TrainerPick onPick={(src) => open({ kind: "trainer", src })} />}
            {view.kind === "create" && <CreateTheme onAdopt={(g, code) => { saveGym(g, code, localDate()); setStack([]); setView({ kind: "week" }); }} />}
            {view.kind === "enter" && <EnterCode onOk={(g, code) => setView({ kind: "import", gym: g, code })} />}
            {view.kind === "import" && (
              <ImportTheme gym={view.gym}
                onYes={() => { saveGym(view.gym, view.code, localDate()); clearHash(); setStack([]); setView({ kind: "week" }); }}
                onNo={() => { clearHash(); home(); }} />
            )}
            {view.kind === "week" && (gym
              ? <Week gym={gym} open={open} onClear={() => { clearGym(); home(); }} />
              : <EnterCode onOk={(g, code) => setView({ kind: "import", gym: g, code })} />)}
            {view.kind === "quiz" && <Quiz ids={view.ids} kicker="Wochenthema" onDone={(res) => setView({ kind: "quizDone", res })} />}
            {view.kind === "quizDone" && (
              <div className="pg-panel center">
                <span className="label">Wiederholung fertig</span>
                <h3 className="display pg-h"><span className="num">{view.res.filter((r) => r.ok).length}</span> von {view.res.length} beim ersten Mal</h3>
                <p className="muted small">Was noch wackelt: Frag im Training danach.</p>
                <button className="btn primary big" onClick={back}>Zurück zum Wochenthema</button>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ---------- Kompakte Karte für die Programm-Startseite ---------- */

export function GymWeekCard({ onOpen }: { onOpen: () => void }) {
  const gym = useGym();
  if (!gym) return null;
  const stale = isStale(gym.date, localDate());
  return (
    <motion.button type="button" className="gy-week-card" onClick={() => { sfx.select(); onOpen(); }}
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <span className="gy-week-fig" aria-hidden="true"><FightersK2 pos={gym.positions[0]} top={gym.positions[0] === "stand" || gym.positions[0] === "clinch" ? null : "o"} /></span>
      <span className="gy-week-txt">
        <span className="label gy-kicker">{stale ? `Wochenthema vom ${formatDate(gym.date)}` : "Dein Gym übt diese Woche"}</span>
        <strong className="display">{themeTitle(gym.positions)}</strong>
        <span className="small muted">Passende Lektionen, Fragen und Spiele für den Trainer.</span>
      </span>
      <span className="gy-go" aria-hidden="true">›</span>
    </motion.button>
  );
}

/* ---------- Übersicht ---------- */

function Hub({ gym, open }: { gym: StoredGym | null; open: (v: View) => void }) {
  const tiles: { v: View; title: string; text: string; tag?: string }[] = [
    { v: { kind: "games", pos: null }, title: "Positionsspiele", text: `${GAMES.length} Spiele für die ersten Monate. Zeig sie deinem Trainer.`, tag: TRAINER_LABEL },
    { v: { kind: "readerPick" }, title: "Partner-Modus", text: "Ein Handy, einer liest vor, einer übt. Mit Timer, dann Rollen tauschen." },
    { v: { kind: "trainerPick" }, title: "Trainer-Modus", text: "Für Beamer oder Tablet: große Schrift, Szene, Folie für Folie mit Clicker." },
    { v: { kind: "create" }, title: "Wochenthema erstellen", text: "Für Trainer: Thema wählen, Code oder Link an die Gruppe schicken." },
  ];
  return (
    <>
      <header>
        <span className="label pg-kicker">Fürs Gym</span>
        <h2 className="display pg-title">Mit Trainer üben</h2>
        <p className="muted pg-promise">Die App ersetzt kein Training. Sie hilft dir, es vorzubereiten und mitzubringen.</p>
      </header>
      {gym ? (
        <button type="button" className="gy-week-card" onClick={() => open({ kind: "week" })}>
          <span className="gy-week-txt">
            <span className="label gy-kicker">Dein Gym übt diese Woche</span>
            <strong className="display">{themeTitle(gym.positions)}</strong>
            <span className="small muted">Seit {formatDate(gym.date)} · Lektionen, Fragen, Spiele</span>
          </span>
          <span className="gy-go" aria-hidden="true">›</span>
        </button>
      ) : (
        <button type="button" className="gy-code-cta" onClick={() => open({ kind: "enter" })}>
          <b>Code vom Trainer?</b> <span className="small muted">Hier eingeben – dann siehst du das Wochenthema.</span>
        </button>
      )}
      <div className="gy-tiles">
        {tiles.map((t, k) => (
          <motion.button key={t.title} type="button" className="gy-tile" onClick={() => open(t.v)}
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: k * 0.05 }}>
            {t.tag && <span className="gy-badge">{t.tag}</span>}
            <strong className="display">{t.title}</strong>
            <span className="small muted">{t.text}</span>
          </motion.button>
        ))}
      </div>
    </>
  );
}

/* ---------- Positionsspiele ---------- */

function TrainerNote() {
  return (
    <div className="gy-trainer-note" role="note">
      <span className="gy-badge">{TRAINER_LABEL}</span>
      <p><b>{SHOW_TRAINER}</b> Allein oder mit Freunden zu Hause: bitte nicht.</p>
    </div>
  );
}

function GameList({ pos, onPos, onOpen }: { pos: Pos2 | null; onPos: (p: Pos2 | null) => void; onOpen: (id: string) => void }) {
  const list = pos ? gamesFor(pos) : GAMES;
  return (
    <>
      <header>
        <h2 className="display pg-h">Positionsspiele</h2>
        <p className="muted small">Kurze Runden aus einer festen Lage. Jeder hat ein Ziel, Regeln machen es leichter.</p>
      </header>
      <TrainerNote />
      <div className="gy-chips" role="group" aria-label="Nach Position filtern">
        <button type="button" className={pos === null ? "on" : ""} aria-pressed={pos === null} onClick={() => onPos(null)}>Alle</button>
        {GAME_POSITIONS.map((p) => (
          <button key={p} type="button" className={pos === p ? "on" : ""} aria-pressed={pos === p} onClick={() => onPos(p)}>{POS_LABEL[p]}</button>
        ))}
      </div>
      <ul className="gy-game-list">
        {list.map((g) => (
          <li key={g.id}>
            <button type="button" className="gy-game-row" onClick={() => onOpen(g.id)}>
              <span className="gy-game-fig" aria-hidden="true"><FightersK2 pos={g.pos} top={g.top} /></span>
              <span className="gy-game-txt">
                <span className="label muted">{POS_LABEL[g.pos]} · Monat {g.month === 1 ? "1" : "2–3"} · {intensityLabel(g)}</span>
                <strong>{g.title}</strong>
                <span className="small muted">{g.idea}</span>
              </span>
              <span className="gy-go" aria-hidden="true">›</span>
            </button>
          </li>
        ))}
      </ul>
    </>
  );
}

function GameDetail({ g, open }: { g: PositionalGame; open: (v: View) => void }) {
  const lesson = g.lessonId ? lessonDef(g.lessonId) : undefined;
  return (
    <article className="gy-game">
      <div className="gy-game-scene" aria-hidden="true">
        <FightersK2 pos={g.pos} top={g.top} />
        <span className="gy-badge big">{TRAINER_LABEL}</span>
      </div>
      <span className="label muted">Positionsspiel · {POS_LABEL[g.pos]} · Monat {g.month === 1 ? "1" : "2–3"}</span>
      <h2 className="display pg-h">{g.title}</h2>
      <p className="pg-lead">{g.idea}</p>
      <TrainerNote />
      <div className="gy-roles">
        <section className="gy-role a"><span className="label">Blau · {g.a.role}</span><p>{g.a.goal}</p></section>
        <section className="gy-role b"><span className="label">Rot · {g.b.role}</span><p>{g.b.goal}</p></section>
      </div>
      <h3 className="gy-h3">Regeln</h3>
      <ul className="gy-rules">{g.rules.map((r) => <li key={r}>{r}</li>)}</ul>
      <dl className="gy-meta">
        <div><dt>Intensität</dt><dd className="num">{intensityLabel(g)}</dd></div>
        <div><dt>Dauer</dt><dd>{durationLabel(g)}</dd></div>
      </dl>
      <p className="small muted">{INTENSITY_NOTE}</p>
      <p className="pg-safety gy-safety"><b>Sicherheit:</b> {g.safety}</p>
      {g.check && <p className="small muted">Die Spielform ist ein Vorschlag. Dein Trainer entscheidet, ob und wie ihr sie spielt.</p>}
      <div className="pg-row">
        <button className="btn primary big" onClick={() => open({ kind: "reader", src: gameSource(g) })}>Vorlesen (Partner-Modus)</button>
        <button className="btn big" onClick={() => open({ kind: "trainer", src: { kind: "game", game: g } })}>Am Beamer zeigen</button>
      </div>
      {lesson && (
        <button type="button" className="pg-warmup-go" onClick={() => open({ kind: "lesson", id: lesson.id })}>
          <span className="pg-warmup-ico" aria-hidden="true">▶</span>
          <span><b>Vorher in der App: {lesson.title}</b> <span className="small muted">· {lesson.idea}</span></span>
          <span aria-hidden="true">›</span>
        </button>
      )}
      <details className="gy-sources">
        <summary>Quellen ({g.sources.length})</summary>
        <ul>
          {g.sources.map((k) => {
            const s = GAME_SOURCES[k];
            const ext = /^https?:/.test(s.url);
            return (
              <li key={k}>
                <span className={`gy-mark m-${s.mark}`}>{s.mark === "belegt" ? "belegt" : `[${s.mark}]`}</span>{" "}
                {ext ? <a href={s.url} target="_blank" rel="noopener noreferrer">{s.title}</a> : <span>{s.title}</span>}
                <span className="small muted"> – {s.note}</span>
              </li>
            );
          })}
        </ul>
      </details>
    </article>
  );
}

/* ---------- Partner-Modus: Auswahl ---------- */

function ReaderPick({ onPick }: { onPick: (s: ReaderSource) => void }) {
  const drills = useMemo(drillSources, []);
  return (
    <>
      <header>
        <h2 className="display pg-h">Partner-Modus</h2>
        <p className="muted small">Ein Handy reicht. Einer liest groß vor, der andere übt. Danach tauscht ihr. Geht auch offline.</p>
      </header>
      <h3 className="gy-h3">Solo-Drills <span className="small muted">· auch zu Hause</span></h3>
      <div className="gy-pick">
        {drills.map((d) => <button key={d.id} type="button" className="gy-pick-btn" onClick={() => onPick(d)}>{d.title}</button>)}
      </div>
      <h3 className="gy-h3">Positionsspiele <span className="gy-badge">{TRAINER_LABEL}</span></h3>
      <p className="small muted">Nur im Training, wenn dein Trainer zustimmt.</p>
      <div className="gy-pick">
        {GAMES.map((g) => <button key={g.id} type="button" className="gy-pick-btn" onClick={() => onPick(gameSource(g))}>{g.title}</button>)}
      </div>
    </>
  );
}

/* ---------- Trainer-Modus: Auswahl ---------- */

function TrainerPick({ onPick }: { onPick: (s: TrainerSource) => void }) {
  return (
    <>
      <header>
        <h2 className="display pg-h">Trainer-Modus</h2>
        <p className="muted small">Für Beamer, Fernseher oder Tablet quer. Weiter mit Pfeiltasten, Leertaste oder Clicker. F schaltet Vollbild.</p>
      </header>
      <h3 className="gy-h3">Positionsspiele</h3>
      <div className="gy-pick">
        {GAMES.map((g) => <button key={g.id} type="button" className="gy-pick-btn" onClick={() => onPick({ kind: "game", game: g })}>{g.title}</button>)}
      </div>
      <h3 className="gy-h3">Lektionen</h3>
      <div className="gy-pick">
        {ALL_LESSONS.map((l) => <button key={l.id} type="button" className="gy-pick-btn" onClick={() => onPick({ kind: "lesson", lesson: l })}>{l.title}</button>)}
      </div>
    </>
  );
}

/* ---------- Gym-Code: erstellen ---------- */

function CreateTheme({ onAdopt }: { onAdopt: (g: DecodedGym, code: string) => void }) {
  const [positions, setPositions] = useState<Pos2[]>([]);
  const [games, setGames] = useState<string[]>([]);
  const [msg, setMsg] = useState("");
  const ref = useRef<HTMLInputElement>(null);
  const date = localDate();
  const toggle = (p: Pos2) => {
    sfx.select();
    if (positions.includes(p)) {
      setPositions(positions.filter((x) => x !== p));
      setGames(games.filter((id) => GAME_BY_ID[id]?.pos !== p));
    } else {
      setPositions(GYM_POS_ORDER.filter((x) => x === p || positions.includes(x)));
      setGames([...games, ...gamesFor(p).map((g) => g.id)]);
    }
    setMsg("");
  };
  const offered = GAMES.filter((g) => positions.includes(g.pos));
  const code = positions.length ? encodeGym({ positions, games, date }) : "";
  const link = code ? gymLink(code) : "";
  const canShare = typeof navigator !== "undefined" && !!navigator.share;
  return (
    <>
      <header>
        <span className="label pg-kicker">Für Trainer</span>
        <h2 className="display pg-h">Wochenthema</h2>
        <p className="muted small">Wähl, was ihr diese Woche übt. Die App macht daraus einen kurzen Code. Kein Konto, kein Server.</p>
      </header>
      <h3 className="gy-h3">1 · Positionen</h3>
      <div className="gy-chips" role="group" aria-label="Positionen der Woche">
        {GYM_POS_ORDER.map((p) => (
          <button key={p} type="button" className={positions.includes(p) ? "on" : ""} aria-pressed={positions.includes(p)} onClick={() => toggle(p)}>{POS_LABEL[p]}</button>
        ))}
      </div>
      {positions.length > 0 && (
        <>
          <h3 className="gy-h3">2 · Positionsspiele <span className="small muted">· {games.length} gewählt</span></h3>
          {offered.length ? (
            <ul className="gy-check-list">
              {offered.map((g) => {
                const on = games.includes(g.id);
                return (
                  <li key={g.id}>
                    <button type="button" className={on ? "on" : ""} aria-pressed={on}
                      onClick={() => setGames(on ? games.filter((x) => x !== g.id) : [...games, g.id])}>
                      <span className="pg-box">{on ? "✓" : ""}</span>
                      <span><b>{g.title}</b> <span className="small muted">· {intensityLabel(g)}</span></span>
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : <p className="small muted">Für diese Position gibt es noch kein Spiel. Lektionen und Fragen kommen trotzdem.</p>}
          <h3 className="gy-h3">3 · Teilen</h3>
          <div className="gy-share">
            <span className="label muted">Dein Gym übt diese Woche</span>
            <strong className="display">{themeTitle(positions)}</strong>
            <input ref={ref} className="gy-code-in num" readOnly value={code} aria-label="Gym-Code" onFocus={(e) => e.currentTarget.select()} />
            <div className="pg-row">
              <button className="btn primary" onClick={async () => setMsg((await copyText(link, ref.current)) ? "Link kopiert." : "Bitte selbst kopieren.")}>Link kopieren</button>
              <button className="btn" onClick={async () => setMsg((await copyText(code, ref.current)) ? "Code kopiert." : "Bitte selbst kopieren.")}>Code kopieren</button>
              {canShare && (
                <button className="btn" onClick={() => { void navigator.share({ title: "Wochenthema", text: `Diese Woche: ${themeTitle(positions)}`, url: link }).catch(() => {}); }}>Teilen …</button>
              )}
            </div>
            {msg && <p className="small" role="status">{msg}</p>}
            <p className="small muted">Der Code enthält nur Positionen, Spiele und das Datum. Keine Namen.</p>
          </div>
          <button className="btn small ghost" onClick={() => onAdopt({ positions, games, date, unknownGames: 0 }, code)}>Selbst als Wochenthema übernehmen</button>
        </>
      )}
    </>
  );
}

/* ---------- Gym-Code: eingeben und übernehmen ---------- */

function EnterCode({ onOk }: { onOk: (g: DecodedGym, code: string) => void }) {
  const [txt, setTxt] = useState("");
  const [err, setErr] = useState(false);
  const submit = () => {
    const g = decodeGym(txt);
    if (!g) { setErr(true); return; }
    const m = /GYM1-[A-Za-z0-9_-]+/i.exec(txt);
    onOk(g, m ? m[0] : txt.trim());
  };
  return (
    <>
      <header>
        <h2 className="display pg-h">Code vom Trainer</h2>
        <p className="muted small">Füg den Code oder Link ein, den dein Trainer geschickt hat. Er beginnt mit GYM1-.</p>
      </header>
      <form className="gy-share" onSubmit={(e) => { e.preventDefault(); submit(); }}>
        <input className="gy-code-in num" value={txt} placeholder="GYM1-…" aria-label="Gym-Code"
          onChange={(e) => { setTxt(e.target.value); setErr(false); }} autoCapitalize="characters" autoComplete="off" spellCheck={false} />
        <button className="btn primary big" type="submit" disabled={!txt.trim()}>Übernehmen</button>
        {err && <p className="small gy-err" role="alert">Der Code passt nicht. Prüf ihn oder frag deinen Trainer nach einem neuen.</p>}
      </form>
    </>
  );
}

function ImportTheme({ gym, onYes, onNo }: { gym: DecodedGym; onYes: () => void; onNo: () => void }) {
  const plan = weekPlan(gym);
  return (
    <div className="pg-panel center gy-import">
      <span className="label">Wochenthema von deinem Gym</span>
      <h2 className="display pg-h">{plan.title}</h2>
      <p className="muted small">Ab {formatDate(gym.date)} · {plan.lessons.length} Lektionen · {plan.questions.length} Fragen · {plan.games.length} Spiele</p>
      {gym.unknownGames > 0 && <p className="small muted">{gym.unknownGames} Spiel(e) kennt diese App-Version noch nicht.</p>}
      <button className="btn primary big" onClick={onYes}>Übernehmen</button>
      <button className="btn ghost" onClick={onNo}>Nein, danke</button>
      <p className="small muted">Gespeichert wird nur auf deinem Gerät. Ein neuer Code ersetzt das alte Thema.</p>
    </div>
  );
}

/* ---------- Wochenthema (Schüler) ---------- */

function Week({ gym, open, onClear }: { gym: StoredGym; open: (v: View) => void; onClear: () => void }) {
  const plan = weekPlan(gym);
  const stale = isStale(gym.date, localDate());
  return (
    <>
      <header className="gy-week-head">
        <span className="label pg-kicker">Dein Gym übt diese Woche</span>
        <h2 className="display pg-title">{plan.title}</h2>
        <p className="muted small">Thema vom {formatDate(gym.date)}{stale ? " – schon älter. Frag nach dem neuen Code." : ""}</p>
      </header>
      <div className="gy-week-scenes" aria-hidden="true">
        {gym.positions.slice(0, 3).map((p) => (
          <span key={p} className="gy-week-fig"><FightersK2 pos={p} top={p === "stand" || p === "clinch" ? null : "o"} /></span>
        ))}
      </div>

      <section className="gy-sec">
        <h3 className="gy-h3">1 · Zur Vorbereitung: Lektionen</h3>
        {plan.lessons.map((id) => {
          const l = lessonDef(id)!;
          return (
            <button key={id} type="button" className="pg-warmup-go" onClick={() => open({ kind: "lesson", id })}>
              <span className="pg-warmup-ico" aria-hidden="true">▶</span>
              <span><b>{l.title}</b> <span className="small muted">· {l.idea}</span></span>
              <span aria-hidden="true">›</span>
            </button>
          );
        })}
      </section>

      {plan.questions.length > 0 && (
        <section className="gy-sec">
          <h3 className="gy-h3">2 · Wiederholen</h3>
          <button className="btn big" onClick={() => open({ kind: "quiz", ids: plan.questions })}>
            {plan.questions.length} Fragen zum Thema
          </button>
        </section>
      )}

      {plan.games.length > 0 && (
        <section className="gy-sec">
          <h3 className="gy-h3">3 · Im Training: Positionsspiele <span className="gy-badge">{TRAINER_LABEL}</span></h3>
          <p className="small muted">{SHOW_TRAINER}</p>
          <ul className="gy-game-list">
            {plan.games.map((g) => (
              <li key={g.id}>
                <button type="button" className="gy-game-row" onClick={() => open({ kind: "game", id: g.id })}>
                  <span className="gy-game-fig" aria-hidden="true"><FightersK2 pos={g.pos} top={g.top} /></span>
                  <span className="gy-game-txt"><strong>{g.title}</strong><span className="small muted">{g.idea}</span></span>
                  <span className="gy-go" aria-hidden="true">›</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
      <div className="pg-row">
        <button className="btn small ghost" onClick={() => open({ kind: "enter" })}>Neuen Code eingeben</button>
        <button className="btn small ghost" onClick={onClear}>Thema entfernen</button>
      </div>
    </>
  );
}
