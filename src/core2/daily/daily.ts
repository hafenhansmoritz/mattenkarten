// Kern 2 – Tages-Challenge (Schritt 74): eine Lage pro Tag, nach Datum gesetzt.
// Ein gewerteter Versuch pro Tag, danach beliebig üben. Keine Serie, keine Strafe fürs Aussetzen.
import type { Pos2, Role2 } from "../types";
import type { TutorialK2Def } from "../ui/tutorialTypes";

export interface DailyDef {
  id: string;
  title: string;
  /** Aufgabe in einem Satz, du-Form. */
  task: string;
  /** Lernidee dahinter (≤ 15 Wörter). */
  idea: string;
  start: TutorialK2Def["start"];
  /** Ziel: eine dieser Lagen erreichen. Fehlt es: per Aufgabe (Tap) gewinnen. */
  goal?: { pos: Pos2; role: Role2 }[];
  rounds: number;
  aiLevel: 1 | 2 | 3;
}

const TOP_ANY: { pos: Pos2; role: Role2 }[] = [
  { pos: "guard", role: "top" }, { pos: "half", role: "top" }, { pos: "turtle", role: "top" },
  { pos: "side", role: "top" }, { pos: "mount", role: "top" }, { pos: "back", role: "top" },
];
const PASSED: { pos: Pos2; role: Role2 }[] = [
  { pos: "side", role: "top" }, { pos: "mount", role: "top" }, { pos: "back", role: "top" },
];
/** Raus aus einer Fixierung: Guard zurückholen, aufstehen oder umdrehen. */
const ESCAPED: { pos: Pos2; role: Role2 }[] = [
  { pos: "half", role: "bottom" }, { pos: "guard", role: "bottom" }, { pos: "stand", role: "neutral" },
  { pos: "clinch", role: "neutral" }, ...TOP_ANY,
];

/** Pool: Startlagen aus Kern 2. Lösbarkeit prüft daily.test.ts mit der echten Engine. */
export const DAILY_POOL: DailyDef[] = [
  {
    id: "d-side-raus", title: "Raus aus der Seitenkontrolle",
    task: "Du liegst unten in der Seitenkontrolle. Komm raus – Guard zurück, aufstehen oder umdrehen.",
    idea: "Erst Rahmen bauen, dann Hüfte weg, dann Knie rein.",
    start: { pos: "side", top: "o" }, goal: ESCAPED, rounds: 4, aiLevel: 1,
  },
  {
    id: "d-mount-raus", title: "Raus aus dem Mount",
    task: "Er sitzt auf dir. Befrei dich, bevor die Runden um sind.",
    idea: "Ellbogen und Knie zusammen, dann brücken oder wegrutschen.",
    start: { pos: "mount", top: "o" }, goal: ESCAPED, rounds: 5, aiLevel: 1,
  },
  {
    id: "d-back-raus", title: "Rücken retten",
    task: "Er hat deinen Rücken. Schütz den Hals und komm raus.",
    idea: "Hände an den Hals, Schultern auf die Matte, dann drehen.",
    start: { pos: "back", top: "o" }, goal: ESCAPED, rounds: 6, aiLevel: 1,
  },
  {
    id: "d-guard-pass", title: "Durch die Guard",
    task: "Du kniest in seiner Guard. Passiere sie – Seitenkontrolle, Mount oder Rücken.",
    idea: "Erst Haltung und Hüfte, dann vorbei.",
    start: { pos: "guard", top: "p" }, goal: PASSED, rounds: 5, aiLevel: 1,
  },
  {
    id: "d-half-pass", title: "Halbe Guard knacken",
    task: "Er hält dich in der halben Guard. Befrei dein Bein und komm vorbei.",
    idea: "Crossface und Underhook zuerst, dann das Bein raus.",
    start: { pos: "half", top: "p" }, goal: PASSED, rounds: 5, aiLevel: 1,
  },
  {
    id: "d-guard-sweep", title: "Umdrehen von unten",
    task: "Du liegst unten mit Guard. Dreh ihn um oder komm hoch.",
    idea: "Brich seine Haltung, dann kipp ihn über die freie Seite.",
    start: { pos: "guard", top: "o" }, goal: [...TOP_ANY, { pos: "stand", role: "neutral" }], rounds: 5, aiLevel: 1,
  },
  {
    id: "d-takedown", title: "Erster Takedown",
    task: "Ihr steht. Bring ihn zu Boden und lande oben.",
    idea: "Erst Griff und Stand, dann Ebene wechseln.",
    start: { pos: "stand", top: null }, goal: TOP_ANY, rounds: 4, aiLevel: 1,
  },
  {
    id: "d-side-mount", title: "Hoch in den Mount",
    task: "Du hast die Seitenkontrolle. Steig in den Mount oder nimm den Rücken.",
    idea: "Erst Druck und Crossface, dann das Knie über den Bauch.",
    start: { pos: "side", top: "p", board: { huefte: 1 } }, goal: [{ pos: "mount", role: "top" }, { pos: "back", role: "top" }], rounds: 5, aiLevel: 1,
  },
  {
    id: "d-turtle-back", title: "Rücken nehmen",
    task: "Er hockt in der Turtle. Nimm seinen Rücken.",
    idea: "Seatbelt zuerst, dann die Haken rein.",
    start: { pos: "turtle", top: "p", board: { kopf: 1 } }, goal: [{ pos: "back", role: "top" }], rounds: 7, aiLevel: 1,
  },
  {
    id: "d-mount-finish", title: "Beende aus dem Mount",
    task: "Du sitzt im Mount. Beende mit einem Aufgabegriff – Schritt für Schritt.",
    idea: "Position halten, Arm isolieren, dann erst beenden.",
    start: { pos: "mount", top: "p", board: { huefte: 1, arme: 1 } }, rounds: 8, aiLevel: 1,
  },
  {
    id: "d-back-finish", title: "Beende vom Rücken",
    task: "Du hast den Rücken. Hol dir den Würgegriff – ohne den Rücken zu verlieren.",
    idea: "Erst Hände kontrollieren, dann der Würger.",
    start: { pos: "back", top: "p", board: { beine: 1 } }, rounds: 7, aiLevel: 1,
  },
];

