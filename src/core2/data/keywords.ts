// Kern 2 – Schlüsselwörter (Mechanik 1, Spec docs/superpowers/specs/2026-11-06-hs-mtg-mechaniken.md).
// Vorbild: Hearthstone/Magic-Keywords (Taunt, Rush, Flying). Ein kleines, festes Vokabular; jedes Wort bedeutet
// auf jeder Karte genau dieselbe Regel und wird einmal im Glossar erklärt.
// Wichtig: Schlüsselwörter werden NUR aus den Kartendaten abgeleitet (keywordsOf) – es gibt keine Handliste,
// damit ein Schlüsselwort nie etwas behauptet, was die Engine nicht tut. keywords.test.ts prüft das gegen die Regeln.
import type { Card2, Pos2, Zone } from "../types";
import { SRC } from "../../data/sources";
import { canKonter, KONTER_COST, KONTER_PER_MATCH } from "../engine/konter";
import { STIL_COST } from "../engine/stil";
import { MULLIGAN_MAX, PLAN_SHARP, PLAN_SIZE, PLAN_START } from "../engine/plan";

export type KeywordId = "keil" | "rahmen" | "griff" | "takedown" | "pass" | "flucht" | "aufgabe" | "dilemma" | "kette" | "konter" | "atem" | "stil" | "plan";
/** Schlüsselwörter, die nicht auf Karten stehen (Regel des Kampfs, nicht der Karte): Spielstil (Mechanik 5). */
export const NON_CARD_KEYWORDS: KeywordId[] = ["stil", "plan"];

export interface KeywordDef {
  id: KeywordId;
  /** Name auf dem Chip (fett). */
  name: string;
  /** Regel im Spiel: höchstens 3 Sätze, je ≤ 20 Wörter, du-Form. */
  rule: string;
  /** Eine Zeile beim ersten Auftauchen im Kampf (≤ 14 Wörter). */
  hint: string;
  /** „Im echten Grappling:“ – ein Satz (≤ 20 Wörter). */
  bjj: string;
  source?: { title: string; url: string };
  /** ohne Primärquelle → Trainer prüfen */
  check?: boolean;
}

const GB_GAS = { title: "Gracie Barra – Gassing Out? 3 Tips", url: "https://graciebarra.com/gb-news/gassing-out" };
const GFF = { title: "BJJ More – Danaher Pin Escapes: Go Further Faster (Review)", url: "https://bjjmore.com/john-danaher-pin-escapes-go-further-faster/" };
const GRIP_GAME = { title: "Grapplearts – The Engagement Phase Game (Gripfighting)", url: "https://www.grapplearts.com/the-engagement-phase-game/" };
/** Mechanik 4 (B38–B43), per WebFetch geprüft 2026-11-06: „Staying one step ahead means that you know what your opponent
 *  is about to do.“ – „keeping your elbows and arms tight will prevent your opponent from submitting you.“ */
const ONE_STEP_AHEAD = { title: "Evolve MMA – Never Get Submitted Again: 5 Ways To Improve Your Defense", url: "https://evolve-mma.com/blog/never-get-submitted-heres-5-ways-improve-defense-bjj/" };
/** Mechanik 5 (B44–B50), per WebFetch geprüft 2026-11-06: „Making a conscious decision about whether you want to focus on
 *  passing the guard or playing guard“ – „it is important for every player to learn the basics“. */
const A_GAME = { title: "Evolve MMA – Guard Passers vs Guard Players: A Guide To Picking Your BJJ Style", url: "https://evolve-mma.com/blog/guard-passers-vs-guard-players-a-guide-to-picking-your-bjj-style/" };
/** Mechanik 6 (B51–B56), per WebFetch geprüft 2026-11-06: „Study all aspects of that smaller number of A Game techniques and
 *  make them as sharp as possible.“ – „Foundation in the fundamentals comes first.“ */
const A_GAME_PLAN = { title: "Gracie Barra – How To Build Your A Game", url: "https://graciebarra.com/gb-learning/how-to-build-your-a-game" };
const RNC_STEPS = { title: "Grapplearts – Preventing & Escaping the RNC", url: "https://www.grapplearts.com/preventing-escaping-the-rnc/" };

