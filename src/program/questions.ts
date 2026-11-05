// 7-Tage-Startprogramm – Fragenbank (Multiple Choice, 2–4 Optionen, je ein Warum-Satz).
// Inhalte nach docs/knowledge-base.md (KB) und research_notes/7 Tage Startprogramm/notes.md.
// check: true = keine direkte Quelle in KB/Recherche → Trainer prüfen.
import type { Pos2, Side } from "../core2/types";

export type Topic =
  | "positionen" | "abklopfen" | "mount" | "side" | "guard" | "stand" | "keile" | "aufgabe";

/** Prüfungsbereiche für Tag 7 (je ≥ 80 %). */
export type Area = "basis" | "befreien" | "guardstand" | "kontrolle";

export const TOPIC_AREA: Record<Topic, Area> = {
  positionen: "basis", abklopfen: "basis",
  mount: "befreien", side: "befreien",
  guard: "guardstand", stand: "guardstand",
  keile: "kontrolle", aufgabe: "kontrolle",
};

export const AREA_LABEL: Record<Area, string> = {
  basis: "Positionen & Abklopfen",
  befreien: "Befreien aus Mount & Side",
  guardstand: "Guard & Stand",
  kontrolle: "Keile & Aufgaben",
};

export const TOPIC_LABEL: Record<Topic, string> = {
  positionen: "Positionen", abklopfen: "Abklopfen", mount: "Mount-Befreiung", side: "Side-Befreiung",
  guard: "Guard", stand: "Stand & Sprawl", keile: "Keile & Passieren", aufgabe: "Aufgabe & Verteidigung",
};

export interface Question {
  id: string;
  /** Tag, an dem der Inhalt eingeführt wird (1–6). */
  day: number;
  topic: Topic;
  q: string;
  options: string[];
  /** Index der richtigen Option. */
  answer: number;
  /** ≤ 25 Wörter: warum die Antwort stimmt. */
  why: string;
  /** Optionales Bild: Lage aus deiner Sicht (du = blau = "p"). */
  scene?: { pos: Pos2; top: Side | null };
  /** Quelle in der KB (Abschnitt) – Nachweis für Trainer. */
  src?: string;
  check?: boolean;
}

