// Erweiterungs-Karten (Content-Paket 2). Wird von cards.ts eingebunden; Belohnungen von campaign.ts.
// Nur bestehende Positionen und Tags. Jede Karte ist in docs/knowledge-base.md, Abschnitt 4.7, belegt.
// Punkte nach IBJJF: Sweep 2, Pass 3. Knee on Belly gibt im Spiel Kontrolle statt Punkte (kein Punkte-Spam ohne Positionswechsel).
import type { CardDef } from "../engine/types";
import { SRC } from "./sources";
import {
  BACK_BOTTOM, BACK_TOP, CLINCH, DIST, GUARD_BOTTOM, GUARD_TOP, MOUNT_BOTTOM, MOUNT_TOP,
  SAFETY_SUB, SIDE_TOP,
} from "./cardHelpers";

// ---------------- Distanz: MMA-Stand für Grappler ----------------
const distanz: CardDef[] = [
  {
    id: "jab_cross", name: "Jab-Cross (1-2)", de: "Führhand, dann Schlaghand", kind: "angriff", rarity: "selten",
    plain: "Eins-zwei schlagen", plainDo: "Du schlägst zweimal hintereinander – er verliert viel Atem.",
    slots: [DIST], tags: ["strike"], tempo: 3, gas: 2, drainGas: 3,
    desc: "Die Grundkombination: schneller Jab, dann der kräftige Cross mit der hinteren Hand durch die Mitte. Der Jab öffnet die Deckung für den Cross.",
    keys: ["Jab öffnet, Cross trifft", "Cross gerade durch die Mitte", "Kombination statt Einzelschlag"],
    mistakes: ["Nur Einzelschläge – zu leicht zu lesen", "Hände nach dem Schlag unten lassen"],
    safety: "Im Training nur mit Handschuhen, Kopfschutz und leichtem Kontakt.",
    source: SRC.boxCombos,
  },
  {
    id: "feint_shot", name: "Shot Feint", de: "Takedown antäuschen", kind: "setup", rarity: "selten",
    plain: "Abtauchen antäuschen", plainDo: "Du tust so, als willst du die Beine – er reagiert falsch.",
    slots: [DIST], gas: 1, controlGain: 1, opening: { tags: ["strike", "shot", "legs"] },
    desc: "Kurz abtauchen oder vorsteppen, ohne zu schießen. Senkt er die Hände oder weicht zurück, folgt ein Schlag oder der echte Takedown.",
    keys: ["Finte glaubhaft verkaufen", "Kleiner, schneller Dip", "Immer mit Folgeangriff"],
    mistakes: ["Finte ohne Folgeaktion", "Zu langsam abtauchen – kündigt an", "Nur aus der Hüfte bücken"],
    source: SRC.feints,
  },
  {
    id: "slip_parry", name: "Slip & Parry", de: "Ausweichen & Ablenken", kind: "reaktion", rarity: "basis",
    plain: "Kopf weg, Hand ablenken", plainDo: "Stoppt Schläge – er greift ins Leere.",
    slots: [DIST], counters: ["strike"], gas: 0,
    lesson: "Ausweichen und Ablenken (Slip & Parry) stoppt Schläge – aber nicht den Griff an die Beine.",
    desc: "Parry: den Jab mit der offenen Hand kurz zur Seite lenken. Slip: Kopf und Oberkörper knapp neben den Schlag bewegen. Danach sofort kontern.",
    keys: ["Parry kurz und schnell, ohne Kraft", "Slip genau im Moment des Schlags", "Nach jeder Abwehr kontern"],
    mistakes: ["Zu langsam", "Abwehr ohne Konter"],
    source: SRC.jabDefense,
  },
];

