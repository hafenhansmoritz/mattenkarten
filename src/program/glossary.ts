// Antippbare Fachbegriffe in Programm-, Rätsel- und Drill-Texten (UX-Review 2026-11-06, Punkt 10).
// Begriffs-Standard (docs/knowledge-base.md, „Begriffs-Standard“): deutsches Alltagswort zuerst,
// englischer No-Gi-Begriff in Klammern. Erklärungen nach KB 4.x und den Karten-Texten (src/core2/data/cards.ts).

export interface GlossaryTerm {
  id: string;
  /** Deutsches Alltagswort (Standard). */
  de: string;
  /** No-Gi-Fachbegriff (englisch), falls anders als `de`. */
  en?: string;
  /** Ein bis zwei Sätze, Alltagssprache. */
  explain: string;
  /** Schreibweisen, die im Text gefunden werden (längste zuerst wird automatisch sortiert). */
  match: string[];
}

export const GLOSSARY: GlossaryTerm[] = [
  // ---------- Positionen ----------
  { id: "side", de: "Seitenkontrolle", en: "Side Control", match: ["Seitenkontrolle", "Side Control"],
    explain: "Er liegt quer über deiner Brust, ihr seid Brust an Brust. Oben: halten und aufsteigen. Unten: Rahmen bauen, Hüfte weg, Guard zurück." },
  { id: "half", de: "Halbe Guard", en: "Half Guard", match: ["Halbe Guard", "halbe Guard", "halben Guard", "Half Guard"],
    explain: "Du hast nur ein Bein von ihm zwischen deinen Beinen gefangen. Besser als Seitenkontrolle unten, schlechter als die volle Guard." },
  { id: "guard", de: "Guard", explain: "Du liegst unten, deine Beine sind zwischen euch – sie schützen dich. Unten in der Guard bist du nicht verloren.",
    match: ["Guard"] },
  { id: "butterfly", de: "Schmetterlings-Guard", en: "Butterfly Guard", match: ["Butterfly Guard", "Butterfly"],
    explain: "Du sitzt, deine Füße haken innen an seinen Oberschenkeln ein. Gut zum Umwerfen und Aufstehen – typisch für No-Gi." },
  { id: "mount", de: "Mount", en: "Mount", match: ["Mount"],
    explain: "Einer sitzt auf dem Bauch des anderen. Oben ist eine der besten Lagen, unten eine der schlechtesten." },
  { id: "back", de: "Rücken", en: "Back Control", match: ["Rückenkontrolle", "Back Control"],
    explain: "Er ist hinter dir, die Füße innen an deinen Oberschenkeln (Haken). Die gefährlichste Lage für dich – Hände an den Hals." },
  { id: "turtle", de: "Turtle", en: "Turtle", match: ["Turtle"],
    explain: "Auf Knien und Ellbogen eingerollt wie eine Schildkröte. Nur eine Zwischenstation: Er kommt leicht an deinen Rücken." },
  { id: "fhl", de: "Kopfklammer", en: "Front Headlock", match: ["Kopfklammer", "Front Headlock"],
    explain: "Du klemmst von vorn seinen Kopf unter deinem Arm ein. Von hier kommen Guillotine und Go-Behind." },
  // ---------- Griffe ----------
  { id: "underhook", de: "Unterhaken", en: "Underhook", match: ["Unterhaken", "Underhook"],
    explain: "Dein Arm unter seiner Achsel, Hand an seinem Rücken. Wer den Unterhaken hat, bestimmt meist, wohin es geht." },
  { id: "overhook", de: "Überhaken", en: "Overhook / Whizzer", match: ["Overhook", "Whizzer", "Überhaken"],
    explain: "Dein Arm klemmt seinen Arm von oben ein. Die Antwort auf seinen Unterhaken." },
  { id: "collar", de: "Nackengriff", en: "Collar Tie", match: ["Nackengriff", "Collar Tie"],
    explain: "Deine Hand an seinem Nacken. Im No-Gi der Ersatz für den Kragengriff." },
  { id: "crossface", de: "Kopf wegdrehen", en: "Crossface", match: ["Crossface"],
    explain: "Oben drückst du mit Schulter und Unterarm sein Gesicht von dir weg. Wohin der Kopf zeigt, kann er sich nicht drehen." },
  { id: "seatbelt", de: "Gurtgriff", en: "Seatbelt", match: ["Gurtgriff", "Seatbelt"],
    explain: "Am Rücken: ein Arm über seine Schulter, einer unter der Achsel, Hände verbunden – wie ein Sicherheitsgurt." },
  { id: "hooks", de: "Haken", en: "Hooks", match: ["Haken", "Hooks"],
    explain: "Deine Füße innen an seinen Oberschenkeln. Am Rücken halten sie ihn fest, in der Butterfly Guard heben sie ihn an." },
  { id: "bodylock", de: "Umklammern", en: "Body Lock", match: ["Body Lock"],
    explain: "Deine Arme um seinen Körper, Hände verbunden. Gut zum Werfen im Stand und zum Passieren am Boden." },
  { id: "wrist", de: "Handgelenk kontrollieren", en: "Wrist Control", match: ["Wrist Control"],
    explain: "Du hältst sein Handgelenk. Wer die Hände kontrolliert, kann nicht gegriffen werden." },
  // ---------- Bewegungen ----------
  { id: "upa", de: "Brücke und rollen", en: "Upa", match: ["Upa"],
    explain: "Unten im Mount: Arm und Fuß derselben Seite einklemmen, Hüfte hoch, über die Schulter rollen." },
  { id: "bridge", de: "Brücke", en: "Bridge", match: ["Brücke", "Bridge"],
    explain: "Auf dem Rücken die Hüfte hochdrücken – über Schultern und Füße, nie über den Nacken. Schafft Platz von unten." },
  { id: "shrimp", de: "Wegrutschen", en: "Shrimp", match: ["Shrimp", "Wegrutschen", "wegrutschen"],
    explain: "Auf der Seite mit einem Fuß abdrücken und die Hüfte wegschieben. Die wichtigste Bewegung von unten." },
  { id: "elbowescape", de: "Wegrutschen, Knie dazwischen", en: "Elbow Escape", match: ["Elbow Escape"],
    explain: "Die Befreiung: Ellbogen und Knie verbinden (Ellbogen-Knie-Verbindung), wegrutschen, Knie zwischen euch – erst halbe, dann volle Guard." },
  { id: "elbowknee", de: "Ellbogen-Knie-Verbindung", en: "Elbow-Knee Connection", match: ["Ellbogen-Knie-Verbindung"],
    explain: "Ellbogen und Knie derselben Seite berühren sich. So kommt kein Arm oder Bein von ihm dazwischen." },
  { id: "frame", de: "Rahmen", en: "Frame", match: ["Rahmen", "Frame"],
    explain: "Unterarm oder Hand als Stütze gegen Hals oder Hüfte. Kein Drücken mit Kraft – nur Abstand halten." },
  { id: "standup", de: "Sicher aufstehen", en: "Technical Stand-up", match: ["Technical Stand-up"],
    explain: "Hand hinten stützen, Fuß vorn aufstellen, Hüfte hoch, Bein nach hinten durchziehen – aufstehen mit Abstand." },
  { id: "sprawl", de: "Beine weg, Hüfte drauf", en: "Sprawl", match: ["Sprawl"],
    explain: "Schießt er auf deine Beine: Beine weit nach hinten, Hüfte auf seine Schultern. Stoppt den Takedown." },
  { id: "snap", de: "Kopf runterziehen", en: "Snap Down", match: ["Snap Down"],
    explain: "Du ziehst seinen Kopf nach unten, bis er auf die Hände fällt – oft in die Kopfklammer." },
  { id: "double", de: "Beide Beine schnappen", en: "Double Leg", match: ["Double Leg"],
    explain: "Tief gehen, Schritt rein, beide Beine greifen, durchsteigen. Der klassische Takedown." },
  { id: "single", de: "Ein Bein schnappen", en: "Single Leg", match: ["Single Leg"],
    explain: "Ein Bein greifen, Kopf innen an seiner Brust. Kopf außen ist für IBJJF-Weißgurte verboten." },
  { id: "level", de: "Tief gehen", en: "Level Change", match: ["Level Change"],
    explain: "In die Knie gehen, Rücken gerade – vor jedem Beinangriff." },
  { id: "pass", de: "Vorbeigehen", en: "Guard Pass", match: ["Passieren", "passieren"],
    explain: "Oben an seinen Beinen vorbei in Seitenkontrolle oder Mount kommen. Bringt im Turnier 3 Punkte." },
  // ---------- Aufgaben ----------
  { id: "tap", de: "Abklopfen", en: "Tap", match: ["Abklopfen", "abklopfen", "Tap"],
    explain: "Zwei-, dreimal deutlich auf ihn oder die Matte klopfen – oder laut „Stopp“. Dann lässt er sofort los." },
  { id: "kimura", de: "Schulterhebel nach hinten", en: "Kimura", match: ["Kimura"],
    explain: "Du drehst seinen gebeugten Arm mit beiden Händen (Figure-Four) hinter seinen Rücken. Im Training langsam, damit er abklopfen kann." },
  { id: "americana", de: "Schulterhebel nach oben", en: "Americana", match: ["Americana"],
    explain: "Oben: sein Arm gebeugt wie ein L neben seinem Kopf, Handgelenk am Boden. Du schiebst es Richtung Hüfte und hebst den Ellbogen – langsam." },
  { id: "guillotine", de: "Kopf-Würger von vorn", en: "Guillotine", match: ["Guillotine"],
    explain: "Sein Kopf unter deinem Arm, dein Unterarm am Hals, du ziehst nach oben. Darum beim Shot den Kopf hoch halten." },
  { id: "rnc", de: "Würger von hinten", en: "Rear Naked Choke", match: ["Rear Naked Choke", "RNC"],
    explain: "Vom Rücken: Arm um den Hals, Hand am eigenen Bizeps. Verteidigung: Kinn runter, beide Hände an seine Hände." },
  { id: "armbar", de: "Arm strecken", en: "Armbar", match: ["Armbar"],
    explain: "Sein Arm zwischen deinen Beinen, Daumen nach oben, Hüfte langsam heben. Verteidigung: Ellbogen eng." },
  { id: "triangle", de: "Beine-Dreieck um Hals", en: "Triangle", match: ["Triangle"],
    explain: "Deine Beine schließen Hals und einen Arm ein. Verteidigung: aufrecht bleiben, Haltung halten." },
  { id: "heelhook", de: "Fersendreher", en: "Heel Hook", match: ["Heel Hook", "Heel Hooks"],
    explain: "Beinhebel, der das Knie verdreht. Für Weißgurte verboten. Bei jedem Beinhebel: früh abklopfen, nie rausdrehen." },
];