export const QUESTIONS: Question[] = [
  // ---------- Tag 1: Positionen ----------
  {
    id: "q-pos-best", day: 1, topic: "positionen",
    q: "Welche Lage ist für dich am stärksten?",
    options: ["Du bist an seinem Rücken", "Du liegst unten in der Guard", "Du liegst unten in der halben Guard"],
    answer: 0, src: "KB 3.2",
    why: "Vom Rücken aus kontrollierst du ihn, und er sieht dich kaum. Diese Lage gilt als die beste.",
  },
  {
    id: "q-pos-mount-name", day: 1, topic: "positionen",
    q: "Er sitzt rittlings auf deinem Bauch. Wie heißt das?",
    options: ["Mount", "Side Control", "Guard"],
    answer: 0, scene: { pos: "mount", top: "o" }, src: "KB 3.2",
    why: "Mount heißt: Er sitzt auf dir. Unten ist das eine der schlechtesten Lagen.",
  },
  {
    id: "q-pos-guard-name", day: 1, topic: "positionen",
    q: "Du liegst unten, deine Beine sind um seine Hüfte. Wie heißt das?",
    options: ["Guard", "Mount", "Turtle"],
    answer: 0, scene: { pos: "guard", top: "o" }, src: "KB 3.2",
    why: "Guard heißt: Deine Beine sind zwischen euch. Unten ist das die beste Lage.",
  },
  {
    id: "q-pos-goal-bottom", day: 1, topic: "positionen",
    q: "Du liegst unten im Mount. Was ist dein Ziel?",
    options: ["Erst schützen, dann raus", "Sofort einen Armhebel versuchen", "Still liegen und warten"],
    answer: 0, scene: { pos: "mount", top: "o" }, src: "KB 3.2, 2.4",
    why: "Unten heißt: überleben, Hals und Arme schützen, dann entkommen. Befreien kommt vor Angreifen.",
  },
  {
    id: "q-pos-goal-top", day: 1, topic: "positionen",
    q: "Du liegst oben quer auf ihm (Side Control). Was ist dein Ziel?",
    options: ["Ruhig halten, dann aufsteigen oder beenden", "Sofort aufstehen und weggehen", "Loslassen und neu anfangen"],
    answer: 0, scene: { pos: "side", top: "p" }, src: "KB 3.2",
    why: "Oben heißt: stabil halten, seine Flucht verhindern, aufsteigen. Erst dann beenden.",
  },
  {
    id: "q-pos-side-vs-guard", day: 1, topic: "positionen",
    q: "Wo bist du unten besser dran?",
    options: ["In der Guard", "Unter Side Control", "Unter dem Mount"],
    answer: 0, src: "KB 3.2",
    why: "In der Guard sind deine Beine zwischen euch. Unter Side Control und Mount fehlt dir dieser Schutz.",
  },
  // ---------- Tag 1: Abklopfen ----------
  {
    id: "q-tap-when", day: 1, topic: "abklopfen",
    q: "Wann klopfst du ab?",
    options: ["Sobald der Griff sitzt", "Erst bei starkem Schmerz", "Nie – das ist Aufgeben"],
    answer: 0, src: "KB 5.1",
    why: "Früh abklopfen schützt dich. Warte nicht auf Schmerz – Stolz führt zu Verletzungen.",
  },
  {
    id: "q-tap-how", day: 1, topic: "abklopfen",
    q: "Deine Hände sind eingeklemmt. Wie klopfst du ab?",
    options: ["Laut „Tap“ sagen oder mit dem Fuß auf die Matte", "Gar nicht, du wartest", "Mit dem Kopf nicken"],
    answer: 0, src: "KB 5.1",
    why: "Abklopfen geht mit Hand, Fuß oder Wort. Sind die Hände fest, sag laut „Tap“.",
  },
  {
    id: "q-tap-release", day: 1, topic: "abklopfen",
    q: "Dein Partner klopft ab. Was tust du?",
    options: ["Sofort loslassen", "Noch kurz festhalten", "Erst die Position sichern"],
    answer: 0, src: "KB 5.1",
    why: "Beim Tap lässt du sofort los – auch bei einem gesagten Tap. Dein Partner vertraut dir.",
  },
  {
    id: "q-tap-dizzy", day: 1, topic: "abklopfen",
    q: "Bei einem Würger wird dir schwindelig. Was tust du?",
    options: ["Sofort abklopfen", "Durchhalten", "Kopf schütteln und weitermachen"],
    answer: 0, src: "KB 5.1",
    why: "Schwindel, Sternchen oder komisches Hören heißen: sofort abklopfen.",
  },
  {
    id: "q-tap-clear", day: 1, topic: "abklopfen",
    q: "Wie klopfst du richtig ab?",
    options: ["Deutlich und mehrmals", "Einmal ganz leicht", "Nur mit einem Finger"],
    answer: 0, src: "KB 5.1",
    why: "Ein leichter Tap geht leicht unter. Klopf deutlich und mehrmals, damit dein Partner es merkt.",
  },

  // ---------- Tag 2: Raus aus dem Mount ----------
  {
    id: "q-mount-first", day: 2, topic: "mount",
    q: "Er sitzt auf dir (Mount). Was baust du zuerst?",
    options: ["Ellbogen an die Knie (Rahmen)", "Arme weit nach oben strecken", "Auf den Bauch drehen"],
    answer: 0, scene: { pos: "mount", top: "o" }, src: "KB 4.5, Karte mb_knee_inside",
    why: "Ellbogen und Knie zusammen schützen dich. Das ist dein Rahmen vor jeder Befreiung.",
  },
  {
    id: "q-mount-no-back", day: 2, topic: "mount",
    q: "Warum drehst du dich unten im Mount nicht auf den Bauch?",
    options: ["Er kommt sonst an deinen Rücken", "Du wirst zu schnell", "Das ist im Turnier verboten"],
    answer: 0, src: "KB 3.2",
    why: "Wer sich wegdreht, zeigt den Rücken. Der Rücken ist die stärkste Lage für ihn.",
  },
  {
    id: "q-mount-upa-trap", day: 2, topic: "mount",
    q: "Brücke und rollen (Upa): Was fängst du vorher?",
    options: ["Seinen Arm und Fuß auf derselben Seite", "Seinen Kopf mit beiden Händen", "Gar nichts"],
    answer: 0, scene: { pos: "mount", top: "o" }, src: "KB 4.5 (Grapplearts Upa)",
    why: "Fang Arm und Fuß auf derselben Seite. Dann kann er sich dort nicht abstützen und kippt.",
  },
  {
    id: "q-mount-switch", day: 2, topic: "mount",
    q: "Er stützt sich breit mit beiden Händen ab. Was passt jetzt besser?",
    options: ["Wegrutschen, Knie dazwischen (Elbow Escape)", "Weiter brücken und rollen (Upa)", "Abwarten, bis er müde wird"],
    answer: 0, src: "KB 4.5", check: true,
    why: "Steht er breit, rollt er schwer. Dann wechselst du zum Elbow Escape.",
  },
  {
    id: "q-mount-breathe", day: 2, topic: "mount",
    q: "Was ist bei der Brücke wichtig?",
    options: ["Ausatmen, Gewicht auf Schultern und Füßen", "Luft anhalten", "Auf dem Kopf abstützen"],
    answer: 0, src: "Recherche 3/4 (Grapplearts, BJJ More)",
    why: "Beim Brücken atmest du aus. Dein Gewicht liegt auf Schultern und Füßen, nie auf dem Nacken.",
  },
  {
    id: "q-mount-progress", day: 2, topic: "mount",
    q: "Du kommst aus dem Mount in die halbe Guard. Ist das ein Erfolg?",
    options: ["Ja, ein echter Fortschritt", "Nein, nur die volle Guard zählt"],
    answer: 0, src: "KB 4.5 (BJJ Atlas)",
    why: "Jeder Schritt raus zählt. Von schlecht zu weniger schlecht ist schon Fortschritt.",
  },

  // ---------- Tag 3: Raus aus Side Control ----------
  {
    id: "q-side-order", day: 3, topic: "side",
    q: "Er liegt quer auf dir (Side Control). Welche Reihenfolge stimmt?",
    options: ["Rahmen, dann Brücke, dann wegrutschen", "Erst wegrutschen, dann Rahmen", "Sofort aufspringen"],
    answer: 0, scene: { pos: "side", top: "o" }, src: "KB 4.5 (BJJ Atlas)",
    why: "Erst Rahmen, dann Brücke, dann Shrimp. Ohne Rahmen fehlt dir der Platz.",
  },
  {
    id: "q-side-frame", day: 3, topic: "side",
    q: "Wozu dient dein Unterarm an seinem Hals und seiner Hüfte (Frame)?",
    options: ["Er hält Abstand", "Er schlägt ihn weg", "Er würgt ihn"],
    answer: 0, src: "KB 2.4, 4.5",
    why: "Ein Rahmen stützt ab. Er hält den Platz, den du zum Wegrutschen brauchst.",
  },
  {
    id: "q-side-shrimp", day: 3, topic: "side",
    q: "Was ist der Shrimp?",
    options: ["Hüfte wegschieben, seitlich wegrutschen", "Eine Rolle vorwärts", "Ein Wurf aus dem Stand"],
    answer: 0, src: "Recherche 3 (Grapplearts)",
    why: "Shrimp heißt Hüftflucht: Du schiebst die Hüfte weg und machst Platz für dein Knie.",
  },
  {
    id: "q-side-goal", day: 3, topic: "side",
    q: "Du hast Platz geschaffen. Was ist jetzt dein Ziel?",
    options: ["Beine zurück vor ihn (Guard)", "Liegen bleiben und ausruhen", "Ihn fest umarmen"],
    answer: 0, scene: { pos: "side", top: "o" }, src: "Recherche 1 (Danaher GFF)",
    why: "Eine Befreiung endet in der Guard oder im Stand. Deine Beine sind dann wieder eine Schutzwand.",
  },
  {
    id: "q-side-underhook", day: 3, topic: "side",
    q: "Du kommst mit dem Arm unter ihm hoch (Underhook). Worauf achtest du?",
    options: ["Auf deinen Hals – er kann würgen", "Auf gar nichts", "Auf schnelles Rollen über den Kopf"],
    answer: 0, src: "KB 4.5 (BJJ Atlas)",
    why: "Beim Hochkommen ist dein Hals offen. Er kann von vorn würgen (Guillotine).",
  },
  {
    id: "q-side-drill", day: 3, topic: "side",
    q: "Du übst den Shrimp zu Hause. Was ist richtig?",
    options: ["Langsam und auf beiden Seiten", "Nur eine Seite, so schnell es geht", "Mit Partner gegen vollen Widerstand"],
    answer: 0, src: "Recherche 3 (Grapplearts)",
    why: "Übe ruhig und auf beiden Seiten. Mit Partner nur kooperativ und langsam.",
  },

  // ---------- Tag 4: Guard oben & unten ----------
  {
    id: "q-guard-top-posture", day: 4, topic: "guard",
    q: "Du kniest oben in seiner Guard. Was machst du zuerst?",
    options: ["Aufrecht sitzen, Rücken gerade", "Dich nach vorn auf ihn legen", "Die Arme weit ausstrecken"],
    answer: 0, scene: { pos: "guard", top: "p" }, src: "KB 4.5, Karte gt_posture",
    why: "Aufrecht schützt du Hals und Arme. Wer nach vorn kippt, läuft in Würger und Hebel.",
  },
  {
    id: "q-guard-bottom-break", day: 4, topic: "guard",
    q: "Du liegst unten in der Guard. Was willst du zuerst?",
    options: ["Seine Haltung brechen, ihn runterziehen", "Ihn loslassen", "Flach liegen und warten"],
    answer: 0, scene: { pos: "guard", top: "o" }, src: "Karte gb_break_posture",
    why: "Unten ziehst du ihn runter. Ohne Haltung kann er schwer vorbeigehen oder angreifen.",
  },
  {
    id: "q-guard-elbows", day: 4, topic: "guard",
    q: "Oben in der Guard: Wo sind deine Ellbogen?",
    options: ["Eng am Körper", "Weit vom Körper weg", "Hinter ihm auf der Matte"],
    answer: 0, src: "Karte gt_elbows_in", check: true,
    why: "Enge Ellbogen schützen deine Arme. Ein weiter Arm lädt zu Armhebel und Beine-Würger ein.",
  },
  {
    id: "q-guard-hipbump", day: 4, topic: "guard",
    q: "Er will dich mit der Hüfte umwerfen (Hip Bump). Du ziehst deinen Arm weg. Was droht?",
    options: ["Er dreht deinen Arm nach hinten (Kimura)", "Nichts, du hast gewonnen", "Du bekommst Punkte"],
    answer: 0, src: "KB 4.5, 4.6 (JitsuIQ)",
    why: "Hip Bump und Kimura sind ein Paar. Wehrst du das eine ab, öffnet sich das andere.",
  },
  {
    id: "q-guard-standup", day: 4, topic: "guard",
    q: "Wie stehst du sicher vom Boden auf (Technical Stand-up)?",
    options: ["Hand hinten, andere Hand schützt vorn, Bein nach hinten durchziehen", "Nach vorn springen", "Über den Kopf abrollen"],
    answer: 0, src: "Recherche 3 (JitsuIQ)",
    why: "Eine Hand stützt hinten, die andere schützt vorn. Dann Hüfte hoch und das Bein nach hinten.",
  },
  {
    id: "q-guard-best-bottom", day: 4, topic: "guard",
    q: "Ist die Guard unten schlecht für dich?",
    options: ["Nein – unten ist sie die beste Lage", "Ja – sie ist die schlechteste Lage"],
    answer: 0, src: "KB 3.2",
    why: "In der Guard hältst du ihn mit den Beinen auf Abstand. Dort kannst du sogar angreifen.",
  },

  // ---------- Tag 5: Stand, Distanz, Sprawl ----------
  {
    id: "q-stand-orthodox", day: 5, topic: "stand",
    q: "Was heißt Orthodox-Auslage?",
    options: ["Linker Fuß und linke Hand vorn", "Rechter Fuß und rechte Hand vorn", "Beide Füße nebeneinander"],
    answer: 0, src: "KB 3.1 (Evolve University)",
    why: "Orthodox: links vorn, starke Hand hinten. Southpaw ist das Spiegelbild.",
  },
  {
    id: "q-stand-sprawl", day: 5, topic: "stand",
    q: "Er schießt auf deine Beine (Double Leg). Was machst du?",
    options: ["Beine nach hinten, Hüfte runter (Sprawl)", "Stehen bleiben", "Hochspringen"],
    answer: 0, scene: { pos: "stand", top: null }, src: "KB 4.3 (JitsuIQ)",
    why: "Beim Sprawl schießen deine Beine nach hinten. Deine Hüfte drückt ihn Richtung Matte.",
  },
  {
    id: "q-stand-level", day: 5, topic: "stand",
    q: "Warum gehst du vor dem Shot in die Knie (Level Change)?",
    options: ["Damit du an seine Hüfte und Beine kommst", "Um dich auszuruhen", "Um höher zu springen"],
    answer: 0, src: "KB 3.1 (USA Wrestling)",
    why: "Du gehst tief, damit deine Schultern auf Höhe seiner Hüfte sind. Von oben erreichst du die Beine nicht.",
  },
  {
    id: "q-stand-head", day: 5, topic: "stand",
    q: "Du schießt mit dem Kopf tief nach unten. Was droht?",
    options: ["Ein Würger von vorn (Guillotine)", "Nichts", "Punkte für dich"],
    answer: 0, src: "KB 4.3 (Evolve MMA)",
    why: "Kopf unten beim Shot öffnet deinen Hals. Er kann die Guillotine ansetzen.",
  },
  {
    id: "q-stand-breakfall", day: 5, topic: "stand",
    q: "Du übst das Fallen aus dem Sitz nach hinten. Was ist richtig?",
    options: ["Kinn zur Brust, Arme schlagen auf die Matte", "Kopf nach hinten legen", "Mit den Händen nach hinten abstützen"],
    answer: 0, src: "Recherche 3 (Evolve MMA)",
    why: "Das Kinn an der Brust schützt deinen Kopf. Die Arme schlagen gleichzeitig auf die Matte.",
  },
  {
    id: "q-stand-partner", day: 5, topic: "stand",
    q: "Wann übst du Würfe und Takedowns mit einem Partner?",
    options: ["Nur auf Matten mit Trainer", "Zu Hause im Wohnzimmer", "Draußen auf der Wiese"],
    answer: 0, src: "KB 5.2",
    why: "Würfe nur auf Matten und mit Trainer. Vorher lernst du das sichere Fallen.",
  },
  {
    id: "q-stand-points", day: 5, topic: "stand",
    q: "Wie viele Punkte bringt ein Takedown im Turnier?",
    options: ["2", "4", "10"],
    answer: 0, src: "KB 3.3",
    why: "Ein Takedown bringt 2 Punkte, wenn du die Lage 3 Sekunden hältst.",
  },

  // ---------- Tag 6: Keile & Passieren ----------
  {
    id: "q-wedge-what", day: 6, topic: "keile",
    q: "Was hält jemanden am Boden fest?",
    options: ["Keile: Körperteile, die seine Wege sperren", "Nur dein Gewicht", "Lautes Rufen"],
    answer: 0, src: "Recherche 1 (Danaher laut BJJ More)",
    why: "Festhalten beruht auf Keilen, nicht nur auf Gewicht. Jeder Keil sperrt einen Fluchtweg.",
  },
  {
    id: "q-wedge-before-pass", day: 6, topic: "keile",
    q: "Du bist oben in der Guard. Was brauchst du vor dem Vorbeigehen?",
    options: ["Offene Beine und deine Hüfte als Keil", "Nur viel Kraft", "Gar nichts"],
    answer: 0, scene: { pos: "guard", top: "p" }, src: "KB 2.5 (GFF: Guard öffnen, dann passieren)",
    why: "Erst die Guard öffnen und blocken. Dann ist Platz zum Vorbeigehen (Pass).",
  },
  {
    id: "q-wedge-pair", day: 6, topic: "keile",
    q: "Er blockt dein Vorbeigehen auf einer Seite. Was jetzt?",
    options: ["Auf der anderen Seite angreifen", "Aufhören", "Mit Gewalt durchdrücken"],
    answer: 0, src: "KB 2.3",
    why: "Greif in Paaren an: Wehrt er eine Seite ab, läuft er in die andere.",
  },
  {
    id: "q-wedge-points", day: 6, topic: "keile",
    q: "Wie viele Punkte bringt ein Guard Pass im Turnier?",
    options: ["3", "1", "10"],
    answer: 0, src: "KB 3.3",
    why: "Ein Guard Pass bringt 3 Punkte, wenn du die Lage 3 Sekunden hältst.",
  },
  // ---------- Tag 6: Aufgabe & Verteidigung ----------
  {
    id: "q-sub-order", day: 6, topic: "aufgabe",
    q: "Welche Reihenfolge stimmt bei einer Aufgabe?",
    options: ["Erst Position, dann Griff, dann beenden", "Sofort beenden, egal wo", "Erst beenden, dann Position"],
    answer: 0, src: "KB 2.1, 2.8",
    why: "Position vor Aufgabe: erst kontrollieren, dann den Arm oder Hals fangen, dann langsam beenden.",
  },
  {
    id: "q-sub-slow", day: 6, topic: "aufgabe",
    q: "Im Training setzt du einen Hebel an. Wie machst du das?",
    options: ["Langsam, mit Pause, damit er abklopfen kann", "Ruckartig", "Mit voller Kraft"],
    answer: 0, src: "KB 5.1",
    why: "Erst Kontrolle, dann Druck, dann Pause. So hat dein Partner Zeit zum Abklopfen.",
  },
  {
    id: "q-sub-rnc-def", day: 6, topic: "aufgabe",
    q: "Er ist an deinem Rücken und will würgen. Was zuerst?",
    options: ["Kinn runter, beide Hände an seine Hände", "Arme ausstrecken", "Still halten"],
    answer: 0, scene: { pos: "back", top: "o" }, src: "KB 4.5 (BJJ Atlas)",
    why: "Kinn auf die Brust, beide Hände gegen seine Hände. Erst die Hände, dann die Haken lösen.",
  },
  {
    id: "q-sub-armbar-def", day: 6, topic: "aufgabe",
    q: "Er will deinen Arm strecken (Armbar). Was hilft dir?",
    options: ["Ellbogen eng, Arm gebeugt lassen", "Den Arm weit strecken", "Nichts, einfach abwarten"],
    answer: 0, src: "KB 4.5", check: true,
    why: "Die Armbar braucht einen gestreckten Arm. Halte den Ellbogen eng und den Arm gebeugt.",
  },
  {
    id: "q-sub-illegal", day: 6, topic: "aufgabe",
    q: "Welche Technik ist für Weißgurte im Turnier verboten?",
    options: ["Heel Hook (Fersendreher)", "Armbar", "Triangle"],
    answer: 0, src: "KB 5.3",
    why: "Heel Hooks sind für Weißgurte verboten. Armbar und Triangle sind erlaubt.",
  },
];

export const Q_BY_ID: Record<string, Question> = Object.fromEntries(QUESTIONS.map((q) => [q.id, q]));
