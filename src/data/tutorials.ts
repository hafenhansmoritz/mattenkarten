// Geführte Tutorial-Kämpfe 1–3 (Weißgurt), Hearthstone-Prinzip:
// nicht verlierbar, pro Kampf genau EINE neue Idee, Ablauf "zeigen → Hinweis → frei".
// Recherche: research_notes/Neulinge und Lernen pro Runde/onboarding.md
// (HS Mission 1 ohne Mana → hier noResources in 1+2; Ressourcen erst in 3;
//  max. 3 Optionen; kurze Bubbles; Alltagswort zuerst, Fachbegriff klein in Klammern).
import type { MatchOptions } from "../engine/types";

export interface TutorialStep {
  id: string;
  /** "start" = vor dem ersten Zug; "beforePick" = vor der Kartenwahl in `turn`; "afterReveal" = nach dem Aufdecken in `turn`. */
  when: "start" | "beforePick" | "afterReveal";
  turn?: number;
  /** Alltagssprache, du-Form, max. 2 kurze Sätze. */
  text: string;
  /** Worauf die Blase zeigt. */
  point?: "hand" | "card" | "chain" | "fighters" | "goal" | "resources" | "predict" | "coach";
  /** Karte, die hervorgehoben wird (bei point "card"). */
  cardId?: string;
  /** Spieler muss diese Karte in diesem Zug spielen (andere gesperrt). */
  requireCard?: string;
}

export interface TutorialDef {
  n: 1 | 2 | 3;
  archId: string;
  title: string;
  /** Die eine neue Idee dieses Kampfs. */
  idea: string;
  options: MatchOptions;
  maxTurns: number;
  steps: TutorialStep[];
  winText: string;
}

// ------------------------------------------------------------------
// 1 – Bring ihn zu Boden: Dreieck erleben (Angreifen schlägt Vorbereiten)
// Zug 1 (zeigen): beide bereiten vor → nichts passiert.
// Zug 2 (zeigen): Beine schnappen schlägt sein Vorbereiten → du landest oben in der Guard (+2).
// Ab Zug 3 (frei): Er baut weiter nur auf – du findest selbst den Angriff (Vorbeigehen) → Ziel.
// Ziel ist Seitkontrolle/Mount oben, damit nach den zwei gezeigten Zügen ein freier Zug folgt;
// läuft die Zeit ab, gewinnst du trotzdem nach Punkten (2:0), weil Tim nie angreift.
// ------------------------------------------------------------------
const T1: TutorialDef = {
  n: 1,
  archId: "w_partner",
  title: "Bring ihn zu Boden",
  idea: "Angreifen schlägt Vorbereiten.",
  options: {
    startPos: "dist",
    handSize: 3,
    noResources: true,
    scriptedKind: "setup",
    fixedHand: ["level_change", "double_leg", "sprawl"],
    winAt: [{ pos: "side", role: "top" }, { pos: "mount", role: "top" }],
  },
  maxTurns: 6,
  steps: [
    { id: "t1-start-goal", when: "start", point: "goal",
      text: "Tim ist dein Trainingspartner. Dein Ziel: Bring ihn zu Boden und leg dich quer auf ihn." },
    { id: "t1-start-hand", when: "start", point: "hand",
      text: "Ihr wählt beide verdeckt eine Karte. Dann werden beide gleichzeitig aufgedeckt." },
    { id: "t1-1-pick", when: "beforePick", turn: 1, point: "card", cardId: "level_change", requireCard: "level_change",
      text: "Geh erst mal in die Knie. Damit bereitest du einen Angriff vor (Setup)." },
    { id: "t1-1-reveal", when: "afterReveal", turn: 1, point: "fighters",
      text: "Tim hat sich auch nur vorbereitet. Wenn beide vorbereiten, passiert nichts." },
    { id: "t1-2-pick", when: "beforePick", turn: 2, point: "card", cardId: "double_leg", requireCard: "double_leg",
      text: "Tim bereitet schon wieder vor. Jetzt greif an: Schnapp dir seine Beine (Double Leg)!" },
    { id: "t1-2-reveal", when: "afterReveal", turn: 2, point: "chain",
      text: "Angreifen schlägt Vorbereiten! Er liegt unten, du bist zwischen seinen Beinen (Guard)." },
    { id: "t1-3-pick", when: "beforePick", turn: 3, point: "hand",
      text: "Jetzt du allein. Er baut wieder nur auf – welche Karte schlägt das?" },
    { id: "t1-3-coach", when: "afterReveal", turn: 3, point: "coach",
      text: "Merke: Wer nur vorbereitet, wird angegriffen. Hol dir Hilfe beim Coach, wenn du unsicher bist." },
  ],
  winText: "Geschafft! Du hast gelernt: Angreifen schlägt Vorbereiten.",
};