/** Reihenfolge = Reihenfolge auf der Karte und im Glossar. */
export const KEYWORDS: KeywordDef[] = [
  {
    id: "keil", name: "Keil",
    rule: "Du gewinnst +1 in seiner Zone, und der Vorteil bleibt liegen. Greift er dort an, verlierst du. Rahmt er dort, gewinnst du +2.",
    hint: "Keil: +1 in der Zone, der Vorteil bleibt liegen.",
    bjj: "Laut Danaher pinnst du mit Keilen an Hüfte und Nacken, nicht mit Gewicht.",
    source: GFF,
  },
  {
    id: "rahmen", name: "Rahmen",
    rule: "Stoppt seinen Angriff in derselben Zone und gewinnt dort +1 – außer gegen ein Dilemma. Ohne Angriff dort verpufft er; gegen einen Keil verliert er.",
    hint: "Rahmen: stoppt einen Angriff in derselben Zone – sonst verpufft er.",
    bjj: "Unter einem Pin rahmst du mit Unterarm und Ellbogen bei etwa 90 Grad, statt zu drücken.",
    source: GFF,
  },
  {
    // Mechanik 2 (B31–B34). Quellen per WebFetch geprüft: Grapplearts („break the grip“, „This initial advantage can often
    // determine the course of a whole match“), Evolve MMA No-Gi Grip Fighting („a dominant grip can control a match“).
    id: "griff", name: "Griff",
    rule: "Gelingt die Karte, bleibt dein Griff liegen: deine Angriffe in seiner Zone brauchen dort 1 weniger. Höchstens zwei Griffe; sein Griff in derselben Zone wird verdrängt. Er fällt durch seinen siegreichen Rahmen dort, durch „Griff lösen“ oder wenn die Position nicht passt.",
    hint: "Griff: bleibt liegen – deine Angriffe dort brauchen 1 weniger.",
    bjj: "Ein Griff bleibt, bis du ihn löst: Wer den dominanten Griff hält, bestimmt oft den ganzen Kampf.",
    source: GRIP_GAME,
  },
  {
    id: "takedown", name: "Takedown",
    rule: "Gelingt der Angriff, geht es aus Stand, Clinch oder Kopfklammer zu Boden – und du liegst oben.",
    hint: "Takedown: aus dem Stand zu Boden, du oben.",
    bjj: "Nach IBJJF gibt ein Takedown 2 Punkte, wenn du danach 3 Sekunden oben bleibst.",
    source: SRC.points,
  },
  {
    id: "pass", name: "Pass",
    rule: "Gelingt der Angriff, bist du von oben an seinen Beinen vorbei. Seine Aufgabe hält dich dabei nicht fest.",
    hint: "Pass: von oben an seinen Beinen vorbei.",
    bjj: "Nach IBJJF zählt ein Pass 3 Punkte: beide Beine überwunden, 3 Sekunden Seitkontrolle gehalten.",
    source: SRC.points,
  },
  {
    id: "flucht", name: "Flucht",
    rule: "Bringt dich von unten raus: in den Stand, durch Umdrehen oder zurück in die Guard. Sitzt seine Aufgabe (Schritt 2), ist sie gesperrt.",
    hint: "Flucht: von unten raus – geht nicht mehr, wenn seine Aufgabe sitzt.",
    bjj: "Danaher nennt drei Wege aus dem Pin: in den neutralen Stand, Umdrehen oder zurück in die Guard.",
    source: GFF,
  },
  {
    id: "aufgabe", name: "Aufgabe",
    rule: "Jeder Treffer schiebt die Leiste: Isolieren, Kontrollieren, Beenden – bei 3 klopft er ab. Verteidigt er nicht genau dort, geht es zwei Schritte. Ein Rahmen dort setzt einen Schritt zurück, ein Positionswechsel löscht die Leiste.",
    hint: "Aufgabe: drei Schritte bis zum Tap – erst isolieren, dann beenden.",
    bjj: "Ein Würger ist eine Folge von Schritten; blockst du früh einen Schritt, kommt er nicht durch.",
    source: RNC_STEPS,
  },
  {
    id: "dilemma", name: "Dilemma",
    rule: "Stoppt er diesen Angriff mit einem Rahmen, gewinnst du +1 in der geöffneten Zone. Sein Rahmen gewinnt dabei nichts.",
    hint: "Dilemma: wehrt er ab, öffnet sich die andere Zone.",
    bjj: "Danaher: Greif in Paaren an – wehrt er das eine ab, läuft er ins andere.",
    source: SRC.dilemmas,
  },
  {
    // Mechanik 3 (B35). Quellen per WebFetch geprüft: Evolve University, Basic BJJ Combinations („work hand in hand and
    // always open an opportunity for one another“); BJJ Atlas Armbar („armbar defense creates triangle“).
    id: "kette", name: "Kette",
    rule: "Folgt die Karte direkt auf die passende Technik aus deiner Vorrunde, braucht sie in ihrer Zone 1 weniger. Das gilt auch, wenn er die erste Technik abgewehrt hat. Wechselt die Position dazwischen, reißt die Kette.",
    hint: "Kette: nach der passenden Technik brauchst du 1 weniger.",
    bjj: "Wehrt er die eine Technik ab, öffnet er die nächste – darum lernst du Techniken in Ketten.",
    source: SRC.combos,
  },
  {
    // Mechanik 4 (B38–B43): verdeckt vorbereiteter Rahmen (Secret/Instant). Abgeleitet: Rahmen, gegen den der Gegner im
    // gegenüberliegenden Slot in derselben Zone angreifen kann (canKonter).
    id: "konter", name: "Konter",
    rule: `Zusätzlich zu deiner Karte legst du diesen Rahmen verdeckt – ${KONTER_PER_MATCH === 1 ? "einmal" : `${KONTER_PER_MATCH}-mal`} pro Kampf, für ${KONTER_COST} Atem. Spielt er diese oder nächste Runde in seiner Zone, springt er statt deiner Karte ein. Er stoppt Angriffe, gewinnt aber keine Zone – und verliert gegen eine Finte.`,
    hint: "Konter: Rahmen verdeckt vorbereiten – springt ein, wenn er dort angreift.",
    bjj: "Gute Verteidigung heißt, einen Schritt voraus zu sein: Der Rahmen steht, bevor er angreift.",
    source: ONE_STEP_AHEAD,
  },
  {
    // Mechanik 5 (B44–B50): Hero Power + Klassen. Steht auf keiner Karte – es ist dein A-Game für den ganzen Kampf.
    id: "stil", name: "Spielstil",
    rule: `Vor dem Kampf wählst du deinen Stil. Seine Fähigkeit setzt du zusätzlich zur Karte ein: ${STIL_COST} Atem, +1 in ihrer Zone, danach eine Runde Pause. Die Fähigkeit wirkt nach den Karten – spielt er in ihrer Zone, verpufft sie.`,
    hint: "Spielstil: dein A-Game – zusätzlich +1 in deiner Zone.",
    bjj: "Jeder baut sein eigenes A-Game – Ringer, Guard-Spieler, Drücker –, doch die Grundlagen lernen alle.",
    source: A_GAME,
  },
  {
    // Mechanik 6 (B51–B56): Deck, Nachziehen, Mulligan. Steht auf keiner Karte – es ist die Regel des Spielplan-Modus.
    id: "plan", name: "Spielplan",
    rule: `Dein Spielplan sind ${PLAN_SIZE} Angriffe: Du startest mit ${PLAN_START}, tauschst einmal bis zu ${MULLIGAN_MAX} und ziehst jede Runde 1. Gezogene Angriffe sind geübt und brauchen in ihrer Zone ${PLAN_SHARP} weniger. Aufbauen, Rahmen und Befreiungen kannst du immer.`,
    hint: "Spielplan: nur gezogene Angriffe – Aufbauen und Verteidigen geht immer.",
    bjj: "Erst die Grundlagen, dann wenige eigene Techniken – die übst du, bis sie richtig scharf sind.",
    source: A_GAME_PLAN,
  },
  {
    id: "atem", name: "Atem",
    rule: "Die Zahl ist der Preis in Atem, du zahlst beim Aufdecken. Jede Runde bekommst du 1 zurück, höchstens 5.",
    hint: "Atem: große Aktionen kosten Atem – teil ihn dir ein.",
    bjj: "Wer mit Kraft statt Hebel arbeitet, ist schnell leer – Helio Gracie setzte auf Hebel und Position.",
    source: GB_GAS,
  },
];

