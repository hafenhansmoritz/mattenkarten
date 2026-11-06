// 7-Tage-Startprogramm – Fragenbank (Multiple Choice, 2–4 Optionen, je ein Warum-Satz).
// Inhalte nach docs/knowledge-base.md (KB) und research_notes/7 Tage Startprogramm/notes.md.
// check: true = keine direkte Quelle in KB/Recherche → Trainer prüfen.
// No-Gi-Fokus (KB 8.12, docs/research/no-gi-fokus.md): Griffe an Körperteilen, Rücken/Front Headlock an Tag 6,
// Beinhebel nur als Sicherheitswissen (IBJJF Weißgurt = strengste Regel).
import type { Pos2, Side } from "../core2/types";
import type { BodyPart } from "../components/fighters";

export type Topic =
  | "positionen" | "abklopfen" | "mount" | "side" | "guard" | "stand" | "keile" | "aufgabe" | "ruecken" | "schutz";

/** Prüfungsbereiche für Tag 7 (je ≥ 80 %). */
export type Area = "basis" | "befreien" | "guardstand" | "kontrolle";

export const TOPIC_AREA: Record<Topic, Area> = {
  positionen: "basis", abklopfen: "basis",
  mount: "befreien", side: "befreien", schutz: "befreien",
  guard: "guardstand", stand: "guardstand",
  keile: "kontrolle", aufgabe: "kontrolle", ruecken: "kontrolle",
};

export const AREA_LABEL: Record<Area, string> = {
  basis: "Positionen & Abklopfen",
  befreien: "Befreien aus Mount & Side",
  guardstand: "Guard & Stand",
  kontrolle: "Rücken, Keile & Aufgaben",
};