// ------------------------------------------------------------------
// 2 – Lies seinen Angriff: Kontern (Reaktion) + Tipp abgeben
// Zug 1: Tipp ab (Predict) → Konter-Karten passen nur zu bestimmten Angriffen → Sprawl erzwungen.
// Ab Zug 2 frei mit Hinweis. Sichere Linie (vom Test geprüft): auf Abstand Sprawl,
// im Clinch selbst Beine schnappen (schneller als sein Wurf, gegen seinen Shot nur Gerangel).
// Ziel: oben im Front Headlock (nach Sprawl) oder oben am Boden (eigener Takedown).
// ------------------------------------------------------------------
const T2: TutorialDef = {
  n: 2,
  archId: "w_ringer",
  title: "Lies seinen Angriff",
  idea: "Kontern stoppt nur den passenden Angriff.",
  options: {
    startPos: "dist",
    noResources: true,
    scriptedKind: "angriff",
    fixedHand: ["sprawl", "double_leg", "level_change"],
    winAt: [{ pos: "fhl", role: "top" }, { pos: "guard", role: "top" }, { pos: "side", role: "top" }],
  },
  maxTurns: 10,
  steps: [
    { id: "t2-start-goal", when: "start", point: "goal",
      text: "Rico will dich ständig umwerfen. Heute lernst du, seinen Angriff abzufangen (Kontern)." },
    { id: "t2-1-predict", when: "beforePick", turn: 1, point: "predict",
      text: "Tipp zuerst ab, was er gleich spielt. Rico greift fast immer an." },
    { id: "t2-1-match", when: "beforePick", turn: 1, point: "card", cardId: "b_distance",
      text: "Jede Konter-Karte stoppt nur bestimmte Angriffe. Abstand halten stoppt Schläge, Beine weg stoppt Angriffe auf die Beine." },
    { id: "t2-1-pick", when: "beforePick", turn: 1, point: "card", cardId: "sprawl", requireCard: "sprawl",
      text: "Rico geht am liebsten an deine Beine. Spiel Beine weg, Hüfte drauf (Sprawl)." },
    { id: "t2-1-reveal", when: "afterReveal", turn: 1, point: "fighters",
      text: "Ging er auf deine Beine, hat dein Sprawl ihn gestoppt. Hat er geschlagen oder gepackt, passte der Sprawl nicht." },
    { id: "t2-2-predict", when: "beforePick", turn: 2, point: "predict",
      text: "Tipp wieder ab. Schau, was er bisher gespielt hat." },
    { id: "t2-2-pick", when: "beforePick", turn: 2, point: "coach",
      text: "Ab jetzt entscheidest du. Auf Abstand hilft Beine weg, steht ihr eng umklammert, schnapp selbst seine Beine." },
    { id: "t2-2-reveal", when: "afterReveal", turn: 2, point: "chain",
      text: "Wer den Angriff kommen sieht, kann ihn kontern. Aber nur mit der Karte, die zu diesem Angriff passt." },
  ],
  winText: "Stark! Du hast ihn gelesen: Kontern stoppt nur den passenden Angriff.",
};

// ------------------------------------------------------------------
// 3 – Erst Griff, dann beenden: Ressourcen (Puste & Griff) + Aufgabegriff + Tap-Sicherheit
// Start oben im Mount (Griff 1). Zug 1+2: Grundlage (Setup) erzwungen → Griff 3.
// Zug 3 frei: Americana (Griff 2) oder Armbar (Griff 3) – beide schlagen ihr Vorbereiten.
// Kein winAt: Sieg nur durch Aufgabegriff. Gisela bereitet nur vor (befreit sich nie).
// Die Grundlage (b_mount_base) ist eine Grundtechnik und daher immer spielbar,
// deshalb steht sie nicht zusätzlich in der festen Hand (sonst doppelt angezeigt).
// ------------------------------------------------------------------
const T3: TutorialDef = {
  n: 3,
  archId: "w_guard",
  title: "Erst Griff, dann beenden",
  idea: "Erst Griff aufbauen, dann den Aufgabegriff ansetzen.",
  options: {
    startPos: "mount",
    startTop: "p",
    handSize: 3,
    scriptedKind: "setup",
    fixedHand: ["americana", "armbar_mount"],
  },
  maxTurns: 8,
  steps: [
    { id: "t3-start-goal", when: "start", point: "fighters",
      text: "Du sitzt schon auf ihr (Mount). Heute beendest du den Kampf mit einem Aufgabegriff (Submission)." },
    { id: "t3-start-res", when: "start", point: "resources",
      text: "Neu sind Puste und Griff. Puste ist deine Kraft, Griff zeigt, wie fest du sie hältst." },
    { id: "t3-start-lock", when: "start", point: "hand",
      text: "Aufgabegriffe brauchen genug Griff. Noch sind sie gesperrt." },
    { id: "t3-1-pick", when: "beforePick", turn: 1, point: "card", cardId: "b_mount_base", requireCard: "b_mount_base",
      text: "Erst Griff, dann beenden. Mach deine Hüfte schwer (Grundlage) – das gibt +1 Griff." },
    { id: "t3-1-reveal", when: "afterReveal", turn: 1, point: "resources",
      text: "Griff 2! Jetzt reicht es schon für „Arm nach unten drehen“ (Americana)." },
    { id: "t3-2-pick", when: "beforePick", turn: 2, point: "card", cardId: "b_mount_base", requireCard: "b_mount_base",
      text: "Noch einmal festmachen. Mit Griff 3 geht auch „Arm strecken“ (Armbar)." },
    { id: "t3-2-reveal", when: "afterReveal", turn: 2, point: "resources",
      text: "Griff 3 – du sitzt fest. Jede Technik kostet etwas Puste, also nicht verschwenden." },
    { id: "t3-3-pick", when: "beforePick", turn: 3, point: "hand",
      text: "Jetzt du: Wähle einen Aufgabegriff. Sie bereitet nur vor, also kommst du durch." },
    { id: "t3-3-tap", when: "afterReveal", turn: 3, point: "coach",
      text: "Wenn sie abklopft: sofort loslassen. So schützt ihr euch im Training gegenseitig." },
  ],
  winText: "Tap! Erst Griff, dann beenden – und beim Abklopfen sofort loslassen.",
};

export const TUTORIALS: Record<1 | 2 | 3, TutorialDef> = { 1: T1, 2: T2, 3: T3 };

export function tutorialFor(archId: string): TutorialDef | undefined {
  return Object.values(TUTORIALS).find((t) => t.archId === archId);
}