export const KEYWORD: Record<KeywordId, KeywordDef> = Object.fromEntries(KEYWORDS.map((k) => [k.id, k])) as Record<KeywordId, KeywordDef>;

/** Ein Schlüsselwort auf einer bestimmten Karte, mit Zusatz (Zahl oder Zone). */
export interface KeywordHit { id: KeywordId; label: string }

const STANDING = new Set<Pos2>(["stand", "clinch", "headlock"]);
const GROUND = new Set<Pos2>(["guard", "half", "side", "mount", "back", "turtle"]);
const ZONE_NAME: Record<Zone, string> = { kopf: "Kopf", arme: "Arme", huefte: "Hüfte", beine: "Beine" };

/** Takedown: aus einer stehenden Lage (Stand, Clinch, Kopfklammer) zu Boden, Kartenspieler danach oben. */
export function isTakedown(c: Card2): boolean {
  return !!c.to && c.to.role === "top" && GROUND.has(c.to.pos) && c.slots.some((s) => STANDING.has(s.pos));
}
/** Pass: oben in Guard/Half Guard, danach oben in einer anderen Lage. */
export function isPass(c: Card2): boolean {
  return !!c.to && c.to.role === "top" && c.slots.some((s) => s.role === "top" && (s.pos === "guard" || s.pos === "half") && s.pos !== c.to!.pos);
}