export const TOPIC_LABEL: Record<Topic, string> = {
  positionen: "Positionen", abklopfen: "Abklopfen", mount: "Mount-Befreiung", side: "Side-Befreiung",
  guard: "Guard", stand: "Stand & Hand Fighting", keile: "Keile & Passieren", aufgabe: "Aufgabe & Verteidigung",
  ruecken: "Rücken & Front Headlock", schutz: "Schutzhaltung",
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
  /**
   * Bilderrätsel: große Silhouetten-Szene, optional ein Körperteil hervorgehoben.
   * Frage „Wo bist du?“ oder „Was ist hier falsch?“. Optionen ohne Kartennamen.
   */
  kind?: "image" | "erklaeren";
  image?: { pos: Pos2; top: Side | null; mark?: { side: Side; part: BodyPart } };
  /**
   * Freie Wiedergabe (kind: "erklaeren"): Du schreibst einen Satz. `why` ist die Musterantwort,
   * `points` die Kernpunkte, an denen der Coach (oder du selbst) die Antwort misst. options = [], answer = -1.
   */
  explain?: { points: string[] };
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
    why: "Vom Rücken aus kontrollierst du ihn, und er sieht dich kaum. Rücken und Mount gelten meist als die stärksten Lagen.",
  },
  {
    id: "q-pos-mount-name", day: 1, topic: "positionen",
    q: "Er sitzt rittlings auf deinem Bauch. Wie heißt das?",
    options: ["Mount", "Seitenkontrolle", "Guard"],
    answer: 0, scene: { pos: "mount", top: "o" }, src: "KB 3.2",
    why: "Mount heißt: Er sitzt auf dir. Unten ist das eine der schlechtesten Lagen.",
  },
  {
    id: "q-pos-guard-name", day: 1, topic: "positionen",
    q: "Du liegst unten, deine Beine sind um seine Hüfte. Wie heißt das?",
    options: ["Guard", "Mount", "Turtle"],
    answer: 0, scene: { pos: "guard", top: "o" }, src: "KB 3.2",
    why: "Guard heißt: Deine Beine sind zwischen euch. Liegst du unten, ist das meist die beste Lage.",
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
    q: "Du liegst oben quer auf ihm: Seitenkontrolle (Side Control). Was ist dein Ziel?",
    options: ["Ruhig halten, dann aufsteigen oder beenden", "Sofort aufstehen und weggehen", "Loslassen und neu anfangen"],
    answer: 0, scene: { pos: "side", top: "p" }, src: "KB 3.2",
    why: "Oben heißt: stabil halten, seine Flucht verhindern, aufsteigen. Erst dann beenden.",
  },
  {
    id: "q-pos-side-vs-guard", day: 1, topic: "positionen",
    q: "Wo bist du unten besser dran?",
    options: ["In der Guard", "Unter der Seitenkontrolle", "Unter dem Mount"],
    answer: 0, src: "KB 3.2",
    why: "In der Guard sind deine Beine zwischen euch. Unter der Seitenkontrolle und Mount fehlt dir dieser Schutz.",
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
    options: ["Ellbogen an die Knie (Schutzhaltung)", "Arme weit nach oben strecken", "Auf den Bauch drehen"],
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
    why: "Steht er breit, rollt er schwer. Dann wechselst du zu „Wegrutschen, Knie dazwischen“ (Elbow Escape).",
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
    q: "Er liegt quer auf dir: Seitenkontrolle (Side Control). Welche Reihenfolge stimmt?",
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
    id: "q-guard-pairs", day: 4, topic: "guard",
    q: "Du wehrst seinen ersten Angriff ab. Warum bist du noch nicht sicher?",
    options: ["Gute Angriffe kommen in Paaren: deine Abwehr öffnet oft den nächsten", "Nach einer Abwehr ist die Runde vorbei", "Eine Abwehr bringt dir Punkte"],
    answer: 0, src: "KB 2.3, 4.6 (Dilemma-Paare, z. B. Armbar ↔ Triangle)",
    why: "Angriffe kommen in Paaren. Wehrst du das eine ab, öffnet sich oft das andere, etwa Armbar und Triangle.",
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
    options: ["Nein – unten ist sie meist die beste Lage", "Ja – sie ist die schlechteste Lage"],
    answer: 0, src: "KB 3.2",
    why: "In der Guard hältst du ihn mit den Beinen auf Abstand und kannst angreifen. Im MMA ist Aufstehen oft wichtiger.",
  },
  {
    id: "q-guard-nogi-grip", day: 4, topic: "guard",
    q: "Ohne Gi (No-Gi) liegst du unten in der Guard. Was greifst du?",
    options: ["Nacken und Arm (Collar Tie, Overhook)", "Kragen und Ärmel", "Seinen Gürtel"],
    answer: 0, scene: { pos: "guard", top: "o" }, src: "KB 8.12 (Evolve MMA No-Gi Grip Fighting)",
    why: "Ohne Gi gibt es keinen Stoff. Du greifst Körperteile: Nacken, Handgelenk oder den Arm von oben.",
  },
  {
    id: "q-guard-guillotine-top", day: 4, topic: "guard",
    q: "Du bist oben in seiner Guard. Er umfasst deinen Hals von vorn (Guillotine). Was hilft?",
    options: ["Kopf hoch, Hüfte gerade, am Handgelenk drücken", "Am Ellbogen drücken", "Den Kopf noch tiefer stecken"],
    answer: 0, scene: { pos: "guard", top: "p" }, src: "BJJ More – How to Escape a Guillotine; Karte gt_both_arms",
    why: "Am Ellbogen drücken zieht den Würger enger. Drück am Handgelenk und halte die Hüfte gerade.",
  },
  {
    id: "q-guard-butterfly", day: 4, topic: "guard",
    q: "Du sitzt vor ihm, deine Füße haken innen an seinen Oberschenkeln. Wie heißt das?",
    options: ["Butterfly Guard", "Mount", "Seitenkontrolle"],
    answer: 0, src: "KB 8.12 (Gymdesk), BJJ Atlas Butterfly Sweep",
    why: "Deine Füße sind Haken (Butterfly). Ohne Gi funktioniert sie besser als viele andere offene Guards.",
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
  {
    id: "q-stand-wrist", day: 5, topic: "stand",
    q: "Im Stand greift er nach deinen Händen. Was machst du?",
    options: ["Sein Handgelenk kontrollieren oder den Griff lösen", "Ihn einfach greifen lassen", "Mit aller Kraft festklammern"],
    answer: 0, scene: { pos: "stand", top: null }, src: "KB 8.12 (Evolve MMA, Grapplearts No-Gi Gripfighting)",
    why: "Schenk ihm nicht den ersten Griff. Halt sein Handgelenk an der schmalsten Stelle, aber ohne Todesgriff.",
  },
  {
    id: "q-stand-underhook", day: 5, topic: "stand",
    q: "Im Clinch: Welcher Griff hilft dir als Anfänger am meisten?",
    options: ["Arm unter seiner Achsel (Underhook)", "Seine Finger festhalten", "Beide Hände auf seinen Kopf"],
    answer: 0, src: "KB 8.12 (Evolve MMA No-Gi Grip Fighting, Pummeling)",
    why: "Mit dem Underhook kommst du an seine Beine und bremst seinen Shot. Verlierst du ihn, schwimm innen zurück.",
  },
  {
    id: "q-stand-snap", day: 5, topic: "stand",
    q: "Er drückt mit gesenktem Kopf nach vorn. Was passt?",
    options: ["Kopf runterziehen (Snap Down), dann vorn halten", "Rückwärts weglaufen", "Ihn hochheben"],
    answer: 0, src: "Karte cl_snap_down (JitsuIQ Snap-Down)",
    why: "Gegen Vorwärtsdruck ziehst du den Kopf runter. Er landet vor dir, du hältst seinen Kopf (Front Headlock).",
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
  {
    id: "q-sub-leglock", day: 6, topic: "aufgabe",
    q: "Er hat dein Bein in einem Beinhebel. Was tust du?",
    options: ["Früh abklopfen, nicht rausdrehen", "Schnell rausdrehen", "Warten, bis es weh tut"],
    answer: 0, src: "KB 8.12 (Gracie Barra Leg Locks in Training, Lachlan Giles/FloGrappling)",
    why: "Heel Hook für Weißgurte verboten; bei Beinhebel früh abklopfen, nie rausdrehen. Der Schaden kommt oft vor dem Schmerz.",
  },
  // ---------- Tag 6: Rücken & Front Headlock (No-Gi) ----------
  {
    id: "q-back-seatbelt", day: 6, topic: "ruecken",
    q: "Du kommst an seinen Rücken. Was zuerst?",
    options: ["Gurtgriff (Seatbelt), dann die Haken", "Erst die Füße kreuzen", "Sofort würgen"],
    answer: 0, scene: { pos: "back", top: "p" }, src: "Karten bt_seatbelt, bt_hooks (BJJ More Back Attacks, Gymdesk Punkte)",
    why: "Kontrolle vor Aufgabe: Der Gurtgriff hält ihn an deiner Brust. Dann die Haken, Füße nie kreuzen.",
  },
  {
    id: "q-back-headlock", day: 6, topic: "ruecken",
    q: "Du bist auf allen vieren (Turtle), er hält deinen Kopf vorn. Was tust du?",
    options: ["Am Handgelenk drücken und den Kopf rausziehen", "Am Ellbogen ziehen", "Kinn hoch und abwarten"],
    answer: 0, scene: { pos: "turtle", top: "o" }, src: "Karte tb_guillotine_def (BJJ More Guillotine Escape)",
    why: "Vorn am Kopf droht die Guillotine. Drück am Handgelenk, nicht am Ellbogen, und zieh den Kopf raus.",
  },
  {
    id: "q-back-turtle-fast", day: 6, topic: "ruecken",
    q: "Du landest auf allen vieren (Turtle). Wie lange bleibst du dort?",
    options: ["Kurz – nach etwa zwei Sekunden raus oder aufstehen", "So lange wie möglich", "Bis er aufgibt"],
    answer: 0, src: "Karte tb_base (BJJ Atlas Turtle Escapes)",
    why: "Wer in der Turtle wartet, gibt den Rücken ab. Hände frei machen, dann aufstehen oder rausdrehen.",
  },
  {
    id: "q-back-escape-side", day: 6, topic: "ruecken",
    q: "Er ist an deinem Rücken. Wohin befreist du dich?",
    options: ["Zur Seite, notfalls in der Seitenkontrolle unten", "Nach vorn auf den Bauch", "Gar nicht – still halten"],
    answer: 0, scene: { pos: "back", top: "o" }, src: "Karte bb_escape_side (BJJ Atlas Back Escapes)",
    why: "Erst die Hände, dann raus zur Seite. Seitenkontrolle unten ist besser, als den Rücken abzugeben.",
  },

  // ---------- Grundkonzept Schutzhaltung (Tag 2, src/program/concepts.ts) ----------
  {
    id: "q-schutz-elbows", day: 2, topic: "schutz",
    q: "Unten unter Druck: Wo gehören deine Ellbogen hin?",
    options: ["Eng an deinen Körper", "Weit weg, Arme gestreckt", "Hinter deinen Kopf"],
    answer: 0, scene: { pos: "side", top: "o" }, src: "Cursa (Ellbogen an die Rippen); KB 4.5",
    why: "Eng am Körper kann er deinen Arm nicht isolieren. Gestreckte Arme laden zum Armhebel ein.",
  },
  {
    id: "q-schutz-neck", day: 2, topic: "schutz",
    q: "Er sucht deinen Hals. Was machen Kinn und Hände?",
    options: ["Kinn runter, Hände vorn am Hals", "Kinn hoch, Hände auf die Matte", "Kopf wegdrehen, Arme weit auf"],
    answer: 0, src: "Cursa (Hände schützen den Raum am Hals); KB 4.5 (RNC: Kinn runter)",
    why: "Kinn und Hände schützen den Raum am Hals. So kommt kein Würger durch. Kinn runter, aber nicht verkrampfen.",
  },
  {
    id: "q-schutz-back", day: 2, topic: "schutz",
    q: "Es wird eng unter ihm. Drehst du dich weg und zeigst ihm den Rücken?",
    options: ["Nein – Rücken nie zeigen, zu ihm drehen", "Ja, so kommst du am schnellsten weg", "Ja, auf dem Bauch bist du sicher"],
    answer: 0, scene: { pos: "mount", top: "o" }, src: "Cursa (nicht wegdrehen, Rücken nicht geben); KB 3.2",
    why: "Wer sich wegdreht, gibt den Rücken frei. Von dort kontrolliert er dich am stärksten.",
  },
];


// ---------- Bilderrätsel (Tag 1–4): „Wo bist du?“ / „Was ist hier falsch?“ ----------
// Die Silhouette zeigt die Lage, Gelb zeigt die Stelle. Details stehen im Fragetext.
export const IMAGE_QUESTIONS: Question[] = [
  {
    id: "qi-where-side", day: 1, topic: "positionen", kind: "image",
    image: { pos: "side", top: "o" },
    q: "Wo bist du?",
    options: ["Unten, er liegt quer auf dir", "Oben, du sitzt auf ihm", "Unten, deine Beine sind um ihn"],
    answer: 0, src: "KB 3.2",
    why: "Er liegt quer über deiner Brust: Seitenkontrolle, du unten. Dein Ziel: schützen und raus.",
  },
  {
    id: "qi-where-back", day: 1, topic: "positionen", kind: "image",
    image: { pos: "back", top: "p", mark: { side: "p", part: "arms" } },
    q: "Wo bist du – und wie gut ist das?",
    options: ["An seinem Rücken – meist die stärkste Lage", "Unten in der Guard – eher schlecht", "Im Stand – noch offen"],
    answer: 0, src: "KB 3.2",
    why: "Du bist hinter ihm, deine Arme umfassen ihn. Vom Rücken aus kontrollierst du am meisten.",
  },
  {
    id: "qi-mount-elbows", day: 2, topic: "mount", kind: "image",
    image: { pos: "mount", top: "o", mark: { side: "p", part: "arms" } },
    q: "Er sitzt auf dir. Deine Ellbogen (gelb) sind weit weg von den Knien. Was ist hier falsch?",
    options: ["Ellbogen gehören eng an die Knie", "Nichts, weite Arme halten ihn weg", "Du solltest still liegen"],
    answer: 0, src: "KB 4.5; Karten mb_knee_inside, mb_elbows_tight",
    why: "Ellbogen an den Knien bilden deinen Rahmen. Gestreckte Arme laden zum Armhebel ein.",
  },
  {
    id: "qi-mount-turn", day: 2, topic: "mount", kind: "image",
    image: { pos: "mount", top: "o", mark: { side: "p", part: "torso" } },
    q: "Unten im Mount drehst du dich auf den Bauch, weg von ihm. Was ist hier falsch?",
    options: ["Du zeigst ihm deinen Rücken", "Du drehst dich zu langsam", "Nichts, so kommst du raus"],
    answer: 0, src: "KB 3.2",
    why: "Wer sich wegdreht, gibt den Rücken frei. Das ist für ihn die stärkste Lage.",
  },
  {
    id: "qi-side-flat", day: 3, topic: "side", kind: "image",
    image: { pos: "side", top: "o", mark: { side: "p", part: "arms" } },
    q: "Er liegt quer auf dir. Deine Arme (gelb) liegen flach neben dir. Was ist hier falsch?",
    options: ["Unterarme gehören als Stütze an Hals und Hüfte", "Nichts, flach liegen spart Kraft", "Du solltest ihn sofort würgen"],
    answer: 0, src: "KB 4.5 (BJJ Atlas: Frame first)",
    why: "Erst Rahmen, dann Brücke, dann wegrutschen. Ohne Stütze drückt er dich flach.",
  },
  {
    id: "qi-where-half", day: 3, topic: "side", kind: "image",
    image: { pos: "half", top: "o", mark: { side: "p", part: "legs" } },
    q: "Deine Beine (gelb) halten eins seiner Beine fest. Wo bist du?",
    options: ["Unten in der halben Guard", "Oben im Mount", "Unten in der Seitenkontrolle"],
    answer: 0, src: "KB 3.2",
    why: "Ein Bein von ihm ist gefangen: Halbe Guard. Besser als Seitenkontrolle unten, schlechter als volle Guard.",
  },
  {
    id: "qi-guard-posture", day: 4, topic: "guard", kind: "image",
    image: { pos: "guard", top: "p", mark: { side: "p", part: "torso" } },
    q: "Du kniest in seiner Guard. Dein Rücken (gelb) ist rund, dein Kopf ganz unten. Was ist hier falsch?",
    options: ["Du brauchst Haltung: aufrecht, Rücken gerade", "Nichts, tief bist du sicher", "Du solltest dich auf ihn legen"],
    answer: 0, src: "KB 4.5; Karte gt_posture",
    why: "Wer nach vorn kippt, läuft in Würger und Hebel. Aufrecht schützt du Hals und Arme.",
  },
  {
    id: "qi-guard-flat", day: 4, topic: "guard", kind: "image",
    image: { pos: "guard", top: "o", mark: { side: "o", part: "torso" } },
    q: "Er sitzt aufrecht in deiner Guard (gelb). Du liegst flach und wartest. Was ist hier falsch?",
    options: ["Du musst ihn zu dir runterziehen", "Nichts, warten ist sicher", "Du solltest deine Beine öffnen"],
    answer: 0, src: "Karte gb_break_posture; Tag 4 (Unten: Haltung brechen)",
    why: "Aufrecht kann er vorbeigehen. Zieh ihn mit den Knien und Händen runter, dann greifst du an.",
  },
];

// ---------- Freie Wiedergabe (Tag 2–6): „Erklär in einem Satz …“ ----------
// Selbsterklärung in eigenen Worten (KB 8.6: freie Antwort statt Auswahl; KI-Bewertung = Hypothese).
// Mit Coach-Zustimmung bewertet api/coach.ts (mode "grade") gegen `points`, sonst bewertest du dich selbst.
const ex = (id: string, day: number, topic: Topic, q: string, why: string, points: string[], src: string): Question =>
  ({ id, day, topic, kind: "erklaeren", q, options: [], answer: -1, why, explain: { points }, src });

export const EXPLAIN_QUESTIONS: Question[] = [
  ex("qe-mount-elbows", 2, "mount",
    "Erklär in einem Satz, warum du unten im Mount erst die Ellbogen an die Knie bringst.",
    "Ellbogen an den Knien bilden deinen Rahmen. Gestreckte Arme laden zum Armhebel ein – erst schützen, dann befreien.",
    ["Ellbogen und Knie bilden einen Rahmen (Schutz)", "Gestreckte Arme laden zum Armhebel ein", "Erst schützen, dann befreien"],
    "KB 4.5; Karten mb_knee_inside, mb_elbows_tight"),
  ex("qe-side-frame", 3, "side",
    "Erklär in einem Satz, warum du unten in der Seitenkontrolle erst rahmst und dann wegrutschst.",
    "Der Rahmen hält Abstand. So hast du den Platz, den deine Hüfte zum Wegrutschen braucht.",
    ["Der Rahmen (Unterarm) hält Abstand", "Platz für die Hüfte zum Wegrutschen (Shrimp)"],
    "KB 2.4, 4.5 (BJJ Atlas: Frame first)"),
  ex("qe-guard-posture", 4, "guard",
    "Erklär in einem Satz, warum du oben in der Guard zuerst aufrecht sitzt.",
    "Aufrecht schützt du Hals und Arme. Wer nach vorn kippt, läuft in Würger und Hebel.",
    ["Aufrecht schützt Hals und Arme", "Nach vorn kippen führt in Würger oder Hebel"],
    "KB 4.5; Karte gt_posture"),
  ex("qe-stand-sprawl", 5, "stand",
    "Erklär in einem Satz, warum beim Sprawl deine Beine nach hinten schießen.",
    "Er greift ins Leere, weil deine Beine weg sind. Deine Hüfte drückt ihn Richtung Matte.",
    ["Die Beine sind weg, er findet nichts zum Greifen", "Die Hüfte drückt ihn nach unten"],
    "KB 4.3 (JitsuIQ); Karte nd_sprawl"),
  ex("qe-back-hands", 6, "aufgabe",
    "Erklär in einem Satz, warum du gegen den Würger von hinten zuerst Kinn und Hände einsetzt.",
    "Kinn auf die Brust und beide Hände an seine Hände schützen deinen Hals. Erst dann löst du die Haken.",
    ["Kinn runter und Hände an seine Hände schützen den Hals", "Erst den Hals schützen, dann rauskommen"],
    "KB 4.5 (BJJ Atlas); Karte bb_escape_side"),
  ex("qe-leglock-tap", 6, "aufgabe",
    "Erklär in einem Satz, warum du bei einem Beinhebel früh abklopfst, statt rauszudrehen.",
    "Beim Beinhebel kommt der Schaden oft vor dem Schmerz. Rausdrehen verletzt das Knie, also früh abklopfen.",
    ["Der Schaden kommt vor dem Schmerz", "Rausdrehen kann das Knie verletzen", "Deshalb früh abklopfen"],
    "KB 8.12 (Gracie Barra Leg Locks in Training, Lachlan Giles/FloGrappling)"),
];

/** Ein-Satz-Fragen eines Programm-Tags (kommen nach den Rätseln). */
export function explainFor(day: number): string[] {
  return EXPLAIN_QUESTIONS.filter((q) => q.day === day).map((q) => q.id);
}

/** Sicherheitsregeln (UX-Review 2026-11-06): falsche Antwort → „Achtung – Sicherheitsregel“ statt „Fast“.
 *  Alle Abklopf-Fragen plus Fallen, Würfe mit Partner, Hebel langsam, verbotene Techniken, Beinhebel. */
export const SAFETY_IDS: ReadonlySet<string> = new Set([
  "q-stand-breakfall", "q-stand-partner", "q-sub-slow", "q-sub-illegal", "q-sub-leglock",
]);
export function isSafetyQuestion(q: Question): boolean {
  return q.topic === "abklopfen" || SAFETY_IDS.has(q.id);
}

/** Alle Fragen (Text + Bild + Ein-Satz) – Nachschlagen, Wiederholung und Fehlerdeck. */
export const ALL_QUESTIONS: Question[] = [...QUESTIONS, ...IMAGE_QUESTIONS, ...EXPLAIN_QUESTIONS];
export const Q_BY_ID: Record<string, Question> = Object.fromEntries(ALL_QUESTIONS.map((q) => [q.id, q]));