/** Datum als Schlüssel (lokale Zeit): 2026-11-05. */
export function dateKey(d: Date = new Date()): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/** Stabiler Hash (FNV-1a) → Seed. */
export function seedOf(key: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < key.length; i++) { h ^= key.charCodeAt(i); h = Math.imul(h, 0x01000193); }
  return h >>> 0;
}

/** Tage seit 1970 für einen Datumsschlüssel (zeitzonenfest, da aus dem Schlüssel selbst). */
export function dayNumber(key: string): number {
  const [y, m, d] = key.split("-").map(Number);
  return Math.round(Date.UTC(y, m - 1, d) / 86400000);
}

function mulberry(seed: number) {
  let a = seed >>> 0 || 1;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Gemischte Reihenfolge des Pools für einen Durchlauf (jede Lage einmal pro Durchlauf). */
function rawOrder(cycle: number): number[] {
  const rng = mulberry(seedOf("mk-daily-cycle|" + cycle));
  const out = DAILY_POOL.map((_, i) => i);
  for (let i = out.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [out[i], out[j]] = [out[j], out[i]]; }
  return out;
}
function order(cycle: number): number[] {
  const o = rawOrder(cycle);
  // Übergang zwischen zwei Durchläufen: nie dieselbe Lage zweimal hintereinander.
  if (o.length > 2 && o[0] === rawOrder(cycle - 1)[o.length - 1]) [o[0], o[1]] = [o[1], o[0]];
  return o;
}

/** Herausforderung des Tages – deterministisch aus dem Datum, nie zweimal hintereinander dieselbe. */
export function dailyFor(key: string = dateKey()): { def: DailyDef; seed: number; key: string } {
  const n = dayNumber(key), len = DAILY_POOL.length;
  const cycle = Math.floor(n / len);
  const i = order(cycle)[n - cycle * len];
  return { def: DAILY_POOL[i], seed: seedOf("mk-seed|" + key) % 100000, key };
}

/** Als Tutorial-Definition für ArenaK2 (eine Coach-Blase, keine Pflichtkarten). */
export function toTutorial(def: DailyDef, seed: number): TutorialK2Def {
  return {
    id: "daily-" + def.id, title: `Tages-Challenge: ${def.title}`, idea: def.task,
    start: def.start, goal: def.goal, aiLevel: def.aiLevel, maxRounds: def.rounds, seed,
    steps: [{ round: 1, when: "start", text: `${def.task} Du hast ${def.rounds} Runden. Tipp: ${def.idea}` }],
  };
}

/** Geschafft? Ziel-Lage erreicht oder per Aufgabe gewonnen (beendet zählt immer). Punktsiege zählen nicht. */
export function dailySuccess(def: DailyDef, result: { type: string; winner: string | null } | null): boolean {
  if (!result || result.winner !== "p") return false;
  return result.type === "tap" || (!!def.goal && result.type === "goal");
}