/** Schlüsselwörter einer Karte – reine Ableitung aus den Daten (Reihenfolge wie KEYWORDS). */
export function keywordsOf(c: Card2): KeywordHit[] {
  const out: KeywordHit[] = [];
  if (c.kind === "aufbauen") out.push({ id: "keil", label: "Keil" });
  if (c.kind === "rahmen") out.push({ id: "rahmen", label: "Rahmen" });
  if (c.grip) out.push({ id: "griff", label: "Griff" });
  else if (c.breaks?.length) out.push({ id: "griff", label: "Griff lösen" });
  if (isTakedown(c)) out.push({ id: "takedown", label: "Takedown" });
  if (isPass(c)) out.push({ id: "pass", label: "Pass" });
  if (c.to?.escape) out.push({ id: "flucht", label: "Flucht" });
  if (c.submission) out.push({ id: "aufgabe", label: "Aufgabe" });
  if (c.dilemmaOpens) out.push({ id: "dilemma", label: `Dilemma → ${ZONE_NAME[c.dilemmaOpens]}` });
  if (c.chain && c.kind === "angriff") out.push({ id: "kette", label: "Kette" });
  if (canKonter(c)) out.push({ id: "konter", label: "Konter" });
  if (c.kraft) out.push({ id: "atem", label: `Atem ${c.kraft}` });
  return out;
}

/** Schlüsselwörter, die neben Art-Label und Atem-Pille noch Platz auf der kleinen Handkarte brauchen. */
export const HAND_EXTRA: KeywordId[] = ["griff", "takedown", "pass", "flucht", "aufgabe", "dilemma"];

// ---------------- Erstes Auftauchen (localStorage) ----------------
export const KEYWORDS_SEEN_KEY = "mk.k2.keywords.v1";

export function readSeenKeywords(): KeywordId[] {
  try {
    const raw = localStorage.getItem(KEYWORDS_SEEN_KEY);
    const v = raw ? JSON.parse(raw) : [];
    return Array.isArray(v) ? v.filter((x): x is KeywordId => typeof x === "string" && x in KEYWORD) : [];
  } catch { return []; }
}
export function markKeywordSeen(id: KeywordId): void {
  const cur = readSeenKeywords();
  if (cur.includes(id)) return;
  try { localStorage.setItem(KEYWORDS_SEEN_KEY, JSON.stringify([...cur, id])); } catch { /* privat oder voll – dann eben nur in dieser Sitzung */ }
}
/** Nächstes noch nicht erklärtes Schlüsselwort unter den Karten (Reihenfolge wie KEYWORDS). */
export function firstUnseen(cards: Card2[], seen: KeywordId[]): KeywordId | null {
  const have = new Set(cards.flatMap((c) => keywordsOf(c).map((k) => k.id)));
  return KEYWORDS.find((k) => have.has(k.id) && !seen.includes(k.id))?.id ?? null;
}