// ---------------- Clinch ----------------
const clinch: CardDef[] = [
  {
    id: "cage_press", name: "Wall Press", de: "An die Wand drücken", kind: "setup", rarity: "episch",
    plain: "An die Wand drücken", plainDo: "Du drückst ihn an die Wand – er kann kaum ausweichen.",
    slots: [CLINCH], gas: 2, controlGain: 2, drainGas: 1, opening: { tags: ["shot", "single", "legs", "reap"] },
    desc: "MMA: Kopf unter sein Kinn, Underhook, Hüfte nah – an Käfig oder Wand gepinnt kann er sich kaum bewegen. Daraus folgen Single, Double und Trips.",
    keys: ["Kopf unter sein Kinn", "Kopf und Hüfte kontrollieren", "Underhook zum Pinnen"],
    mistakes: ["Ohne Underhook nur anlehnen", "Ihm die Wand als Stütze zum Aufstehen lassen"],
    safety: "Nur auf Matte mit gepolsterter Wand üben, nie gegen harte Kanten.",
    source: SRC.cage,
  },
  {
    id: "double_unders", name: "Double Underhooks", de: "Beide Arme unten", kind: "setup", rarity: "episch",
    plain: "Beide Arme drunter", plainDo: "Du schiebst beide Arme unter seine Achseln – Würfe sind offen.",
    slots: [CLINCH], gas: 1, controlGain: 2, requiresControl: 1, opening: { tags: ["bodylock", "reap", "hip"] },
    desc: "Nach dem ersten Underhook den zweiten erkämpfen. Laut Evolve die Position, die man im Clinch will: volle Kontrolle über Schultern und Oberkörper.",
    keys: ["Erst ein Underhook, dann pummeln zum zweiten", "Brust an Brust", "Kopf seitlich an seinem Kopf"],
    mistakes: ["Arme nur flach unter den Achseln", "Hüfte weit weg"],
    source: SRC.underhooks,
  },
  {
    id: "wrist_control", name: "Wrist Control", de: "Handgelenk kontrollieren", kind: "reaktion", rarity: "selten",
    plain: "Handgelenk festhalten", plainDo: "Stoppt, dass er die Hände hinter dir schließt.",
    slots: [CLINCH], counters: ["bodylock"], gas: 0,
    lesson: "Handgelenk festhalten (Wrist Control) – ohne geschlossene Hände kein Umklammern. Gegen Beinangriffe hilft es nicht.",
    desc: "Ein Handgelenk des Gegners kontrollieren: Er kann die Hände nicht verschließen und keinen Body Lock zum Takedown nutzen.",
    keys: ["Früh greifen, bevor die Hände zu sind", "Mit Underhook auf der anderen Seite kombinieren"],
    mistakes: ["Zu spät – Hände schon verschlossen", "Flach stehen bleiben, statt zur Seite zu drehen"],
    source: SRC.cageEscape,
  },
];

// ---------------- Guard ----------------
const guard: CardDef[] = [
  {
    id: "butterfly_sweep", name: "Butterfly Sweep", de: "Schmetterlings-Sweep", kind: "angriff", rarity: "episch",
    plain: "Fuß hebt, rüberrollen", plainDo: "Du ziehst ihn ran, hebst mit dem Fuß und rollst nach oben.",
    slots: [GUARD_BOTTOM], tags: ["sweep"], tempo: 3, gas: 2, requiresControl: 1,
    success: { pos: "side", role: "top", points: 2, controlSelf: 1 },
    desc: "Sitzend, Füße als Haken innen an seinen Oberschenkeln. Underhooks, ihn nach vorn ziehen, zur Seite fallen und mit dem Haken anheben – in einem Zug.",
    keys: ["Erst sein Gewicht nach vorn laden", "Fallen und Heben gleichzeitig", "Zur Seite fallen, nicht nach hinten"],
    mistakes: ["Passive Haken", "Gerade nach hinten fallen", "Gegen jemanden, der wegzieht"],
    lesson: "Sobald seine Hand auf der Matte steht (Post), scheitert der Butterfly Sweep – darum vorher die Arme kontrollieren.",
    source: SRC.butterfly,
  },
  {
    id: "knee_shield", name: "Knee Shield", de: "Knie-Schild", kind: "reaktion", rarity: "selten",
    plain: "Knie als Schild", plainDo: "Stoppt, dass er an deinen Beinen vorbeigeht.",
    slots: [GUARD_BOTTOM], counters: ["pass"], gas: 1,
    lesson: "Knie als Schild (Knee Shield) blockt das Vorbeigehen – aber nur, solange deine Frames stehen.",
    desc: "Oberes Knie gegen seine Schulter oder Brust, Fuß hakt seinen Knöchel, Arme als zweite Linie. Er bekommt sein Gewicht nicht auf deinen Oberkörper.",
    keys: ["Auf der Hüfte liegen, nicht flach", "Knie an seine Schulter", "Fällt ein Frame: sofort neu framen"],
    mistakes: ["Flach auf dem Rücken", "Frames einbrechen lassen"],
    source: SRC.kneeShield,
  },
  {
    id: "toreando", name: "Toreando Pass", de: "Torero-Pass", kind: "angriff", rarity: "episch",
    plain: "Beine wegschieben, vorbeilaufen", plainDo: "Du drückst seine Beine zur Seite und läufst seitlich vorbei.",
    slots: [GUARD_TOP], tags: ["pass"], tempo: 2, gas: 2,
    success: { pos: "side", role: "top", points: 3, controlSelf: 1 },
    dilemmaWith: "knee_slice",
    desc: "Im Stand beide Beine greifen, zur einen Seite werfen und gleichzeitig zur anderen herumlaufen. Danach sofort Brust drauf, Crossface, Underhook.",
    keys: ["Werfen und Laufen in einer Bewegung", "Im Bogen laufen, nicht gerade", "Griffe lösen, sobald du vorbei bist"],
    mistakes: ["Zwei getrennte Bewegungen", "Halbe Geschwindigkeit", "Nach dem Pass keine Oberkörperkontrolle"],
    lesson: "Blockt er einen Weg (Knee Slice), öffnet sich ein anderer: Passes in Ketten angreifen.",
    source: SRC.toreando,
  },
];