export const GLOSSARY_BY_ID: Record<string, GlossaryTerm> = Object.fromEntries(GLOSSARY.map((g) => [g.id, g]));

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const ALL_MATCHES = GLOSSARY.flatMap((g) => g.match.map((m) => ({ m, id: g.id }))).sort((a, b) => b.m.length - a.m.length);
const ID_OF = new Map(ALL_MATCHES.map((x) => [x.m, x.id]));
// Wortgrenzen auch für Umlaute: kein Buchstabe direkt davor oder danach.
const RE = new RegExp(`(?<![A-Za-zÄÖÜäöüß-])(${ALL_MATCHES.map((x) => esc(x.m)).join("|")})(?![A-Za-zÄÖÜäöüß])`, "g");

export type TermPart = string | { text: string; id: string };

/** Zerlegt einen Text in Klartext und antippbare Begriffe – jeder Begriff nur beim ersten Auftauchen (pro `seen`). */
export function splitTerms(text: string, seen: Set<string> = new Set()): TermPart[] {
  const out: TermPart[] = [];
  let last = 0;
  for (const m of text.matchAll(RE)) {
    const id = ID_OF.get(m[1]);
    if (!id || seen.has(id)) continue;
    seen.add(id);
    if (m.index! > last) out.push(text.slice(last, m.index));
    out.push({ text: m[1], id });
    last = m.index! + m[1].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}