// ---------------- Side Control ----------------
const side: CardDef[] = [
  {
    id: "knee_on_belly", name: "Knee on Belly", de: "Knie auf den Bauch", kind: "setup", rarity: "selten",
    plain: "Knie auf Bauch", plainDo: "Du stellst dein Knie auf seinen Bauch – Druck und Angriffe.",
    slots: [SIDE_TOP], gas: 1, controlGain: 2, drainGas: 1,
    opening: { tags: ["armlock", "shoulderlock", "advance"] },
    desc: "Aus der Seitenkontrolle das Knie auf Bauch oder unteres Brustbein, anderes Bein weit raus. Eine Übergangsposition: Wehrt er sich, folgen Armbar, Kimura/Americana oder Mount. Im IBJJF gibt sie 2 Punkte, im Spiel zählt sie als Druck (Kontrolle).",
    keys: ["Druck durch das Knie, Gewicht nach vorn", "Fernes Bein weit als Stütze", "Nicht stehen bleiben – angreifen oder weiter"],
    mistakes: ["Zu aufrecht", "Enge Basis", "Knie zu hoch auf den Rippen"],
    safety: "Knie auf Bauch oder unteres Brustbein, nie auf die Rippen. Druck im Training dosieren.",
    source: SRC.kob,
  },
];

// ---------------- Mount ----------------
const mount: CardDef[] = [
  {
    // No-Gi (KB 8.12): ersetzt den Kreuz-Kragenwürger; ID bleibt für gespeicherte Sammlungen.
    id: "cross_collar", name: "Arm Triangle", de: "Kopf-Arm-Würger von oben", kind: "angriff", rarity: "episch",
    plain: "Kopf und Arm einschließen", plainDo: "Dein Arm schließt Kopf und einen Arm ein – er muss abklopfen.",
    slots: [MOUNT_TOP], tags: ["choke"], tempo: 3, gas: 2, requiresControl: 3, submission: true,
    desc: "Drückt er nach oben: seinen Arm über sein Gesicht schieben, Kopf an Kopf, Hände schließen, zur Seite gegenüber dem gefangenen Arm absteigen, Brust vor.",
    keys: ["Sein Arm über sein Gesicht", "Kopf an Kopf, Hände schließen", "Zur anderen Seite absteigen, Brust vor"],
    mistakes: ["Im Mount sitzen bleiben", "Lücke zwischen Kopf und Arm", "Zur falschen Seite absteigen"],
    safety: "Würger: bei Schwindel sofort abklopfen. " + SAFETY_SUB,
    source: SRC.armTriangle,
  },
  {
    // No-Gi (KB 8.12): ersetzt „Kragengriffe abwehren“; ID bleibt für gespeicherte Sammlungen.
    id: "collar_defense", name: "Hand Fighting (Choke Defense)", de: "Hände an den Hals", kind: "reaktion", rarity: "selten",
    plain: "Hände an den Hals", plainDo: "Stoppt Würger an deinem Hals.",
    slots: [MOUNT_BOTTOM], counters: ["choke"], gas: 1,
    lesson: "Hände zuerst (Hand Fighting) – wer den Hals früh schützt, lässt den Würger gar nicht erst zu.",
    desc: "Hände früh an den Hals, Ellbogen eng, Kinn runter. Schiebt er einen Arm unter deinen Kopf: seinen Arm wegdrücken, nicht rüberlassen, dann zur Brücke Richtung Angriffsarm.",
    keys: ["Hände zuerst an den Hals", "Kinn runter, Ellbogen eng", "Danach Brücke Richtung Angriffsarm"],
    mistakes: ["Hals offen lassen", "Aus Stolz nicht abklopfen"],
    source: SRC.mountEsc,
  },
];

// ---------------- Back ----------------
const back: CardDef[] = [
  {
    id: "back_armbar", name: "Armbar (Back)", de: "Armhebel vom Rücken", kind: "angriff", rarity: "episch",
    plain: "Arm strecken von hinten", plainDo: "Verteidigt er den Hals, streckst du seinen Arm – er klopft ab.",
    slots: [BACK_TOP], tags: ["armlock"], tempo: 3, gas: 2, requiresControl: 2, submission: true,
    dilemmaWith: "rnc",
    desc: "Wehrt er den Würger mit beiden Händen ab und streckt dabei die Arme, isolierst du den freien Arm und streckst ihn. Würger und Armbar bilden ein Paar.",
    keys: ["Erst Würger drohen, dann den Arm nehmen", "Brust am Rücken halten", "Hüfte langsam, Daumen hoch"],
    mistakes: ["Position für die Submission aufgeben", "Ruckartig strecken"],
    safety: "Armbar ist die häufigste Submission-Verletzung. " + SAFETY_SUB,
    source: SRC.rnc,
  },
  {
    id: "shrimp_back_escape", name: "Shrimp Back Escape", de: "Rücken-Escape zur Guard", kind: "angriff", rarity: "selten",
    plain: "Schultern runter, wegrutschen", plainDo: "Hände schützen den Hals, Schultern auf die Matte, Hüfte weg.",
    slots: [BACK_BOTTOM], tags: ["escape"], tempo: 3, gas: 2,
    success: { pos: "guard", role: "bottom" },
    desc: "Hals zuerst schützen, Hände hoch in Gebetshaltung im Seatbelt. Schultern zur Seite auf die Matte bringen, Hüfte wegschieben – dann bist du nicht mehr am Rücken und baust die Guard auf.",
    keys: ["Erst Hals, dann Hüfte", "Hände hoch, Kinn eingezogen", "Schultern auf der Matte = Rücken frei"],
    mistakes: ["Shrimpen, bevor der Hals geschützt ist", "Vom Gegner wegdrehen"],
    source: SRC.backMountEsc,
  },
];

export const EXPANSION_CARDS: CardDef[] = [...distanz, ...clinch, ...guard, ...side, ...mount, ...back];

/**
 * Zusätzliche Belohnungen je Archetyp-id (werden an reward angehängt).
 * Lernreihenfolge: Blau = Stand & Clinch (erst Abwehr, dann Angriff), Lila = Guard, Pass, Druck,
 * Braun = Rücken (Escape vor Angriff), Schwarz = Gi-Würger aus dem Mount (Abwehr kam in Lila).
 */
export const EXPANSION_REWARDS: Record<string, string[]> = {
  b_judoka: ["wrist_control", "double_unders"],
  b_striker: ["slip_parry", "jab_cross", "feint_shot"],
  b_boss: ["cage_press"],
  l_guard: ["knee_shield", "butterfly_sweep"],
  l_passer: ["toreando", "knee_on_belly"],
  l_boss: ["collar_defense"],
  br_wrestler: ["shrimp_back_escape"],
  br_backtaker: ["back_armbar"],
  s_system: ["cross_collar"],
};
