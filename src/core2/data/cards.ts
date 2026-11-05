// Kern 2 – Körperkarte: Karteninhalte.
// Spec: docs/superpowers/specs/2026-11-05-kern2-koerperkarte-design.md
// Fakten aus docs/knowledge-base.md und research_notes/Kern 2 Kontrolle und Abschluss/.
// Projektregel: jede Technik-Aussage mit Quelle; ohne Primärbeleg → check: true (Trainer prüfen).
//
// Punkte nach IBJJF (Gymdesk/FloGrappling, Sekundärquellen): Takedown 2, Sweep 2, Pass 3, Mount 4, Back 4.
// Back-Punkte gibt es nur mit beiden Hooks, Füße nicht gekreuzt – im Spiel tragen nur Rückennahmen
// die 4 Punkte, deren Karte die Hooks ausdrücklich mit einschließt (Mount to Back, Back Take aus der Turtle).
// Upa (Umdrehen aus dem Mount) gibt keine Sweep-Punkte (Sweep zählt nur aus der Guard).
// Hip Bump / Scissor Sweep enden im Mount: im Spiel 2 Punkte (Sweep); „Sweep direkt in Mount = 6“ ist ungeprüft.
// Nicht aufgenommen: Cross Collar (nur Gi), alle für Weißgurte verbotenen Techniken.
// No-Gi-Fokus (KB 8.12, docs/research/no-gi-fokus.md): keine Kragen-, Ärmel-, Hosen- oder Gürtelgriffe.
// Griffe sind Handgelenk, Trizeps, Nacken, Underhook/Overhook, Body Lock, Seatbelt. MMA-Hinweise stehen als Schlüssel „MMA: …“.
// Front Headlock (Kopfklammer, B16): eigene Position „headlock“, oben = wer den Kopf kontrolliert.
// Jede Karte trägt einen MMA-Hinweis (mma + mmaNote, B18) und Alltagstitel + No-Gi-Fachbegriff (Glossar TERMS2, B19).
// Keine Beinhebel als spielbare Karte (Heel Hook, Kneebar, Toe Hold, Calf Slicer verboten; Straight Ankle Lock erst später mit Trainer).
import type { Card2, MmaFlag, Pos2, Role2 } from "../types";
import { SRC } from "../../data/sources";

type Src = { title: string; url: string };
const s = (title: string, url: string): Src => ({ title, url });

/** Zusätzliche Quellen aus research_notes/Kern 2 Kontrolle und Abschluss/danaher_kontrolle.md */
const K2 = {
  gff: s("BJJ More – Danaher Pin Escapes: Go Further Faster (Review)", "https://bjjmore.com/john-danaher-pin-escapes-go-further-faster/"),
  pinEsc: s("BJJ More – Danaher Pin & Turtle Escapes", "https://bjjmore.com/john-danaher-pin-escapes-turtle-escapes/"),
  sideDan: s("BJJ Fanatics – Escaping Side Control with John Danaher", "https://bjjfanatics.com/blogs/news/escaping-side-control-with-john-danaher"),
  halfDan: s("BJJ Fanatics – A Better Half Guard with John Danaher", "https://bjjfanatics.com/blogs/news/a-better-half-guard-in-30-minutes-with-john-danaher"),
  backSys: s("BJJ More – Back Attacks: Enter the System (Review)", "https://bjjmore.com/back-attacks-enter-the-system-john-danaher/"),
  grappleRnc: s("Grapplearts – Preventing & Escaping the RNC", "https://www.grapplearts.com/preventing-escaping-the-rnc/"),
  kingzTri: s("Kingz – Triangle Choke Guide", "https://www.kingz.com/blogs/news/triangle-choke-complete-guide-setups-finishes-escapes"),
  guillEsc: s("BJJ More – How to Escape a Guillotine", "https://bjjmore.com/how-to-escape-a-guillotine/"),
  turtleEsc: s("BJJ Atlas – Turtle Escapes", "https://bjj-atlas.pages.dev/turtle/turtle-escapes"),
  turtleGuide: s("Evolve MMA – The Complete Guide to the BJJ Turtle", "https://evolve-mma.com/blog/the-complete-guide-to-the-bjj-turtle-position/"),
  sideIq: s("JitsuIQ – Side Control", "https://jitsuiq.com/positions/side-control/side-control.html"),
  gu32: s("Gracie University – The 32 Principles", "https://gracieuniversity.com/Pages/public/informationpages/The32Principles"),
  halfTop: s("JitsuIQ – Half Guard Top", "https://jitsuiq.com/positions/guard/half-guard-top.html"),
  halfBot: s("JitsuIQ – Half Guard", "https://jitsuiq.com/positions/guard/half-guard.html"),
  armDrags: s("Evolve MMA – 38 Arm Drag Techniques for BJJ", "https://evolve-mma.com/blog/38-arm-drag-techniques-for-bjj/"),
  armTri: s("BJJ Atlas – Arm Triangle", "https://bjj-atlas.pages.dev/submissions/arm-triangle"),
  noGiGrips: s("Evolve MMA – Grip Fighting in No-Gi BJJ", "https://evolve-mma.com/blog/heres-what-you-need-to-know-about-grip-fighting-in-no-gi-bjj/"),
  oldSchool: s("JitsuIQ – Old School Sweep", "https://jitsuiq.com/sweeps/old-school-sweep.html"),
  bodyLockPass: s("BJJ Atlas – Body Lock Pass", "https://bjj-atlas.pages.dev/guard-passing/body-lock-pass"),
  techStand: s("JitsuIQ – Technical Stand-Up", "https://jitsuiq.com/movement-mechanics/technical-stand-up.html"),
  wrestleUp: s("Evolve MMA – Improving Your BJJ With Wrestle-Ups", "https://evolve-mma.com/blog/improving-your-bjj-with-wrestle-ups/"),
  pummel: s("Evolve MMA – What Is Pummeling", "https://evolve-mma.com/blog/what-is-pummeling-and-how-to-do-it-correctly-for-mma-training/"),
  fhlAttacks: s("Evolve MMA – 3 Attacks From The Front Headlock In BJJ", "https://evolve-mma.com/blog/3-ways-to-use-the-front-headlock-in-bjj/"),
  snapDown: s("Evolve MMA – BJJ Takedown 101: The Snap Down", "https://evolve-mma.com/blog/bjj-takedown-101-the-snap-down/"),
  goBehind: s("FanaticWrestling – Snap and Go Behind Drills (Dan Vallimont)", "https://fanaticwrestling.com/blogs/news/master-snap-and-go-behind-drills-with-dan-vallimont"),
  southpaw: s("Evolve MMA – A Guide To The Southpaw Stance In MMA", "https://evolve-mma.com/blog/a-guide-to-the-southpaw-stance-in-mma/"),
  penStep: s("Evolve MMA – Mastering The Penetration Step", "https://evolve-mma.com/blog/mastering-the-penetration-step-for-better-takedowns-in-mma-and-bjj/"),
  turtleScore: s("BJJ Ref Spot – Scoring Primer: Takedowns (Front vs. Dominant Turtle)", "https://bjjrefspot.blogspot.com/2012/09/scoring-primer-takedowns.html"),
  counters: s("Evolve MMA – 5 Ways To Counter Takedowns In No-Gi BJJ", "https://evolve-mma.com/blog/5-ways-to-counter-takedowns-in-no-gi-bjj/"),
  wrMoves: s("FanaticWrestling – Wrestling Moves", "https://fanaticwrestling.com/blogs/news/wrestling-moves"),
  standGuill: s("Grapplearts – Standing Guillotine Choke Escapes", "https://www.grapplearts.com/standing-guillotine-choke-escapes/"),
  singleDef: s("FanaticWrestling – Single Leg Defense with Henry Cejudo", "https://fanaticwrestling.com/blogs/news/single-leg-defense-with-henry-cejudo"),
  fulcrum: s("BJJ Fanatics – Danaher: Overlooked Part of a Submission (Fulcrum)", "https://bjjfanatics.com/blogs/news/john-danaher-says-this-is-one-of-the-most-overlooked-parts-of-a-successful-submission"),
} satisfies Record<string, Src>;

const SAFETY_SUB = "Im Training langsam ansetzen, früh abklopfen, beim Tap sofort loslassen.";
const SAFETY_THROW = "Ukemi (Fallschule) zuerst. Partner kontrolliert ablegen – kein Slam.";
/** B17: jeder Takedown, Wurf und Shot – Partnerübung nur unter Aufsicht. */
const SAFETY_TD = "Nur mit Trainer üben. Partner kontrolliert ablegen – kein Slam.";
const SAFETY_CHOKE = "Schwindel oder Sternchen = sofort abklopfen. " + SAFETY_SUB;

type Slot = { pos: Pos2; role: Role2 };
const at = (pos: Pos2, role: Role2 = "neutral"): Slot => ({ pos, role });
const STAND = at("stand");
const CLINCH = at("clinch");
const GUARD_T = at("guard", "top"), GUARD_B = at("guard", "bottom");
const HALF_T = at("half", "top"), HALF_B = at("half", "bottom");
const TURTLE_T = at("turtle", "top"), TURTLE_B = at("turtle", "bottom");
const SIDE_T = at("side", "top"), SIDE_B = at("side", "bottom");
const MOUNT_T = at("mount", "top"), MOUNT_B = at("mount", "bottom");
const BACK_T = at("back", "top"), BACK_B = at("back", "bottom");
const HL_T = at("headlock", "top"), HL_B = at("headlock", "bottom");

/** Alle 16 Slots (für Tests und UI). */
export const SLOTS2: Slot[] = [
  STAND, CLINCH, HL_T, HL_B, GUARD_T, GUARD_B, HALF_T, HALF_B, TURTLE_T, TURTLE_B,
  SIDE_T, SIDE_B, MOUNT_T, MOUNT_B, BACK_T, BACK_B,
];

// ---------------- Stand ----------------
const stand: Card2[] = [
  {
    // B17: didaktische Auslage-Karte. Gleich vs. gegengleich ohne Primärquelle für Grappling → Trainer prüfen.
    id: "nd_outside_foot", plain: "Auslage, Vorderfuß außen", term: "Stance (Orthodox/Southpaw) & Lead Foot Outside",
    plainDo: "Du wählst deine Auslage und stellst den Vorderfuß außen.",
    kind: "aufbauen", zone: "kopf", slots: [STAND],
    why: "Gegengleiche Auslage (Orthodox gegen Southpaw): wessen Vorderfuß außen steht, hat den besseren Winkel.",
    keys: ["Orthodox: linker Fuß vorn. Southpaw: rechter Fuß vorn",
      "Gegengleich: eure Vorderfüße stehen sich gegenüber – kämpf um außen",
      "Gleiche Auslage (beide Orthodox): Vorderfüße stehen schräg, kein Kampf um außen",
      "Im Grappling tiefer stehen, Hände vorn"],
    mistakes: ["Füße auf einer Linie", "Große, schwerfällige Schritte", "Füße kreuzen beim Seitschritt"],
    source: K2.southpaw, check: true,
  },
  {
    // B17: Level Change und Penetration Step sind eine Karte (Aufbauen vor jedem Beinangriff).
    id: "nd_level_change", plain: "Tief gehen, Schritt rein", term: "Level Change & Penetration Step",
    plainDo: "Aus den Knien tief, dann ein Schritt zwischen seine Füße.",
    kind: "aufbauen", zone: "beine", slots: [STAND],
    why: "Erst die Hüfte senken (Level Change), dann der tiefe Schritt (Penetration Step) – Brust hoch, Rücken gerade.",
    keys: ["Aus den Knien senken, nicht aus der Taille", "Schritt zwischen seine Füße, hinteres Knie fast auf der Matte",
      "Hinteres Bein nachziehen", "Erst solo drillen, hinter einer Finte"],
    mistakes: ["Aus der Taille bücken", "Zu weiter Schritt", "Kopf nach unten (Guillotine)"],
    source: K2.penStep,
  },
  {
    id: "nd_double_leg", plain: "Beide Beine schnappen", term: "Double Leg",
    plainDo: "Du tauchst ab, packst beide Beine und bringst ihn runter.",
    kind: "angriff", zone: "beine", slots: [STAND], requires: { beine: 0 }, kraft: 1,
    to: { pos: "guard", role: "top", points: 2 },
    why: "Nach Level Change und Schritt beide Beine gefasst (Double Leg): er kann nicht auf einem Bein hüpfen.",
    keys: ["Erst tief gehen und Schritt rein (Level Change)", "Kopf hoch, Rücken gerade", "Tiefer Schritt zwischen seine Füße", "Hände in die Kniekehlen"],
    mistakes: ["Aus zu großer Distanz schießen", "Kopf unten – Guillotine-Gefahr"],
    safety: SAFETY_TD,
    source: SRC.doubleLeg,
  },
  {
    id: "nd_single_leg", plain: "Ein Bein schnappen", term: "Single Leg",
    plainDo: "Du packst ein Bein, Kopf außen, und bringst ihn runter.",
    kind: "angriff", zone: "beine", slots: [STAND], requires: { beine: 0, kopf: 0 },
    to: { pos: "half", role: "top", points: 2 },
    why: "Ein Bein gefasst, Kopf außen (Single Leg): du landest oft direkt oben in seiner Half Guard.",
    keys: ["Gegengleiche Auslage: sein Vorderbein steht direkt vor dir", "Erst Inside Position gewinnen", "Kopf außen und eng", "Brust hoch, Nacken gerade"],
    mistakes: ["Kopf innen (Guillotine-Gefahr)", "Hüftknick statt Kniebeuge"],
    safety: SAFETY_TD,
    source: K2.halfTop,
  },
  {
    id: "nd_clinch_entry", plain: "Ranrücken und festhalten", term: "Clinch Entry",
    plainDo: "Du schließt die Distanz und greifst sofort Kopf oder Körper.",
    kind: "angriff", zone: "arme", slots: [STAND], requires: { kopf: 0 },
    to: { pos: "clinch", role: "neutral" },
    why: "Ganz draußen oder ganz drinnen (Clinch): in der Mitteldistanz trifft er dich am leichtesten.",
    keys: ["Kopf bewegen beim Eintritt", "Sofort Kopf- oder Körperkontrolle"],
    mistakes: ["Gerade und mit hohem Kinn hineinlaufen", "In der Mitteldistanz stehen bleiben"],
    source: SRC.guClinch,
  },
  {
    // B16: stoppt der Sprawl einen Shot, hältst du seinen Kopf – Wechsel in den Front Headlock (oben).
    id: "nd_sprawl", plain: "Beine weg, Hüfte drauf", term: "Sprawl",
    plainDo: "Beine zurück, Hüfte drauf – führst du am Kopf, hältst du ihn.",
    // B21: in den Front Headlock nur mit Kopf +1 (Kinngriff gewonnen); sonst stoppt der Sprawl nur. Spielregel → Trainer prüfen.
    kind: "rahmen", zone: "beine", slots: [STAND], onStop: { pos: "headlock", role: "top" }, onStopRequires: { kopf: 1 },
    why: "Beine zurück, Hüfte schwer auf seinen Kopf (Sprawl): der Shot verpufft. Führst du am Kopf, hältst du ihn vorn.",
    keys: ["Früh reagieren", "Hüfte schwer auf Kopf und Schultern", "Kein Ruheplatz: sofort Kopf fassen (Front Headlock)"],
    mistakes: ["Zu spät", "Hochspringen statt zurück", "Liegen bleiben statt Kopf zu fassen"],
    safety: "Auf den Zehen landen, nicht auf den Knien.",
    source: K2.counters, check: true,
  },
  {
    // B17: Hand Fighting und Kopfposition sind eine Karte (Stand und Clinch) – der Rahmen gegen den Snap Down.
    id: "nd_hand_fight", plain: "Hände kämpfen, Kopf hoch", term: "Hand Fighting & Head Position",
    plainDo: "Du löst seinen Nackengriff, Hände vorn, Kopf hoch.",
    kind: "rahmen", zone: "kopf", slots: [STAND, CLINCH],
    why: "Griffe lösen, Kopf hoch (Head Position): der Körper folgt dem Kopf – ohne Kopf kein Runterziehen.",
    keys: ["Am schmalsten Teil des Handgelenks greifen", "Nackengriff früh lösen, wegkreisen", "Kopf hoch, Blick zu ihm, Rücken gerade"],
    mistakes: ["Todesgriff – du ermüdest, er reißt sich los", "Aus der Taille vorgebeugt stehen", "Ihm den ersten Griff schenken"],
    source: K2.standGuill,
  },
];

// ---------------- Clinch ----------------
const clinch: Card2[] = [
  {
    id: "cl_collar_tie", plain: "Nacken greifen", term: "Collar Tie",
    plainDo: "Hand in seinen Nacken, Unterarm an sein Schlüsselbein.",
    kind: "aufbauen", zone: "kopf", slots: [CLINCH],
    why: "Mit der Hand im Nacken (Collar Tie) führst du seinen Kopf und bereitest das Runterziehen vor.",
    keys: ["Ellbogen innen", "Kopf des Gegners führen"],
    mistakes: ["Nur ziehen, ohne eigene Basis"],
    source: SRC.clinches,
  },
  {
    // No-Gi: Pummeling (Underhook zurückholen) steckt in dieser Karte.
    id: "cl_underhook", plain: "Arm unter seine Achsel", term: "Underhook & Pummeling",
    plainDo: "Du schwimmst mit dem Arm innen durch, tief unter seine Achsel.",
    kind: "aufbauen", zone: "arme", slots: [CLINCH],
    why: "Der Underhook ist die beste Clinch-Position; verlierst du ihn, schwimm innen zurück (Pummeling).",
    keys: ["Tief einhaken, Schulter hoch", "Verloren? Arm innen zurückschwimmen", "Stirn an seine Brust, Hüfte beweglich"],
    mistakes: ["Flacher Underhook", "Hüfte weit weg", "Ihn das Tempo bestimmen lassen"],
    source: K2.pummel,
  },
  {
    // B16: Snap Down aus Stand und Clinch führt in die Kopfklammer (Front Headlock) statt direkt in die Turtle.
    id: "cl_snap_down", plain: "Kopf runterziehen", term: "Snap Down",
    plainDo: "Hand im Nacken, Kopf runter – er landet vor dir.",
    kind: "angriff", zone: "kopf", slots: [STAND, CLINCH], requires: { kopf: 1 },
    to: { pos: "headlock", role: "top" },
    why: "Kopf runter, bis er auf die Hände fällt (Snap Down): du landest in der Kopfklammer (Front Headlock).",
    keys: ["Erst Nackengriff (Collar Tie)", "Timing statt Kraft: wenn er nach vorn drückt", "Sofort Kinn fassen (Chin Strap)"],
    mistakes: ["Am Nacken reißen", "Überkommitten"],
    safety: "Nur mit Trainer üben. Nacken nicht reißen, kontrolliert zur Matte führen.",
    source: K2.snapDown,
  },
  {
    // B17: aus dem Stand in den Clinch (2-on-1 ist ein Clinch-Griff), Platz im Stand für den Snap Down.
    id: "nd_arm_drag", plain: "Arm ziehen, dahinter", term: "2-on-1 & Arm Drag",
    plainDo: "Beide Hände an seinem Arm, quer vorbeiziehen, dahinter.",
    kind: "angriff", zone: "arme", slots: [CLINCH], requires: { arme: 1 }, kraft: 1,
    // Spiel-Vereinfachung (B17): der Arm Drag bringt dich hinter ihn, er geht auf die Knie (Turtle oben).
    // B23: hinter ihm, hinter den Armen = „dominante Turtle“, gehalten → Takedown, 2 Punkte (K2.turtleScore).
    // Den Rücken mit Haken nimmst du danach (Back Take, 4 Punkte).
    to: { pos: "turtle", role: "top", points: 2 },
    why: "Zwei Hände gegen einen Arm (2-on-1): am Trizeps quer vorbeiziehen öffnet seinen Rücken.",
    keys: ["Handgelenk, dann Trizeps greifen", "Quer über seinen Körper ziehen, nicht nach unten", "Tief nachsteigen, Arm um seine Hüfte"],
    mistakes: ["Nach unten statt quer ziehen", "Nur am Handgelenk ziehen"],
    safety: SAFETY_TD,
    source: K2.armDrags, check: true,
  },
  {
    id: "cl_body_lock", plain: "Umklammern und umkippen", term: "Body Lock Takedown (Trip)",
    plainDo: "Hände hinter seinem Rücken, Bein dahinter – er kippt um.",
    kind: "angriff", zone: "huefte", slots: [CLINCH], requires: { arme: 1 },
    to: { pos: "half", role: "top", points: 2 },
    why: "Hände hinter seinem Rücken (Body Lock), Bein dahinter: kippen statt heben, Brust drauf in seine Half Guard.",
    keys: ["Hüfte nah, Brust an Brust", "Erst Haltung brechen, dann Winkel", "Trip statt Lift"],
    mistakes: ["Nur Armkraft", "Zu weit vorlehnen (lädt zum Hüftwurf ein)"],
    safety: "Nur mit Trainer üben. Kein Hochheben und Fallenlassen: Slams sind verboten.",
    source: K2.halfTop,
  },
  {
    id: "cl_pull_guard", plain: "Guard ziehen", term: "Pull Guard",
    plainDo: "Du setzt dich mit Griffen hin, Beine um seine Hüfte.",
    kind: "angriff", zone: "beine", slots: [CLINCH], requires: { arme: 0 },
    to: { pos: "guard", role: "bottom" },
    why: "Mit Griffen in die Guard setzen (Pull Guard) bringt dich zu Boden – Punkte gibt es dafür nicht.",
    keys: ["Erst Griffe (Nacken, Arm), dann hinsetzen", "Sofort die Beine schließen"],
    mistakes: ["Ohne Griff hinsetzen – er passiert sofort"],
    safety: "Nur mit Trainer üben. Sitzend ziehen, nicht in die Guard springen.",
    source: SRC.beginnerGuide, check: true,
  },
  {
    // No-Gi: Overhook/Whizzer steckt in dieser Karte (Hüfte zurück gegen Wurf und Body Lock).
    id: "cl_hips_back", plain: "Überhaken, Hüfte zurück", term: "Whizzer (Overhook) & Hips Back",
    plainDo: "Du klemmst seinen Underhook-Arm von oben, Hüfte weit zurück.",
    kind: "rahmen", zone: "huefte", slots: [CLINCH],
    why: "Arm von oben geklemmt (Whizzer), Hüfte weg: ohne Hüftkontakt klappt weder Wurf noch Umklammerung.",
    keys: ["Über seinem Ellbogen einklemmen", "Hüfte zurück, tief bleiben", "Griff an den Fingern lösen"],
    mistakes: ["Brust an Brust stehen bleiben", "Passiv am Arm hängen"],
    safety: "Schulter nicht reißen.",
    source: K2.singleDef,
  },
];

// ---------------- Guard oben ----------------
const guardTop: Card2[] = [
  {
    id: "gt_posture", plain: "Aufrecht sitzen", term: "Posture",
    plainDo: "Rücken gerade, Kopf hoch, Hände auf seiner Hüfte.",
    kind: "aufbauen", zone: "kopf", slots: [GUARD_T],
    why: "Aufrecht sitzen (Posture) hält deinen Kopf weg von Würgern – Haltung kommt vor jedem Pass.",
    keys: ["Haltung zuerst", "Hände auf seine Hüfte, nicht auf die Brust", "Kopf hoch – ein tiefer Kopf lädt zur Guillotine ein"],
    mistakes: ["Nach vorn kippen lassen"],
    source: SRC.stackPass,
  },
  {
    // No-Gi-Standardpass, ersetzt „Halb vorbei“. Spiel-Vereinfachung: endet in der Half Guard (BJJ Atlas: Ziel Side Control).
    id: "gt_body_lock", plain: "Hüfte umklammern, vorbei", term: "Body Lock Pass",
    plainDo: "Hände um seine Hüfte, Brust drauf, Schritt für Schritt vorbei.",
    kind: "angriff", zone: "huefte", slots: [GUARD_T], requires: { huefte: 0 },
    to: { pos: "half", role: "top" },
    why: "Hände hinter seiner Hüfte (Body Lock) drücken sie flach – so kommst du mindestens in seine Half Guard.",
    keys: ["Hände verbinden: Schraubstock, keine Umarmung", "Erst seine Hüfte flach, dann laufen", "Kopf hoch, Schulter an sein Kinn"],
    mistakes: ["Hüfte schwebt über ihm", "Loser Griff", "Ihm den Underhook lassen"],
    source: K2.bodyLockPass, check: true,
  },
  {
    id: "gt_open_guard", plain: "Guard öffnen", term: "Open the Guard",
    plainDo: "Du setzt ein Knie und öffnest seine gekreuzten Beine.",
    kind: "aufbauen", zone: "beine", slots: [GUARD_T],
    why: "Erst die gekreuzten Beine öffnen (Guard öffnen), dann kommst du an ihnen vorbei.",
    keys: ["Haltung halten beim Öffnen", "Ein Knie als Keil in die Mitte"],
    mistakes: ["Haltung aufgeben, um zu öffnen"],
    source: SRC.beginnerGuide, check: true,
  },
  {
    id: "gt_knee_slice", plain: "Knie schneidet durch", term: "Knee Slice",
    plainDo: "Dein Knie gleitet quer über sein Bein, du liegst seitlich.",
    kind: "angriff", zone: "huefte", slots: [GUARD_T], requires: { beine: 1, huefte: 0 },
    to: { pos: "side", role: "top", points: 3 }, dilemmaOpens: "beine",
    why: "Knie quer über seinen Oberschenkel (Knee Slice); blockt er diesen Weg, öffnet sich ein anderer.",
    keys: ["Crossface zuerst", "Knie quer, nicht auf den Oberschenkel", "Underhook gewinnen"],
    mistakes: ["Knie landet auf dem Oberschenkel", "Ohne Oberkörperkontrolle"],
    source: SRC.kneeCut,
  },
  {
    id: "gt_toreando", plain: "Beine wegdrücken, rumlaufen", term: "Toreando",
    plainDo: "Du drückst seine Beine zur Seite und läufst vorbei.",
    kind: "angriff", zone: "beine", slots: [GUARD_T], requires: { beine: 1, huefte: 0 },
    to: { pos: "side", role: "top", points: 3 }, dilemmaOpens: "huefte",
    why: "Beine zur einen Seite, du zur anderen (Toreando); folgt er, wartet der Knieschnitt.",
    keys: ["Knie oder Schienbeine greifen", "Beine zur Matte drücken, schnell rumlaufen"],
    mistakes: ["Stehen bleiben – er baut die Guard neu auf"],
    source: SRC.toreando,
  },
  {
    id: "gt_elbows_in", plain: "Ellbogen eng", term: "Elbows Tight",
    plainDo: "Ellbogen an deinen Körper – kein Arm zum Hebeln.",
    kind: "rahmen", zone: "arme", slots: [GUARD_T],
    why: "Enge Ellbogen (Elbows Tight) geben ihm keinen Arm für Armstreck- oder Schulterhebel.",
    keys: ["Ellbogen an die Rippen", "Hände nicht auf seine Brust"],
    mistakes: ["Arm gestreckt auf der Matte stehen lassen"],
    source: SRC.beginnerGuide,
  },
  {
    // No-Gi: „Kopf hoch gegen die Guillotine“ steckt in dieser Karte (Hals schützen in der Guard).
    id: "gt_both_arms", plain: "Hals schützen", term: "Guillotine & Triangle Defense",
    plainDo: "Kopf hoch, Hüfte gerade, beide Arme drin oder draußen.",
    kind: "rahmen", zone: "kopf", slots: [GUARD_T],
    why: "Kopf hoch stoppt die Guillotine; nur mit einem Arm drin schließt sich das Dreieck (Triangle).",
    keys: ["Greift er den Hals: am Handgelenk drücken, nicht am Ellbogen", "Hüfte gerade zu ihm", "Beide Arme drin oder beide draußen"],
    mistakes: ["Kopf tief beim Passieren", "Am Ellbogen drücken – das zieht den Würger zu", "Ein Arm drin, einer draußen"],
    source: K2.guillEsc,
  },
  {
    id: "gt_base_post", plain: "Breit knien, posten", term: "Base & Post",
    plainDo: "Knie breit, eine Hand auf die Matte – er kippt dich nicht.",
    kind: "rahmen", zone: "huefte", slots: [GUARD_T],
    why: "Breite Basis und eine stützende Hand (Base, Post) stoppen den Sweep – hol die Hand schnell zurück.",
    keys: ["Knie breit", "Hand posten, sofort zurückholen"],
    mistakes: ["Arm gestreckt stehen lassen (Kimura)"],
    source: SRC.hipBump,
  },
];

// ---------------- Guard unten ----------------
// No-Gi (KB 8.12): Kragen/Ärmel fallen weg. Raus: Kimura, Hip Bump (Ärmelgriff), Arm Drag (→ Stand-Karte „Arm ziehen, dahinter“).
// Neu: Butterfly Guard & Sweep, Guillotine, Technical Stand-up/Wrestle-up. Max. 8 Karten je Slot.
const guardBottom: Card2[] = [
  {
    id: "gb_break_posture", plain: "Haltung brechen", term: "Break Posture (Collar Tie & Overhook)",
    plainDo: "Du ziehst ihn mit Beinen und Nackengriff zu dir runter.",
    kind: "aufbauen", zone: "kopf", slots: [GUARD_B],
    why: "Zieh seinen Kopf zu dir runter (Haltung brechen): erst dann erreichst du Hals und Arme.",
    keys: ["Knie zur Brust ziehen", "Hand tief in seinen Nacken (Collar Tie)", "Einen Arm von oben einklemmen (Overhook)"],
    mistakes: ["Flach liegen und warten"],
    source: K2.noGiGrips,
  },
  {
    id: "gb_wrist_control", plain: "Handgelenk fangen", term: "Wrist Control / 2-on-1",
    plainDo: "Du hältst sein Handgelenk fest und ziehst den Arm zu dir.",
    kind: "aufbauen", zone: "arme", slots: [GUARD_B],
    why: "Hältst du sein Handgelenk (Wrist Control), kann er den Arm nicht wegziehen – Basis für den Armhebel.",
    keys: ["Handgelenk, nicht Finger", "Bricht der Griff: zwei Hände an einen Arm (2-on-1)", "Arm über die Mittellinie ziehen"],
    mistakes: ["Griff lösen, bevor die Hüfte dreht", "Todesgriff – du ermüdest"],
    source: K2.noGiGrips,
  },
  {
    id: "gb_hip_frame", plain: "Hüfte raus, Knie dazwischen", term: "Hip Escape & Frame",
    plainDo: "Du rutschst seitlich weg und stellst dein Knie als Schild.",
    kind: "rahmen", zone: "huefte", slots: [GUARD_B],
    why: "Seitlich wegrutschen, Knie als Schild (Hip Escape, Frame): der Knieschnitt prallt ab.",
    keys: ["Knie zwischen euch", "Unterarm an Hals oder Schulter (Frame)", "Andere Hand an seinen Bizeps"],
    mistakes: ["Flach auf dem Rücken bleiben"],
    source: SRC.kneeCut,
  },
  {
    id: "gb_butterfly_sweep", plain: "Füße als Haken, umkippen", term: "Butterfly Guard & Sweep",
    plainDo: "Haken innen an seinen Beinen, zur Seite fallen, Haken hoch.",
    kind: "angriff", zone: "beine", slots: [GUARD_B], requires: { arme: 1, beine: 0 },
    to: { pos: "mount", role: "top", points: 2, escape: "reversal" },
    why: "Sitzend, Füße als Haken (Butterfly): du fällst zur Seite, dein Haken hebt ihn über dich.",
    keys: ["Sitzen, beide Füße innen an seinen Oberschenkeln", "Underhook, ihn nah an dich ziehen", "Fallen und Haken heben gleichzeitig"],
    mistakes: ["Gerade nach hinten fallen", "Haken liegen nur da", "Ohne Gewicht auf deinen Haken"],
    source: SRC.butterfly,
  },
  {
    id: "gb_armbar", plain: "Arm strecken mit Hüfte", term: "Armbar",
    plainDo: "Du streckst seinen Arm über deiner Hüfte – ganz langsam.",
    kind: "angriff", zone: "arme", slots: [GUARD_B], requires: { arme: 1 }, kraft: 1,
    submission: { id: "armbar", name: "Armbar" }, dilemmaOpens: "kopf",
    why: "Deine Hüfte als Drehpunkt (Armbar); zieht er den Arm gebeugt heraus, ist das Dreieck offen.",
    keys: ["Handgelenk kontrollieren", "Knie zusammen", "Daumen zeigt nach oben"],
    mistakes: ["Daumen nach unten", "Knie offen", "Ruckartig strecken"],
    safety: "Häufigste Submission-Verletzung (22,4 %). " + SAFETY_SUB,
    source: SRC.combos,
  },
  {
    id: "gb_triangle", plain: "Beine-Dreieck um Hals", term: "Triangle",
    plainDo: "Deine Beine schließen seinen Hals und einen Arm ein.",
    kind: "angriff", zone: "kopf", slots: [GUARD_B], requires: { kopf: 1 }, kraft: 1,
    submission: { id: "triangle", name: "Triangle" }, dilemmaOpens: "arme",
    why: "Ein Arm drin, einer draußen (Triangle); stemmt er sich hoch, wird sein Arm frei für die Armbar.",
    keys: ["Ein Arm drin, einer draußen", "45°-Winkel", "Kopf runterziehen"],
    mistakes: ["Frontaler Winkel", "Mit den Knöcheln drücken"],
    safety: SAFETY_CHOKE,
    source: SRC.combos,
  },
  {
    id: "gb_guillotine", plain: "Hals vorne umfassen", term: "Guillotine (Guard)",
    plainDo: "Senkt er den Kopf, umfasst dein Arm seinen Hals – langsam.",
    kind: "angriff", zone: "kopf", slots: [GUARD_B], requires: { kopf: 1 }, kraft: 1,
    submission: { id: "guillotine", name: "Guillotine" },
    why: "Fang den Kopf, sobald er sinkt (Guillotine): Ellbogenbeuge am Hals, Hüfte vor.",
    keys: ["Sofort zugreifen, wenn der Kopf sinkt", "Ellbogenbeuge am Hals, nicht das Handgelenk", "Hochziehen und Hüfte vor zugleich"],
    mistakes: ["Zu flach greifen", "Nur nach oben ziehen", "Zögern"],
    safety: SAFETY_CHOKE,
    source: SRC.guillotine,
  },
  {
    id: "gb_wrestle_up", plain: "Aufsitzen und aufstehen", term: "Technical Stand-up / Wrestle-up",
    plainDo: "Hand hinten stützen, Hüfte hoch, Bein durchziehen – du stehst.",
    kind: "angriff", zone: "huefte", slots: [GUARD_B], requires: { arme: 1, huefte: 0 }, kraft: 1,
    to: { pos: "stand", role: "neutral", escape: "neutral" },
    why: "Aufstehen statt unten bleiben (Wrestle-up): im MMA wirst du unten geschlagen, im Stand kannst du ringen.",
    keys: ["Erst seinen Arm kontrollieren (Handgelenk, 2-on-1)", "Eine Hand stützt hinten, die andere schützt vorn", "Bein weit nach hinten durchziehen"],
    mistakes: ["Hastig ohne Basis aufstehen", "Kopf vorn – er greift den Hals"],
    source: K2.wrestleUp,
  },
];

// ---------------- Half Guard oben ----------------
const halfTop: Card2[] = [
  {
    id: "ht_crossface", plain: "Kopf wegdrehen", term: "Crossface",
    plainDo: "Deine Schulter dreht sein Gesicht von dir weg.",
    kind: "aufbauen", zone: "kopf", slots: [HALF_T], alsoGain: { arme: 1 },
    why: "Wer Kopf und Schultern kontrolliert (Crossface), macht die Half Guard zur besten Passier-Position.",
    keys: ["Schulter unter sein Kinn", "Druck über die Schulter, nicht ins Gesicht greifen"],
    mistakes: ["Kopf frei lassen und am Bein ziehen"],
    source: K2.halfDan,
  },
  {
    id: "ht_underhook", plain: "Fernen Arm einhaken", term: "Underhook (oben)",
    plainDo: "Dein Arm geht unter seinen fernen Arm.",
    kind: "aufbauen", zone: "arme", slots: [HALF_T],
    why: "Hast du den Underhook (Unterhaken), fehlt er ihm – wer ihn hat, bestimmt die Half Guard.",
    keys: ["Tief unter der Achsel", "Brust auf seine Brust"],
    mistakes: ["Ihm den Underhook schenken"],
    source: K2.halfDan,
  },
  {
    id: "ht_flatten", plain: "Ihn flach drücken", term: "Hip Wedge",
    plainDo: "Deine Hüfte drückt ihn flach auf den Rücken.",
    kind: "aufbauen", zone: "huefte", slots: [HALF_T],
    why: "Liegt er flach (Keil an der Hüfte), fehlen ihm Seite und Winkel für Knie-Schild und Sweep.",
    keys: ["Hüfte tief", "Ihn auf den Rücken drehen"],
    mistakes: ["Auf den Knien hoch bleiben"],
    source: K2.halfDan,
  },
  {
    id: "ht_pass", plain: "Bein befreien, vorbei", term: "Half Guard Pass",
    plainDo: "Du ziehst dein Bein aus seinen und liegst seitlich.",
    kind: "angriff", zone: "beine", slots: [HALF_T], requires: { kopf: 1, huefte: 0 },
    to: { pos: "side", role: "top", points: 3 },
    why: "Erst Kopf und Schultern sichern, dann das Bein befreien (Pass) – sonst holt er die Guard zurück.",
    keys: ["Crossface bleibt drin", "Knie über seinen Oberschenkel befreien"],
    mistakes: ["Bein ziehen ohne Oberkörperkontrolle"],
    source: K2.halfDan,
  },
  {
    // B12: zweiter Pass aus der Half Guard (Underhook statt Crossface) – die Half Guard ist kein Wartezimmer.
    id: "ht_knee_slide", plain: "Knie durchschieben", term: "Knee Slide Pass",
    plainDo: "Dein Knie pinnt seinen Oberschenkel und schneidet durch.",
    kind: "angriff", zone: "huefte", slots: [HALF_T], requires: { arme: 1, huefte: 0 },
    to: { pos: "side", role: "top", points: 3 },
    why: "Mit Underhook pinnt dein Knie sein oberes Bein und schneidet durch (Knee Slide) – Oberkörper bleibt kontrolliert.",
    keys: ["Underhook oder Crossface halten", "Knie flach über seinen Oberschenkel"],
    mistakes: ["Ohne Oberkörperkontrolle durchschneiden"],
    source: K2.halfTop,
  },
  {
    id: "ht_whizzer", plain: "Arm überhaken", term: "Whizzer",
    plainDo: "Du klemmst seinen Underhook-Arm von oben ein.",
    kind: "rahmen", zone: "arme", slots: [HALF_T],
    why: "Über seinen Arm einhaken (Whizzer, Überhaken) bremst seinen Underhook, bevor er hochkommt.",
    keys: ["Über dem Ellbogen einhaken", "Hüfte rein, Kopfdruck"],
    mistakes: ["Passiv hängen"],
    safety: "Schulter nicht reißen.",
    source: SRC.whizzer, check: true,
  },
  {
    id: "ht_knee_block", plain: "Knie blockieren", term: "Knee Block",
    plainDo: "Dein Knie blockt seine Hüfte – keine volle Guard.",
    kind: "rahmen", zone: "huefte", slots: [HALF_T],
    why: "Blockst du seine Hüfte (Keil), schiebt er sein Knie nicht zurück zwischen euch.",
    keys: ["Knie an seine Hüfte", "Hüfte schwer"],
    mistakes: ["Abstand lassen"],
    source: K2.pinEsc, check: true,
  },
  {
    id: "ht_base", plain: "Breit bleiben", term: "Base",
    plainDo: "Breite Basis, Hand posten – sein Sweep verpufft.",
    kind: "rahmen", zone: "beine", slots: [HALF_T],
    why: "Breite Basis (Base) mit gestützter Hand: wer stabil steht, wird nicht gekippt.",
    keys: ["Freies Bein weit", "Hand posten, schnell zurückholen"],
    mistakes: ["Beide Knie eng nebeneinander"],
    source: SRC.hipBump, check: true,
  },
];

// ---------------- Half Guard unten ----------------
const halfBottom: Card2[] = [
  {
    id: "hb_face_free", plain: "Kopf freihalten", term: "Crossface Defense",
    plainDo: "Du hältst seine Crossface-Hand weg von deinem Gesicht.",
    kind: "aufbauen", zone: "kopf", slots: [HALF_B],
    why: "Seine Crossface-Hand wegzuhalten ist laut Danaher entscheidend: dein Kopf bleibt frei.",
    keys: ["Hand an seinen Bizeps", "Kopf zu ihm drehen"],
    mistakes: ["Flach liegen, Gesicht weggedreht"],
    source: K2.halfDan,
  },
  {
    id: "hb_underhook", plain: "Arm unter seine Achsel", term: "Underhook (unten)",
    plainDo: "Du schiebst deinen Arm tief unter seine Achsel.",
    kind: "aufbauen", zone: "arme", slots: [HALF_B],
    why: "Mit deinem Underhook (Unterhaken) drückt er dich kaum flach – du kommst auf die Seite.",
    keys: ["Tief einhaken", "Auf die Seite drehen"],
    mistakes: ["Flacher Underhook"],
    source: K2.halfDan,
  },
  {
    id: "hb_knee_shield", plain: "Knie als Schild", term: "Knee Shield",
    plainDo: "Dein Knie hält ihn auf Abstand – er kommt nicht vorbei.",
    kind: "rahmen", zone: "beine", slots: [HALF_B],
    why: "Das Knie an seiner Schulter oder Hüfte (Knee Shield) hält Kopf und Schultern unerreichbar.",
    keys: ["Knie an Schulter oder Brust", "Fuß hakt seinen Knöchel", "Hände als zweite Linie"],
    mistakes: ["Knie flach auf dem Bauch"],
    source: SRC.kneeShield,
  },
  {
    id: "hb_come_up", plain: "Unterhaken, hochkommen", term: "Underhook & Come Up",
    plainDo: "Mit dem Underhook kommst du auf die Knie und hoch.",
    kind: "angriff", zone: "arme", slots: [HALF_B], requires: { arme: 1 },
    to: { pos: "stand", role: "neutral", escape: "neutral" },
    why: "Mit dem Underhook (Unterhaken) kommst du auf die Seite und hoch – der Pin ist gelöst.",
    keys: ["Kopf hoch", "Auf die Knie, dann hoch"],
    mistakes: ["Kopf vorn (Guillotine)"],
    source: K2.halfDan, check: true,
  },
  {
    id: "hb_recover", plain: "Knie rein, volle Guard", term: "Guard Recovery",
    plainDo: "Du schiebst dein Knie dazwischen und schließt die Beine.",
    kind: "angriff", zone: "huefte", slots: [HALF_B], requires: { huefte: 0, beine: 0 },
    to: { pos: "guard", role: "bottom", escape: "guard" },
    why: "Knie zwischen euch (Guard Recovery): aus der Half Guard wird wieder deine volle Guard.",
    keys: ["Erst Hüfte weg", "Knie durch die Lücke"],
    mistakes: ["Knie ohne Platz durchdrücken"],
    source: K2.gff,
  },
  {
    id: "hb_back_take", plain: "Hinter ihn rutschen", term: "Knee Shield Back Take",
    plainDo: "Aus dem Knie-Schild schlüpfst du unter seinen Arm hinter ihn.",
    kind: "angriff", zone: "arme", slots: [HALF_B], requires: { arme: 1, beine: 0 },
    to: { pos: "back", role: "top", escape: "reversal" },
    why: "Knie-Schild hält ihn fern, du ziehst seinen Arm am Trizeps vorbei (Arm Drag) und rutschst hinter ihn.",
    keys: ["Erst Knie-Schild", "Trizeps über die Mitte ziehen (Arm Drag)", "Seatbelt vor den Hooks"],
    mistakes: ["Ohne Armkontrolle rutschen"],
    source: SRC.kneeShield, check: true,
  },
  {
    // No-Gi: ersetzt den Scissor Sweep (Kragen-Ärmel-Griff). Knöchel statt Hosenbein.
    id: "hb_old_school", plain: "Knöchel greifen, umkippen", term: "Old School Sweep",
    plainDo: "Tiefer Underhook, du greifst seinen Knöchel und kippst ihn um.",
    kind: "angriff", zone: "beine", slots: [HALF_B], requires: { arme: 1, huefte: 0 },
    to: { pos: "side", role: "top", points: 2, escape: "reversal" },
    why: "Underhook und sein Knöchel in deiner Hand (Old School Sweep): ihm fehlt das Bein zum Abstützen.",
    keys: ["Tiefer Underhook, Kopf an seiner Brust", "Knöchel des gefangenen Beins greifen", "Hüfte unter ihn, dann nach vorn drücken"],
    mistakes: ["Flacher Underhook – er setzt den Crossface", "Flach auf dem Rücken bleiben", "Knöchel loslassen"],
    source: K2.oldSchool,
  },
];

// ---------------- Side Control oben ----------------
const sideTop: Card2[] = [
  {
    id: "sct_crossface", plain: "Nacken-Keil setzen", term: "Crossface",
    plainDo: "Dein Unterarm dreht seinen Kopf von dir weg.",
    kind: "aufbauen", zone: "kopf", slots: [SIDE_T],
    why: "Ein Keil am Nacken (Crossface) hält ihn – laut Danaher pinnt man mit Keilen, nicht mit Gewicht.",
    keys: ["Naher Arm unter seinen Kopf", "Schulter an sein Kinn"],
    mistakes: ["Nur mit Gewicht liegen"],
    source: K2.pinEsc,
  },
  {
    // B11: nahe und ferne Hüfte sind eine Karte (Platz für den Kopf-Arm-Würger; max. 8 Karten je Slot).
    id: "sct_far_hip", plain: "Beide Hüften keilen", term: "Hip Wedges",
    plainDo: "Knie an seine nahe, Hand an seine ferne Hüfte.",
    kind: "aufbauen", zone: "huefte", slots: [SIDE_T],
    why: "Fernes und nahes Hüftbein plus Nacken gekeilt (Wedges): so hältst du ihn fast ohne Gewicht.",
    keys: ["Drei Keile: ferne Hüfte, nahe Hüfte, Nacken", "Kein Abstand an der nahen Hüfte"],
    mistakes: ["Gewicht statt Keile", "Hüfte frei lassen"],
    source: K2.gff,
  },
  {
    id: "sct_underhook", plain: "Fernen Arm einhaken", term: "Far-Side Underhook",
    plainDo: "Dein ferner Arm geht unter seinen fernen Arm.",
    kind: "aufbauen", zone: "arme", slots: [SIDE_T],
    why: "Crossface mit dem nahen, Underhook mit dem fernen Arm: die Grundkontrolle der Seitkontrolle.",
    keys: ["Gewicht über seiner Brust", "Arm tief unter seiner Schulter"],
    mistakes: ["Beide Arme auf einer Seite"],
    source: K2.sideIq,
  },
  {
    id: "sct_to_mount", plain: "Aufsteigen, draufsetzen", term: "Side to Mount",
    plainDo: "Dein Knie gleitet über seinen Bauch, du sitzt auf ihm.",
    // B14: Hüfte +1 statt +2 (JitsuIQ: Hüfte blocken, Knie über den Bauch; Evolve MMA: „Blocking the hip is essential“).
    // Dilemma → Arme: rahmt er gegen das Aufsteigen, pinnst du die rahmende Hand (Evolve MMA, BJJ 101: The Americana).
    kind: "angriff", zone: "huefte", slots: [SIDE_T], requires: { huefte: 1 },
    to: { pos: "mount", role: "top", points: 4 }, dilemmaOpens: "arme",
    why: "Hüfte geblockt, dann Knie über den Bauch (Mount, 4 Punkte); stemmt er dagegen, liegt sein Arm frei.",
    keys: ["Knie flach über den Bauch", "Kopf und Arm kontrolliert lassen"],
    mistakes: ["Springen und Basis verlieren"],
    source: K2.sideIq,
  },
  {
    id: "sct_kimura", plain: "Arm nach hinten drehen", term: "Kimura (Side)",
    plainDo: "Du drehst seinen fernen Arm hinter seinen Rücken – langsam.",
    // B11: erst wenn seine Hüfte ganz gekeilt ist (Hüfte +2), sonst dreht er sich ein – Wahl: Mount oder Kimura.
    kind: "angriff", zone: "arme", slots: [SIDE_T], requires: { arme: 1, huefte: 2 }, kraft: 1,
    // B11: Dilemma-Paar mit dem Kopf-Arm-Würger – hält er den Arm fest am Körper, wird der Hals frei.
    submission: { id: "kimura", name: "Kimura" }, dilemmaOpens: "kopf",
    why: "Aus der Seitkontrolle einen Arm isolieren (Kimura): erst kontrollieren, dann langsam drehen.",
    keys: ["Figure-Four-Griff", "Sein Ellbogen bleibt an deinem Körper", "Rotation Richtung Rücken"],
    mistakes: ["Ellbogen driftet weg", "Brustkontakt verlieren"],
    safety: "12,6 % der Submission-Verletzungen. " + SAFETY_SUB,
    source: SRC.kimura,
  },
  {
    // B11: zweiter Abschluss aus der Seitkontrolle (No-Gi), wirkt am Kopf statt an den Armen.
    id: "sct_arm_triangle", plain: "Kopf und Arm einschließen", term: "Arm Triangle (Kata Gatame)",
    plainDo: "Sein Arm liegt an seinem Hals, deine Schulter drückt dagegen.",
    // No-Gi: auch aus dem Mount (BJJ Atlas: Frame am Hals → Kopf auf die andere Seite, zur Armseite abrollen).
    kind: "angriff", zone: "kopf", slots: [SIDE_T, MOUNT_T], requires: { kopf: 1, arme: 1 }, kraft: 1,
    submission: { id: "arm_triangle", name: "Kopf-Arm-Würger" }, dilemmaOpens: "arme",
    why: "Sein eigener Arm und deine Schulter schließen den Hals ein (Kopf-Arm-Würger); zieht er den Arm raus, bleibt die Kimura.",
    keys: ["Erst seinen Arm über seinen Hals schieben", "Hände verbinden, Schulter an sein Ohr", "Aus dem Mount zur Seite seines Arms abrollen", "Quer zu ihm laufen, langsam zudrücken"],
    mistakes: ["Gerade auf ihm bleiben", "Nur mit den Armen quetschen"],
    safety: SAFETY_CHOKE,
    source: K2.armTri,
  },
  {
    // B11: Americana auch aus der Seitkontrolle – braucht dort zusätzlich den Kopf (Crossface), sonst dreht er weg.
    id: "sct_americana", plain: "Handgelenk auf die Matte", term: "Americana (Side)",
    plainDo: "Stützt er gegen deinen Hals, pinnst du sein Handgelenk und drehst.",
    kind: "angriff", zone: "arme", slots: [SIDE_T], requires: { kopf: 1, arme: 1 }, kraft: 1,
    submission: { id: "americana", name: "Americana" }, dilemmaOpens: "kopf",
    why: "Crossface hält ihn, sein gebeugter Arm wird auf die Matte gepinnt (Americana) – erst isolieren, dann langsam drehen.",
    keys: ["Arm 90° gebeugt", "Handgelenk bleibt auf der Matte", "Brustkontakt halten"],
    mistakes: ["Arm jagen und die Hüfte freigeben", "Mit der Kimura-Richtung verwechseln"],
    safety: "Langsam, ohne Ruck. " + SAFETY_SUB,
    source: SRC.americana, check: true,
  },
  {
    id: "sct_hip_block", plain: "Hüfte zumachen", term: "Hip Block",
    plainDo: "Du folgst seiner Hüfte und blockst das Wegrutschen.",
    kind: "rahmen", zone: "huefte", slots: [SIDE_T],
    why: "Folgst du seiner Hüfte (Hip Block), bekommt er sein Knie nicht zwischen euch.",
    keys: ["Mit der Hüfte folgen", "Knie an seine Hüfte"],
    mistakes: ["Oben bleiben, während er wegrutscht"],
    source: SRC.sideEsc,
  },
];

// ---------------- Side Control unten (+ geteilte Karte) ----------------
const elbowKnee: Card2 = {
  id: "bot_elbow_knee", plain: "Ellbogen an Knie", term: "Elbow-Knee Connection",
  plainDo: "Ellbogen und Knie bilden eine Wand an seiner Hüfte.",
  kind: "aufbauen", zone: "huefte", slots: [SIDE_B, HALF_B],
  // B11: „Ellbogen nach innen“ (Inside Position) steckt jetzt in dieser Karte (Slot-Platz für die Kopf-Arm-Abwehr).
  why: "Ellbogen und Knie verbunden (Elbow-Knee) tragen sein Gewicht; trennen sie sich, kommt er Brust auf Brust.",
  keys: ["Knie in seine Hüfttasche", "Ellbogen innen, nah am Knie"],
  mistakes: ["Ellbogen weit vom Körper"],
  source: K2.gff,
};

const sideBottom: Card2[] = [
  {
    id: "scb_frame", plain: "Unterarm als Stütze", term: "Frame",
    plainDo: "Dein Unterarm stützt gegen seinen Hals, Ellbogen nah.",
    kind: "aufbauen", zone: "kopf", slots: [SIDE_B],
    why: "Kurze Stützen mit 90° im Ellbogen (Frames) tragen sein Gewicht; gestreckte Arme sind angreifbar.",
    keys: ["Ellbogen etwa 90°", "Nah am Körper"],
    mistakes: ["Arme ausstrecken (Armbar)", "Drücken ohne Struktur"],
    source: K2.gff,
  },

  {
    id: "scb_shrimp", plain: "Wegrutschen, Beine davor", term: "Shrimp to Guard",
    plainDo: "Stütze, Brücke, seitlich weg – Knie rein, Guard zurück.",
    kind: "angriff", zone: "huefte", slots: [SIDE_B], requires: { huefte: 0 },
    to: { pos: "guard", role: "bottom", escape: "guard" },
    why: "Erst Stütze, dann Brücke, dann wegrutschen (Shrimp) – in dieser Reihenfolge kommst du zur Guard.",
    keys: ["Frame, Bridge, Shrimp", "Mehrere kleine Shrimps", "Knie in die Lücke"],
    mistakes: ["Nur Armkraft", "Am Gesicht drücken"],
    source: SRC.sideEsc,
  },
  {
    id: "scb_underhook", plain: "Arm drunter, aufstehen", term: "Underhook to Knees",
    plainDo: "Tiefer Underhook, auf die Knie und hoch.",
    kind: "angriff", zone: "arme", slots: [SIDE_B], requires: { arme: 0 },
    to: { pos: "turtle", role: "bottom" },
    why: "Ein tiefer Underhook bringt dich auf die Knie (Turtle) – Nacken schützen, sonst droht die Guillotine.",
    keys: ["Underhook muss tief sein", "Kopf hoch beim Aufkommen"],
    mistakes: ["Flacher Underhook", "Kopf vorn"],
    source: SRC.sideEsc,
  },
  {
    id: "scb_knee_in", plain: "Knie rein, halbe Guard", term: "Recover Half Guard",
    plainDo: "Ellbogen und Knie schieben, ein Bein klemmt seins ein.",
    kind: "angriff", zone: "beine", slots: [SIDE_B], requires: { huefte: 0, arme: 0 },
    to: { pos: "half", role: "bottom", escape: "guard" },
    why: "Aus der Seitkontrolle in die Half Guard ist schon ein Erfolg (Recover Half Guard).",
    keys: ["Ellbogen innen, Knie hinterher", "Sein Bein zwischen deinen klemmen"],
    mistakes: ["Flach liegen bleiben"],
    source: SRC.sideEsc,
  },
  {
    id: "scb_v_frame", plain: "Knie davor", term: "V-Frame",
    plainDo: "Knie und Ellbogen blocken sein Knie über deinem Bauch.",
    kind: "rahmen", zone: "huefte", slots: [SIDE_B],
    why: "Ellbogen-Knie-Rahmen an der Hüfte (V-Frame) blockt seinen Aufstieg in den Mount.",
    keys: ["Knie hoch an seine Hüfte", "Ellbogen ans Knie"],
    mistakes: ["Bein flach liegen lassen"],
    source: K2.sideDan,
  },
  {
    // B11: Verteidigung gegen den Kopf-Arm-Würger (ersetzt „Ellbogen nach innen“, das jetzt in „Ellbogen an Knie“ steckt).
    id: "scb_head_arm_def", plain: "Arm nicht rüberlassen", term: "Arm-Triangle Defense",
    plainDo: "Dein Arm bleibt vor deinem Gesicht – nicht über deinem Hals.",
    kind: "rahmen", zone: "kopf", slots: [SIDE_B],
    why: "Kommt dein Arm nicht über dein Gesicht, fehlt ihm die Hälfte des Kopf-Arm-Würgers.",
    keys: ["Ellbogen innen", "Zu ihm drehen, Hand an dein Ohr"],
    mistakes: ["Arm über seinen Kopf strecken", "Flach weggedreht liegen"],
    source: K2.armTri,
    check: true,
  },
  {
    id: "scb_protect_arms", plain: "Arme eng halten", term: "Protect Arms",
    plainDo: "Ellbogen eng, Hände an Hals und Brust – kein Arm frei.",
    kind: "rahmen", zone: "arme", slots: [SIDE_B],
    why: "Ellbogen eng am Körper (Arme schützen) gibt ihm keinen Arm zum Isolieren.",
    keys: ["Ellbogen an die Rippen", "Hände an deinem Hals oder deiner Brust", "Ellbogen zum Knie"],
    mistakes: ["Arm über seinen Rücken strecken"],
    source: SRC.americana, check: true,
  },
];

// ---------------- Mount oben ----------------
const mountTop: Card2[] = [
  {
    id: "mt_heavy_hips", plain: "Hüfte schwer, Knie eng", term: "Heavy Hips",
    plainDo: "Deine Hüfte sinkt schwer auf ihn, Knie eng an ihm.",
    kind: "aufbauen", zone: "huefte", slots: [MOUNT_T],
    why: "Hüfte tief und Knie eng (Heavy Hips) nehmen ihm Brücke und Platz für sein Knie.",
    // „Kopf kontrollieren“ (Head Control) steckt jetzt hier – Platz für den Kopf-Arm-Würger im Mount.
    keys: ["Hüfte tief", "Knie an seine Seiten", "Brust schwer, ein Arm unter seinen Kopf"],
    mistakes: ["Hoch auf den Knien sitzen", "Aufrecht sitzen ohne Kontrolle"],
    source: SRC.beginnerGuide,
  },
  {
    id: "mt_isolate", plain: "Arm isolieren", term: "Arm Isolation",
    plainDo: "Du pinnst sein Handgelenk neben seinem Kopf auf die Matte.",
    kind: "aufbauen", zone: "arme", slots: [MOUNT_T],
    why: "Erst festhalten, dann einen Arm isolieren (Isolation) – so führt Kontrolle zur Aufgabe.",
    keys: ["Ellbogen vom Körper lösen", "Handgelenk neben seinem Kopf auf die Matte"],
    mistakes: ["Basis aufgeben, um den Arm zu jagen"],
    source: SRC.americana,
  },
  {
    id: "mt_armbar", plain: "Arm strecken von oben", term: "Armbar (Mount)",
    plainDo: "Du schwingst übers Gesicht und streckst seinen Arm – langsam.",
    kind: "angriff", zone: "arme", slots: [MOUNT_T], requires: { arme: 1, huefte: 1 }, kraft: 1,
    submission: { id: "armbar", name: "Armbar" },
    why: "Deine Hüfte als harter, hoher Drehpunkt (Armbar): Knie zusammen, Daumen nach oben, langsam strecken.",
    keys: ["Handgelenk kontrollieren", "Knie zusammen", "Daumen hoch, Hüfte langsam"],
    mistakes: ["Ohne Kontrolle springen", "Daumen nach unten"],
    safety: "Häufigste Submission-Verletzung. " + SAFETY_SUB,
    source: K2.fulcrum,
  },
  {
    id: "mt_americana", plain: "Arm nach unten drehen", term: "Americana",
    plainDo: "Sein gebeugter Arm wandert Richtung seiner Hüfte – langsam.",
    kind: "angriff", zone: "arme", slots: [MOUNT_T], requires: { arme: 1 }, kraft: 1,
    submission: { id: "americana", name: "Americana" }, dilemmaOpens: "arme",
    why: "Arm 90° gebeugt, Handgelenk auf der Matte (Americana); streckt er den Arm, droht die Armbar.",
    keys: ["Arm 90° gebeugt", "Handgelenk bleibt auf der Matte", "Richtung Hüfte"],
    mistakes: ["Mit der Kimura-Richtung verwechseln"],
    safety: "Langsam, ohne Ruck. " + SAFETY_SUB,
    source: SRC.americana, check: true,
  },
  {
    id: "mt_to_back", plain: "Mitdrehen, auf Rücken", term: "Mount to Back",
    plainDo: "Dreht er weg, folgst du mit Gurtgriff und beiden Haken.",
    kind: "angriff", zone: "huefte", slots: [MOUNT_T], requires: { huefte: 1, arme: 1 },
    to: { pos: "back", role: "top", points: 4 },
    why: "Dreht er sich weg (Mount to Back), folgst du mit Gurtgriff (Seatbelt) und beiden Haken.",
    keys: ["Seatbelt zuerst", "Beide Hooks rein, Füße nicht kreuzen"],
    mistakes: ["Beim Wechsel herunterrutschen"],
    source: SRC.guCombatives,
  },
  {
    id: "mt_knee_pinch", plain: "Knie zusammen", term: "Knee Pinch",
    plainDo: "Deine Knie klemmen – sein Knie kommt nicht rein.",
    kind: "rahmen", zone: "beine", slots: [MOUNT_T],
    why: "Enge Knie (Knee Pinch) lassen keinen Platz für sein Knie – sein Ellbogen-Escape stockt.",
    keys: ["Knie an seine Hüfte", "Füße unter seine Beine"],
    mistakes: ["Knie weit offen"],
    source: SRC.mountEsc, check: true,
  },
  {
    id: "mt_post", plain: "Breit posten", term: "Post & Wide Base",
    plainDo: "Hand und Knie breit – seine Brücke kippt dich nicht.",
    kind: "rahmen", zone: "huefte", slots: [MOUNT_T],
    why: "Breite Basis mit gestützter Hand (Post) gibt seiner Brücke keine Rollrichtung.",
    keys: ["Hand auf der gefangenen Seite posten", "Knie breit"],
    mistakes: ["Arm und Fuß derselben Seite fangen lassen"],
    source: SRC.mountEsc, check: true,
  },
];

// ---------------- Mount unten ----------------
const mountBottom: Card2[] = [
  {
    id: "mb_knee_inside", plain: "Knie nach innen", term: "Elbow-Knee (Mount)",
    plainDo: "Dein Knie kommt innen an seinen Knöchel, Ellbogen dazu.",
    kind: "aufbauen", zone: "beine", slots: [MOUNT_B],
    why: "Unter dem Mount gehört dein Knie innen an seinen Knöchel (Elbow-Knee) – das ist dein Fluchtpunkt.",
    keys: ["Knie innen am Knöchel", "Ellbogen ans Knie"],
    mistakes: ["Beine flach auf der Matte"],
    source: K2.gff,
  },
  {
    id: "mb_bridge", plain: "Brücke, Platz schaffen", term: "Bridge",
    plainDo: "Du hebst die Hüfte kurz und schaffst Platz.",
    kind: "aufbauen", zone: "huefte", slots: [MOUNT_B],
    why: "Erst Schaden begrenzen, dann Platz mit Brücke und Shrimp (Bridge) – so beginnt jede Flucht.",
    keys: ["Füße nah am Po", "Kurz und explosiv"],
    mistakes: ["Lange in der Brücke bleiben"],
    source: K2.gff,
  },
  {
    id: "mb_trap", plain: "Arm und Fuß fangen", term: "Trap Arm & Foot",
    plainDo: "Du klemmst seinen Arm und hakst den Fuß derselben Seite.",
    kind: "aufbauen", zone: "arme", slots: [MOUNT_B],
    why: "Arm und Fuß derselben Seite gefangen (Trap): zu dieser Seite kann er sich nicht abstützen.",
    keys: ["Arm an deine Brust", "Fuß derselben Seite haken"],
    mistakes: ["Arm und Bein auf verschiedenen Seiten"],
    source: SRC.upaErrors,
  },
  {
    id: "mb_upa", plain: "Brücke und rollen", term: "Upa",
    plainDo: "Hüfte hoch, schräg zur gefangenen Seite – du rollst nach oben.",
    kind: "angriff", zone: "huefte", slots: [MOUNT_B], requires: { arme: 0 }, kraft: 1,
    to: { pos: "guard", role: "top", escape: "reversal" }, dilemmaOpens: "beine",
    why: "Gefangene Seite, volle Brücke, dann rollen (Upa); stützt er sich breit ab, öffnet sich der Knie-Escape.",
    keys: ["45° zur gefangenen Seite", "Hüfte voll strecken, dann rollen"],
    mistakes: ["Panik-Brücke ohne Fangen", "Zu früh, bevor er eine Hand am Boden hat"],
    source: SRC.mountEsc, check: true,
  },
  {
    id: "mb_elbow_escape", plain: "Wegrutschen, Knie dazwischen", term: "Elbow Escape",
    plainDo: "Seitlich rutschen, Knie rein – du hast die Guard zurück.",
    kind: "angriff", zone: "beine", slots: [MOUNT_B], requires: { beine: 0, huefte: -1 },
    to: { pos: "half", role: "bottom", escape: "guard" },
    why: "Ellbogen und Knie zusammen (Elbow Escape), dann Knie dazwischen – erst Half Guard, dann volle Guard.",
    keys: ["Mehrere kleine Shrimps", "Ellbogen zum Knie", "Knie als Schild"],
    mistakes: ["Gestreckte Arme (Armbar)", "Abdrehen (Rücken)"],
    source: SRC.mountEsc,
  },
  {
    id: "mb_elbows_tight", plain: "Ellbogen eng", term: "Elbows Tight",
    plainDo: "Ellbogen eng, keine gestreckten Arme – kein Hebel.",
    kind: "rahmen", zone: "arme", slots: [MOUNT_B],
    why: "Gestreckte Arme unter dem Mount laden zur Armbar ein (Elbows Tight): kurz und eng bleiben.",
    keys: ["Ellbogen an die Rippen", "Hände nah am Hals"],
    mistakes: ["Ihn mit gestreckten Armen wegdrücken"],
    source: SRC.mountEsc,
  },
  {
    id: "mb_no_back", plain: "Rücken nicht zeigen", term: "Protect the Back",
    plainDo: "Beim Wegdrehen bleibt dein zweiter Ellbogen vor seinem Bauch.",
    kind: "rahmen", zone: "huefte", slots: [MOUNT_B],
    why: "Dein zweiter Ellbogen bleibt vor seinem Bauchnabel (Rücken schützen) – sonst steigt er an deinen Rücken.",
    keys: ["Nie ganz wegdrehen", "Ellbogen bleiben vorn"],
    mistakes: ["Auf den Bauch drehen"],
    source: K2.gff,
  },
];

// ---------------- Back oben ----------------
const backTop: Card2[] = [
  {
    id: "bt_seatbelt", plain: "Von hinten festschnallen", term: "Seatbelt",
    plainDo: "Ein Arm über, einer unter seiner Schulter, Hände verbunden.",
    kind: "aufbauen", zone: "arme", slots: [BACK_T],
    why: "Kontrolle vor Aufgabe (Seatbelt): Gurtgriff und Ellbogenkontrolle halten ihn an deiner Brust.",
    keys: ["Brust an seinen Rücken", "Kopf neben seinen Kopf"],
    mistakes: ["Hände offen lassen"],
    source: K2.backSys,
  },
  {
    id: "bt_hooks", plain: "Füße einhaken", term: "Hooks",
    plainDo: "Deine Fersen haken innen an seinen Oberschenkeln – nie kreuzen.",
    kind: "aufbauen", zone: "beine", slots: [BACK_T],
    why: "Beide Haken drin, Füße nicht gekreuzt (Hooks): erst das zählt nach IBJJF als Rückenkontrolle.",
    keys: ["Seatbelt vor den Hooks", "Füße nie kreuzen"],
    mistakes: ["Gekreuzte Füße (keine Punkte, Fußhebel-Gefahr)"],
    source: SRC.points,
  },
  {
    id: "bt_clear_hands", plain: "Hals frei machen", term: "Clear the Hands",
    plainDo: "Du ziehst seine Hände von deinem Würgearm weg.",
    kind: "aufbauen", zone: "kopf", slots: [BACK_T],
    why: "Hände früh verbinden, seine Griffe lösen (Clear the Hands): erst dann kommt der Unterarm an den Hals.",
    keys: ["Eigene Hände früh verbinden", "Seinen Griff einzeln lösen"],
    mistakes: ["Mit dem Würgearm an seinen Händen vorbeidrücken"],
    source: K2.grappleRnc,
  },
  {
    id: "bt_rnc", plain: "Würger von hinten", term: "Rear Naked Choke",
    plainDo: "Dein Unterarm umschließt seinen Hals – langsam zudrücken.",
    kind: "angriff", zone: "kopf", slots: [BACK_T], requires: { arme: 1 }, kraft: 1,
    submission: { id: "rnc", name: "Rear Naked Choke" }, dilemmaOpens: "arme",
    why: "Unterarm unter das Kinn (Rear Naked Choke); wehrt er mit beiden Händen ab, wird ein Arm frei.",
    keys: ["Unterarmklinge, nicht Ellbogenspitze", "Hand zum Bizeps", "Ellbogen zusammen"],
    mistakes: ["Ellbogenspitze am Hals", "Nur mit den Armen drücken"],
    safety: SAFETY_CHOKE,
    source: SRC.rnc,
  },
  {
    id: "bt_armbar", plain: "Arm strecken vom Rücken", term: "Back Armbar",
    plainDo: "Streckt er die Arme zur Abwehr, streckst du einen.",
    kind: "angriff", zone: "arme", slots: [BACK_T], requires: { arme: 1 }, kraft: 1,
    submission: { id: "back_armbar", name: "Armbar (Back)" }, dilemmaOpens: "kopf",
    why: "Zwei Hände gegen den Würger strecken seine Arme (Back Armbar) – zieht er sie ein, ist der Hals frei.",
    keys: ["Handgelenk isolieren", "Knie zusammen", "Langsam strecken"],
    mistakes: ["Rückenkontrolle aufgeben, bevor der Arm isoliert ist"],
    safety: SAFETY_SUB,
    source: SRC.backControl,
  },
  {
    id: "bt_hook_retention", plain: "Haken drin lassen", term: "Hook Retention",
    plainDo: "Löst er einen Haken, hakst du sofort neu ein.",
    kind: "rahmen", zone: "beine", slots: [BACK_T],
    why: "Löst er einen Haken, hakst du sofort neu ein (Hook Retention) – sonst rutscht er raus.",
    keys: ["Beine folgen seinen Beinen"],
    mistakes: ["Beine strecken"],
    source: SRC.backEsc, check: true,
  },
  {
    id: "bt_follow", plain: "Hüfte folgen", term: "Follow the Hips",
    plainDo: "Rutscht er nach unten weg, folgt deine Hüfte mit.",
    kind: "rahmen", zone: "huefte", slots: [BACK_T],
    why: "Er will die Schultern auf die Matte bringen – folgst du der Hüfte, bleibt er gefangen.",
    keys: ["Brust an seinem Rücken lassen"],
    mistakes: ["Oben sitzen bleiben, während er runterrutscht"],
    source: SRC.backMountEsc, check: true,
  },
];

// ---------------- Back unten ----------------
const backBottom: Card2[] = [
  {
    id: "bb_hand_fight", plain: "Hände gegen Hände", term: "Hand Fighting",
    plainDo: "Beide Hände an seine Würgehand, runter und weg.",
    kind: "aufbauen", zone: "arme", slots: [BACK_B],
    why: "Zwei Hände gegen eine (Hand Fighting): verbindet er die Hände nicht, kann er nicht würgen.",
    keys: ["Zwei Hände gegen eine", "Kontinuierlich, nicht einmalig"],
    mistakes: ["Nur an einem Finger ziehen"],
    source: K2.grappleRnc,
  },
  {
    id: "bb_hook_off", plain: "Unteren Haken lösen", term: "Bottom Hook Off",
    plainDo: "Du drückst seinen unteren Haken von deinem Bein.",
    kind: "aufbauen", zone: "beine", slots: [BACK_B],
    why: "Erst die Hände, dann den unteren Haken lösen (Hook Off) – der obere kommt danach.",
    keys: ["Unteren Hook zuerst", "Fuß wegschieben"],
    mistakes: ["Oberen Hook zuerst"],
    source: SRC.backEsc,
  },
  {
    id: "bb_shoulders", plain: "Schultern auf die Matte", term: "Shoulders Down",
    plainDo: "Du rutschst runter, bis deine Schultern die Matte berühren.",
    kind: "aufbauen", zone: "huefte", slots: [BACK_B],
    why: "Schultern auf die Matte, Hüfte weg (Shoulders Down) – damit beginnt die Flucht zur Guard.",
    keys: ["Hände bleiben am Hals", "Zur Seite seines unteren Hooks rutschen"],
    mistakes: ["Kinn hochnehmen"],
    source: SRC.backMountEsc,
  },
  {
    id: "bb_shrimp", plain: "Rausrutschen zur Guard", term: "Shrimp Back Escape",
    plainDo: "Hände hoch, Hüfte weg, du drehst dich vor ihn.",
    // B10: die Hüfte trägt den Shrimp – die Hände dürfen noch kämpfen (Arme −1 reicht).
    kind: "angriff", zone: "huefte", slots: [BACK_B], requires: { arme: -1, huefte: 0 },
    to: { pos: "guard", role: "bottom", escape: "guard" },
    why: "Hände schützen den Hals, die Hüfte rutscht weg (Shrimp Escape) – du landest vor ihm.",
    keys: ["Hände in Gebetshaltung am Hals", "Schultern auf die Matte"],
    mistakes: ["Kinn hoch"],
    source: SRC.backMountEsc,
  },
  {
    id: "bb_escape_side", plain: "Rausdrehen zur Seite", term: "Back Escape",
    plainDo: "Über seinen oberen Haken steigen, zu ihm drehen.",
    kind: "angriff", zone: "beine", slots: [BACK_B], requires: { beine: 0 },
    to: { pos: "side", role: "bottom" },
    why: "Seitkontrolle unten ist schon ein Erfolg (Back Escape) – besser als den Rücken abzugeben.",
    keys: ["Hände zuerst", "Side Control akzeptieren"],
    mistakes: ["Oberen Hook zuerst", "Kinn hoch"],
    source: SRC.backEsc,
  },
  {
    id: "bb_chin_tuck", plain: "Kinn auf die Brust", term: "Chin Tuck",
    plainDo: "Kinn runter – sein Unterarm findet den Hals nicht.",
    kind: "rahmen", zone: "kopf", slots: [BACK_B],
    why: "Kinn auf der Brust (Chin Tuck) versperrt seinem Unterarm den Weg zum Hals.",
    keys: ["Kinn runter", "Flach atmen"],
    mistakes: ["Kopf zurücklehnen"],
    source: K2.grappleRnc,
  },
  {
    id: "bb_elbows_tight", plain: "Arme eng halten", term: "Elbows Tight",
    plainDo: "Ellbogen eng – kein gestreckter Arm für den Hebel.",
    kind: "rahmen", zone: "arme", slots: [BACK_B],
    why: "Bleiben deine Ellbogen eng (Elbows Tight), findet er keinen gestreckten Arm für den Hebel.",
    keys: ["Hände am Hals, Ellbogen unten"],
    mistakes: ["Arme strecken, um ihn wegzudrücken"],
    source: SRC.backControl,
  },
];

// ---------------- Turtle oben ----------------
const turtleTop: Card2[] = [
  {
    // B16: geteilt mit dem Front Headlock oben (Kinngriff = Chin Strap).
    id: "tt_front_headlock", plain: "Kopf vorne halten", term: "Front Headlock & Chin Strap",
    plainDo: "Hand am Kinn, Schulter auf seinem Nacken.",
    kind: "aufbauen", zone: "kopf", slots: [TURTLE_T, HL_T],
    why: "Hand am Kinn, Schulter am Nacken (Chin Strap): vom Kopf aus gehst du zum Würger oder hinter ihn.",
    keys: ["Schulter auf seinem Nacken", "Hand greift sein Kinn", "Ellbogen eng an seinem Kopf"],
    mistakes: ["Kopf loslassen, bevor du hinten bist"],
    source: K2.fhlAttacks,
  },
  {
    id: "tt_seatbelt", plain: "Oberkörper umklammern", term: "Seatbelt (Turtle)",
    plainDo: "Ein Arm über, einer unter, Brust an seinem Rücken.",
    kind: "aufbauen", zone: "arme", slots: [TURTLE_T],
    why: "Mit Gurtgriff (Seatbelt) kontrollierst du seinen Oberkörper – geduldig, dann angreifen.",
    keys: ["Brust an seinen Rücken", "Hände verbunden"],
    mistakes: ["Hektisch nach den Hooks suchen"],
    source: K2.turtleGuide,
  },
  {
    id: "tt_hip_pressure", plain: "Gewicht auf den Rücken", term: "Sprawl Pressure",
    plainDo: "Deine Hüfte drückt schwer auf seine Schultern.",
    kind: "aufbauen", zone: "huefte", slots: [TURTLE_T, HL_T],
    why: "Deine Hüfte schwer auf seinen Schultern (Sprawl-Druck) hält ihn unten.",
    keys: ["Hüfte tief", "Auf den Zehen"],
    mistakes: ["Knie auf der Matte, Gewicht weg"],
    source: SRC.jiqSprawl,
  },
  {
    id: "tt_back_take", plain: "Hinter ihn, Haken rein", term: "Back Take",
    plainDo: "Du gehst hinter ihn, Gurtgriff fest, beide Haken rein.",
    // B27: zusätzlich Hüfte +1 – erst Gewicht auf seinen Rücken (hält ihn unten, kein Raussitzen), dann Haken. Spielregel → Trainer prüfen.
    kind: "angriff", zone: "beine", slots: [TURTLE_T], requires: { kopf: 0, arme: 1, huefte: 1 },
    to: { pos: "back", role: "top", points: 4 }, dilemmaOpens: "kopf",
    why: "Schützt er den Hals, öffnet sich sein Rücken (Back Take) – Gurtgriff vor den Haken.",
    keys: ["Ellbogen wegziehen", "Seatbelt vor den Hooks", "Füße nicht kreuzen"],
    mistakes: ["Kopf loslassen, bevor du hinten bist", "Haken rein ohne Gewicht – er sitzt raus"],
    source: SRC.fhl, check: true,
  },
  {
    // B16: Eingang aus der Turtle in den Front Headlock – dort wartet die Guillotine.
    id: "tt_to_headlock", plain: "Nach vorn, Kopf fassen", term: "Spin to Front Headlock",
    plainDo: "Du gehst vor seinen Kopf und klemmst ihn ein.",
    kind: "angriff", zone: "kopf", slots: [TURTLE_T], requires: { kopf: 1 },
    to: { pos: "headlock", role: "top" },
    why: "Hält er seinen Rücken dicht, geh nach vorn an den Kopf (Front Headlock) – dort wartet die Guillotine.",
    keys: ["Brustkontakt halten beim Rumgehen", "Kinn fassen, sobald du vorn bist"],
    mistakes: ["Abstand lassen – er steht auf"],
    source: K2.turtleGuide, check: true,
  },
  {
    id: "tt_sprawl_hold", plain: "Sprawl halten", term: "Sprawl Hold",
    plainDo: "Beine zurück, Hüfte schwer – er kommt nicht hoch.",
    kind: "rahmen", zone: "beine", slots: [TURTLE_T, HL_T],
    why: "Hüfte schwer, Beine zurück (Sprawl): unter dir kann er nicht aufstehen.",
    keys: ["Beine weit zurück", "Hüfte bleibt auf ihm"],
    mistakes: ["Auf die Knie fallen"],
    source: SRC.jiqSprawl,
  },
  {
    id: "tt_follow", plain: "Seiner Hüfte folgen", term: "Follow the Hips",
    plainDo: "Dreht er sich raus, bleibst du an seiner Hüfte.",
    kind: "rahmen", zone: "huefte", slots: [TURTLE_T, HL_T],
    why: "Bleibst du an seiner Hüfte (Mitgehen), wird sein Aussitzen nur ein Platzwechsel.",
    keys: ["Brustkontakt halten"],
    mistakes: ["Zurückweichen, wenn er sich bewegt"],
    source: K2.turtleGuide, check: true,
  },
];

// ---------------- Turtle unten ----------------
const turtleBottom: Card2[] = [
  {
    id: "tb_hands", plain: "Hände frei machen", term: "Seatbelt Defense",
    plainDo: "Du löst seine Hände, bevor er den Gurtgriff schließt.",
    kind: "aufbauen", zone: "arme", slots: [TURTLE_B],
    why: "Den Gurtgriff zu stoppen kommt vor allem anderen (Seatbelt-Abwehr).",
    keys: ["Hände früh lösen", "In ihn drehen, nicht weg"],
    mistakes: ["Abwarten"],
    source: K2.turtleEsc,
  },
  {
    id: "tb_base", plain: "Hüfte unter dich", term: "Base Up",
    plainDo: "Hüfte unter den Körper, Füße bereit zum Aufstehen.",
    kind: "aufbauen", zone: "huefte", slots: [TURTLE_B, HL_B],
    why: "Starte die Flucht in etwa zwei Sekunden (Base) – wer wartet, gibt den Rücken ab.",
    keys: ["Füße aufstellen", "Kopf hoch"],
    mistakes: ["Flach auf dem Bauch liegen"],
    source: K2.turtleEsc,
  },
  {
    id: "tb_stand_up", plain: "Einfach aufstehen", term: "Stand Up",
    plainDo: "Hände frei, ein Fuß nach dem anderen – du stehst.",
    kind: "angriff", zone: "beine", slots: [TURTLE_B], requires: { arme: 0 },
    to: { pos: "stand", role: "neutral", escape: "neutral" },
    why: "Aufstehen ist laut BJJ Atlas immer am besten (Stand Up) – mit freiem Kopf.",
    keys: ["Hände frei machen", "Kopf hoch beim Aufstehen"],
    mistakes: ["Mit gefangenem Kopf aufstehen (Guillotine)"],
    source: K2.turtleEsc,
  },
  {
    id: "tb_sit_out", plain: "Raussitzen und drehen", term: "Sit-out",
    plainDo: "Hand stützen, Bein durchkicken, zu ihm drehen.",
    kind: "angriff", zone: "huefte", slots: [TURTLE_B], requires: { huefte: 0 },
    to: { pos: "stand", role: "neutral", escape: "neutral" },
    why: "Bein unter dir durchkicken und zu ihm drehen (Sit-out) – dein Rücken ist wieder weg von ihm.",
    keys: ["Gleichseitige Hand stützt", "Hüfte drehen, Gesicht zu ihm", "Rücken nie zeigen: am Ende schaust du ihn an", "Über die Schulter rollen (Granby) nur mit Trainer"],
    mistakes: ["Halb drehen und hängen bleiben"],
    source: K2.turtleEsc,
  },
  {
    id: "tb_guillotine_def", plain: "Kopf rausziehen", term: "Guillotine Defense",
    plainDo: "Am Handgelenk drücken, Kopf auf die andere Seite.",
    kind: "rahmen", zone: "kopf", slots: [TURTLE_B, HL_B],
    why: "Drück am Handgelenk, nicht am Ellbogen (Guillotine-Abwehr), und schieb den Kopf zur anderen Seite.",
    keys: ["Am Handgelenk drücken", "Hüfte gerade halten"],
    mistakes: ["Am Ellbogen ziehen"],
    source: K2.guillEsc,
  },
  {
    id: "tb_shell", plain: "Ellbogen an die Knie", term: "Turtle Shell",
    plainDo: "Ellbogen an die Knie – kein Platz für seine Haken.",
    kind: "rahmen", zone: "beine", slots: [TURTLE_B],
    why: "Ein enger Panzer (Turtle) lässt keine Gliedmaße frei – seine Haken finden keine Lücke.",
    keys: ["Ellbogen an die Knie", "Eng bleiben"],
    mistakes: ["Hände weit auf der Matte"],
    source: K2.turtleGuide, check: true,
  },
  {
    // B16/B20: geteilt mit dem Front Headlock unten – ein tiefer Kopf lädt zu Guillotine und Kopfklammer ein.
    id: "tb_head_up", plain: "Kopf hoch, Blick vor", term: "Head Up",
    plainDo: "Nacken zurück, Blick nach vorn – dein Hals bleibt frei.",
    kind: "aufbauen", zone: "kopf", slots: [TURTLE_B, HL_B],
    why: "Ein tiefer Kopf lädt zu Guillotine und Kopfklammer ein (Head Up): Blick hoch, der Körper folgt.",
    keys: ["Nacken zurück, Gesicht nach vorn", "Hüfte unter die Schultern"],
    mistakes: ["Stirn auf der Matte", "Kinn auf der Brust beim Aufstehen"],
    source: K2.standGuill,
  },
];

// ---------------- Front Headlock oben (B16) ----------------
// Geteilt: tt_front_headlock (Chin Strap), tt_hip_pressure, tt_sprawl_hold, tt_follow.
const headlockTop: Card2[] = [
  {
    id: "hl_elbow_pull", plain: "Ellbogen wegziehen", term: "Elbow Pull (Front Headlock)",
    plainDo: "Freie Hand zieht seinen Ellbogen weg von seinem Knie.",
    kind: "aufbauen", zone: "arme", slots: [HL_T],
    why: "Ellbogen weg vom Knie: die Lücke öffnet den Weg hinter ihn (Go-Behind).",
    keys: ["Am Ellbogen greifen, nicht am Handgelenk", "Nach vorn und weg vom Körper ziehen"],
    mistakes: ["Kopf dabei loslassen"],
    source: K2.fhlAttacks,
  },
  {
    id: "hl_guillotine", plain: "Würger von vorne", term: "Guillotine (Front Headlock)",
    plainDo: "Handgelenk unters Kinn, Ellbogen eng, Hüfte vor – langsam.",
    kind: "angriff", zone: "kopf", slots: [HL_T], requires: { kopf: 1, arme: 0 }, kraft: 1,
    submission: { id: "guillotine", name: "Guillotine" }, dilemmaOpens: "arme",
    why: "Aus der Kopfklammer der häufigste Würger (Guillotine); schützt er den Hals, öffnet sich sein Rücken.",
    keys: ["Eigenes Handgelenk unter seinem Kinn greifen", "Beide Ellbogen eng", "Würgen, nicht kurbeln"],
    mistakes: ["Zu flach greifen", "Nur nach oben ziehen (Nacken!)"],
    safety: SAFETY_CHOKE,
    source: K2.fhlAttacks,
  },
  {
    id: "hl_go_behind", plain: "Rumgehen, dahinter", term: "Go-Behind",
    plainDo: "Ellbogen weg, um ihn herum, Brust an seinen Rücken.",
    kind: "angriff", zone: "arme", slots: [HL_T], requires: { arme: 1 },
    // B23: aus der vorderen Turtle (neutral) hinter ihn = dominante Turtle → 2 Punkte (K2.turtleScore).
    to: { pos: "turtle", role: "top", points: 2 },
    why: "Ziehst du ihn vor und blockst seine Achsel, kommst du hinter ihn (Go-Behind) – er kann nicht mitdrehen.",
    keys: ["Erst ziehen, dann rumgehen", "Arm blockt seine Achsel", "Knie in die Lücke"],
    mistakes: ["Kopf zu früh loslassen", "Weit außen rumlaufen"],
    source: K2.goBehind,
  },
  {
    id: "hl_head_block", plain: "Brust auf den Kopf", term: "Head Pressure",
    plainDo: "Deine Brust drückt seinen Kopf runter – er zieht nicht raus.",
    kind: "rahmen", zone: "kopf", slots: [HL_T],
    why: "Bleibt deine Brust schwer auf seinem Kopf (Kopfdruck), kommt sein Kopf nicht hoch und raus.",
    keys: ["Schulter auf seinem Nacken", "Knie weg von der Matte, Gewicht auf ihn"],
    mistakes: ["Auf den Knien hoch sitzen"],
    source: K2.fhlAttacks,
  },
];

// ---------------- Front Headlock unten (B16) ----------------
// Geteilt: tb_head_up, tb_base, tb_guillotine_def.
const headlockBottom: Card2[] = [
  {
    id: "hlb_hands", plain: "Würgehand kontrollieren", term: "2-on-1 Wrist Control",
    plainDo: "Beide Hände an sein Handgelenk am Kinn.",
    kind: "aufbauen", zone: "arme", slots: [HL_B],
    why: "Zwei Hände an seiner Würgehand (2-on-1): ohne Griff am Kinn wird aus der Kopfklammer kein Würger.",
    keys: ["Am Handgelenk ziehen, nicht am Ellbogen", "Hand vom Kinn wegziehen"],
    mistakes: ["Am Ellbogen drücken – das zieht den Würger zu"],
    source: K2.guillEsc,
  },
  {
    id: "hlb_head_out", plain: "Kopf raus, aufrichten", term: "Head Out (Pop the Head)",
    plainDo: "Hände am Handgelenk, Kopf zur Seite raus, aufrichten.",
    kind: "angriff", zone: "kopf", slots: [HL_B], requires: { kopf: 0 },
    to: { pos: "stand", role: "neutral", escape: "neutral" },
    why: "Löst du die Würgehand, zieht der Kopf zur Seite raus (Head Out) – dann stehst du wieder.",
    keys: ["Erst die Hand, dann der Kopf", "Kopf zur Seite seines freien Arms", "Danach sofort Abstand oder Griff"],
    mistakes: ["Kopf gerade nach hinten reißen", "Ohne Handkontrolle ziehen"],
    source: K2.standGuill, check: true,
  },
  {
    id: "hlb_stand_up", plain: "Hände halten, aufstehen", term: "Stand-Up (Wrestle-up)",
    plainDo: "Seine Hände kontrollieren, Füße unter dich, aufstehen.",
    kind: "angriff", zone: "huefte", slots: [HL_B], requires: { huefte: 0, arme: 0 },
    to: { pos: "stand", role: "neutral", escape: "neutral" },
    why: "Aufstehen, während du seine Hände hältst (Stand-Up): im No-Gi und MMA ist der Stand sicherer als unten.",
    keys: ["Erst Hände kontrollieren", "Ein Fuß nach dem anderen", "Kopf hoch beim Aufstehen"],
    mistakes: ["Mit gefangenem Kopf aufstehen"],
    source: K2.wrMoves,
  },
  {
    id: "hlb_shot_through", plain: "Durchschießen an die Beine", term: "Shot Through (Re-Shot)",
    plainDo: "Kopf frei, du schießt unter ihm an seine Beine.",
    kind: "angriff", zone: "beine", slots: [HL_B], requires: { kopf: 0 }, kraft: 1, // B22: nur Kopf frei (vorher auch Beine 0)
    to: { pos: "half", role: "top", escape: "reversal" },
    why: "Hängt er schwer über dir, schieß durch an seine Beine (Re-Shot) – er fällt auf den Rücken.",
    keys: ["Erst Kopf frei, dann schießen", "Hüfte unter dich, dann vor"],
    mistakes: ["Mit gefangenem Kopf schießen (Guillotine)"],
    safety: SAFETY_TD,
    check: true,
  },
  {
    id: "hlb_elbow_in", plain: "Mitdrehen, Gesicht zu ihm", term: "Block the Go-Behind",
    plainDo: "Ellbogen am Knie, du drehst mit – er kommt nicht dahinter.",
    kind: "rahmen", zone: "arme", slots: [HL_B],
    why: "Rücken nie zeigen: Ellbogen am Knie und mitdrehen (Go-Behind blocken) – Gesicht bleibt zu ihm.",
    keys: ["Ellbogen und Knie zusammen", "In seine Richtung drehen"],
    mistakes: ["Ellbogen weit weg vom Knie", "Wegdrehen – er ist sofort hinten"],
    source: K2.goBehind, check: true,
  },
];


// ---------------- MMA-Hinweise (B18) ----------------
// Einstufung je Karte: ok = auch mit Schlägen sinnvoll, riskant = mit Vorsicht, nein = im MMA vermeiden.
// Grundlage: KB 8.12 (No-Gi/MMA), Evolve MMA (Wrestle-ups, Takedown-Konter). Einstufung didaktisch, Trainer prüfen.
const MMA: Record<string, [MmaFlag, string]> = {
  nd_outside_foot: ["ok", "Außen stehen gibt dir im MMA den Winkel für Schläge."],
  nd_level_change: ["ok", "Hinter einer Finte tief gehen, sonst kommt das Knie."],
  nd_double_leg: ["ok", "Klassischer MMA-Takedown: Kopf eng an seinem Körper."],
  nd_single_leg: ["ok", "Im MMA oft am Käfig fertig gemacht."],
  nd_clinch_entry: ["ok", "Kopf bewegen beim Reingehen, sonst kommt der Schlag."],
  nd_sprawl: ["ok", "Pflicht im MMA: wer nicht sprawlt, liegt unten."],
  nd_hand_fight: ["ok", "Hände vorn, Kopf hoch: schützt vor Schlägen und Guillotine."],
  cl_collar_tie: ["ok", "Der Nackengriff steuert den Kopf – im MMA auch für Knie."],
  cl_underhook: ["ok", "Der Underhook-Kampf entscheidet den Clinch am Käfig."],
  cl_snap_down: ["ok", "Stark gegen Shots; danach drohen Guillotine und Knie."],
  nd_arm_drag: ["ok", "2-on-1 bindet seinen Schlagarm."],
  cl_body_lock: ["ok", "Body Lock hält dich nah – wenig Platz für Schläge."],
  cl_pull_guard: ["nein", "Unten wirst du geschlagen: im MMA keine Guard ziehen."],
  cl_hips_back: ["ok", "Whizzer und Hüfte zurück stoppen Takedowns am Käfig."],
  gt_posture: ["ok", "Aufrecht sitzen gibt dir Platz für Schläge."],
  gt_body_lock: ["ok", "Enger Druck lässt ihm wenig Raum für Ellbogen."],
  gt_open_guard: ["riskant", "Beim Öffnen auf Tritte und Ellbogen von unten achten."],
  gt_knee_slice: ["ok", "Mit Crossface auch im MMA sicher."],
  gt_toreando: ["riskant", "Im Stehen passieren: auf Tritte von unten achten."],
  gt_elbows_in: ["ok", "Enge Ellbogen schützen vor Hebeln und Treffern."],
  gt_both_arms: ["ok", "Guillotine und Triangle sind im MMA häufig."],
  gt_base_post: ["ok", "Breite Basis hält dich oben, wo du schlagen kannst."],
  gb_break_posture: ["ok", "Runterziehen nimmt seinen Schlägen die Wucht."],
  gb_wrist_control: ["ok", "Wer die Handgelenke hält, wird weniger getroffen."],
  gb_hip_frame: ["ok", "Rahmen und Hüfte raus schaffen Platz zum Aufstehen."],
  gb_butterfly_sweep: ["riskant", "Sitzend gut; flach auf dem Rücken kassierst du Schläge."],
  gb_armbar: ["ok", "Klappt im MMA, wenn seine Haltung gebrochen ist."],
  gb_triangle: ["ok", "Ein MMA-Klassiker: Kopf runterziehen, Winkel suchen."],
  gb_guillotine: ["ok", "Gegen Shots im MMA häufig – Hüfte vor."],
  gb_wrestle_up: ["ok", "Unten im MMA das Wichtigste: aufstehen."],
  ht_crossface: ["ok", "Crossface nimmt ihm Sicht und Gegenwehr."],
  ht_underhook: ["ok", "Mit Underhook kommt er nicht hoch und nicht raus."],
  ht_flatten: ["ok", "Flach liegend kann er sich schlecht schützen."],
  ht_pass: ["ok", "Vorbei an den Beinen: im MMA mehr Kontrolle."],
  ht_knee_slide: ["ok", "Mit Underhook auch im MMA sicher."],
  ht_whizzer: ["ok", "Whizzer stoppt seinen Weg nach oben."],
  ht_knee_block: ["ok", "Hüfte blockiert: er holt die Guard nicht zurück."],
  ht_base: ["ok", "Breite Basis hält dich oben."],
  hb_face_free: ["ok", "Kopf frei heißt auch: weniger Treffer."],
  hb_underhook: ["ok", "Der Underhook ist dein Weg nach oben und raus."],
  hb_knee_shield: ["ok", "Das Knie-Schild hält Schläge auf Abstand."],
  hb_come_up: ["ok", "Hochkommen ist im MMA besser als unten liegen."],
  hb_recover: ["riskant", "Volle Guard unten ist im MMA nur Zwischenstation."],
  hb_back_take: ["ok", "Vom Rücken aus trifft er dich nicht."],
  hb_old_school: ["ok", "Umkippen bringt dich oben an."],
  bot_elbow_knee: ["ok", "Ellbogen an Knie schützt auch gegen Schläge zum Körper."],
  sct_crossface: ["ok", "Crossface nimmt ihm Sicht und Platz."],
  sct_far_hip: ["ok", "Gekeilt kann er nicht aufstehen."],
  sct_underhook: ["ok", "Grundkontrolle – auch im MMA."],
  sct_to_mount: ["ok", "Im Mount sitzt du für Schläge am besten."],
  sct_kimura: ["ok", "Auch im MMA ein häufiger Abschluss."],
  sct_arm_triangle: ["ok", "Im MMA häufig aus der Seitkontrolle."],
  sct_americana: ["ok", "Auch im MMA aus der Seitkontrolle."],
  sct_hip_block: ["ok", "Hüfte blocken verhindert, dass er aufsteht."],
  scb_frame: ["ok", "Kurze Stützen schützen auch dein Gesicht."],
  scb_shrimp: ["ok", "Platz schaffen, dann Guard oder aufstehen."],
  scb_underhook: ["ok", "Auf die Knie, dann im MMA sofort aufstehen."],
  scb_knee_in: ["riskant", "Half Guard unten ist im MMA nur Zwischenstation."],
  scb_v_frame: ["ok", "Knie davor hält ihn aus dem Mount."],
  scb_head_arm_def: ["ok", "Arm eng am Kopf schützt auch vor Schlägen."],
  scb_protect_arms: ["ok", "Enge Arme decken auch den Kopf."],
  mt_heavy_hips: ["ok", "Schwere Hüfte hält ihn unten, während du schlägst."],
  mt_isolate: ["ok", "Einen Arm festhalten öffnet seine Deckung."],
  mt_armbar: ["riskant", "Du gibst den Mount auf – bleib lieber oben."],
  mt_americana: ["ok", "Aus dem Mount auch im MMA sicher."],
  mt_to_back: ["ok", "Dreht er weg, nimm den Rücken."],
  mt_knee_pinch: ["ok", "Enge Knie halten den Mount."],
  mt_post: ["ok", "Breit posten: seine Brücke kippt dich nicht."],
  mb_knee_inside: ["ok", "Ellbogen an Knie schützt auch gegen Schläge."],
  mb_bridge: ["ok", "Brücke stört seine Basis für Schläge."],
  mb_trap: ["ok", "Fängst du seinen Arm, schlägt er damit nicht."],
  mb_upa: ["ok", "Im MMA eine der sichersten Mount-Befreiungen."],
  mb_elbow_escape: ["ok", "Knie rein, dann Guard oder aufstehen."],
  mb_elbows_tight: ["ok", "Enge Ellbogen decken auch dein Gesicht."],
  mb_no_back: ["ok", "Rücken zeigen heißt im MMA: Würger von hinten."],
  bt_seatbelt: ["ok", "Gurtgriff hält ihn, auch wenn er aufsteht."],
  bt_hooks: ["ok", "Haken halten ihn – Füße nie kreuzen."],
  bt_clear_hands: ["ok", "Seine Hände wegziehen öffnet den Hals."],
  bt_rnc: ["ok", "Im MMA der häufigste Würger."],
  bt_armbar: ["ok", "Streckt er die Arme, nimm einen."],
  bt_hook_retention: ["ok", "Haken drin, sonst dreht er sich raus."],
  bt_follow: ["ok", "Folgen hält ihn am Rücken."],
  bb_hand_fight: ["ok", "Hände am Hals schützen vor Würger und Schlägen."],
  bb_hook_off: ["ok", "Haken lösen ist der erste Schritt raus."],
  bb_shoulders: ["ok", "Schultern auf die Matte nehmen ihm den Rücken."],
  bb_shrimp: ["ok", "Vor ihn drehen beendet den Rücken."],
  bb_escape_side: ["ok", "Seitkontrolle unten ist besser als Rücken."],
  bb_chin_tuck: ["ok", "Kinn runter – im MMA Pflicht."],
  bb_elbows_tight: ["ok", "Enge Ellbogen decken Hals und Gesicht."],
  tt_front_headlock: ["ok", "Kopf kontrollieren – im MMA auch für Knie."],
  tt_seatbelt: ["ok", "Gurtgriff vor den Haken, auch im MMA."],
  tt_hip_pressure: ["ok", "Gewicht hält ihn unten."],
  tt_back_take: ["ok", "Vom Rücken aus ist er wehrlos."],
  tt_to_headlock: ["ok", "Vorn am Kopf drohen Guillotine und Knie."],
  tt_sprawl_hold: ["ok", "Sprawl hält ihn unten."],
  tt_follow: ["ok", "Folgen verhindert, dass er aufsteht."],
  tb_hands: ["ok", "Hände frei machen, dann sofort aufstehen."],
  tb_base: ["ok", "Hüfte unter dich – das Aufstehen beginnt."],
  tb_stand_up: ["ok", "Im MMA das Beste aus der Turtle: aufstehen."],
  tb_sit_out: ["ok", "Rausdrehen bringt dein Gesicht zu ihm."],
  tb_guillotine_def: ["ok", "Am Handgelenk drücken, Kopf raus."],
  tb_shell: ["riskant", "Turtle im MMA: Schläge zum Kopf – schnell raus."],
  tb_head_up: ["ok", "Kopf hoch: kein Knie, keine Guillotine."],
  hl_elbow_pull: ["ok", "Ellbogen wegziehen öffnet den Weg hinter ihn."],
  hl_guillotine: ["ok", "Gegen Shots im MMA einer der häufigsten Würger."],
  hl_go_behind: ["ok", "Hinter ihm bist du sicher vor Schlägen."],
  hl_head_block: ["ok", "Kopfdruck hält ihn vorn – im MMA auch für Knie."],
  hlb_hands: ["ok", "Seine Würgehand kontrollieren, dann raus."],
  hlb_head_out: ["ok", "Kopf raus, sonst drohen Knie und Guillotine."],
  hlb_stand_up: ["ok", "Aufstehen ist im MMA immer gut."],
  hlb_shot_through: ["riskant", "Mit gesenktem Kopf drohen Knie und Guillotine."],
  hlb_elbow_in: ["ok", "Rücken nie zeigen – im MMA erst recht."],
};

function withMma(c: Card2): Card2 {
  const m = MMA[c.id];
  return m ? { ...c, mma: c.mma ?? m[0], mmaNote: c.mmaNote ?? m[1] } : c;
}

// ---------------- Glossar (B19) ----------------
// Einheitliche Begriffe: Alltagswort (Titel/Erklärung) ↔ No-Gi-Fachbegriff (Feld term). Varianten sind verboten (cards.test.ts).
export const TERMS2: { de: string; nogi: string; avoid: string[] }[] = [
  { de: "Auslage (Orthodox: links vorn, Southpaw: rechts vorn)", nogi: "Stance", avoid: [] },
  { de: "Tief gehen", nogi: "Level Change", avoid: ["Level-Change"] },
  { de: "Schritt rein", nogi: "Penetration Step", avoid: ["Pen Step"] },
  { de: "Beide Beine schnappen", nogi: "Double Leg", avoid: ["Double-Leg"] },
  { de: "Ein Bein schnappen", nogi: "Single Leg", avoid: ["Single-Leg"] },
  { de: "Beine weg, Hüfte drauf", nogi: "Sprawl", avoid: [] },
  { de: "Kopf runterziehen", nogi: "Snap Down", avoid: ["Snapdown", "Snap-Down"] },
  { de: "Kopfklammer", nogi: "Front Headlock", avoid: ["Front Head Lock", "Front-Headlock"] },
  { de: "Kinngriff", nogi: "Chin Strap", avoid: ["Chinstrap"] },
  { de: "Rumgehen, dahinter", nogi: "Go-Behind", avoid: ["Go Behind"] },
  { de: "Nackengriff", nogi: "Collar Tie", avoid: ["Collar-Tie"] },
  { de: "Unterhaken (Arm unter seine Achsel)", nogi: "Underhook", avoid: ["Under Hook", "Under-Hook"] },
  { de: "Überhaken (Arm von oben klemmen)", nogi: "Whizzer", avoid: [] },
  { de: "Zwei Hände an einem Arm", nogi: "2-on-1", avoid: ["Two-on-One", "2 on 1"] },
  { de: "Handgelenk kontrollieren", nogi: "Wrist Control", avoid: [] },
  { de: "Umklammern", nogi: "Body Lock", avoid: ["Bodylock", "Body-Lock"] },
  { de: "Gurtgriff", nogi: "Seatbelt", avoid: ["Seat Belt", "Seat-Belt"] },
  { de: "Füße einhaken", nogi: "Hooks", avoid: [] },
  { de: "Nacken-Keil, Kopf wegdrehen", nogi: "Crossface", avoid: ["Cross Face", "Cross-Face"] },
  { de: "Ellbogen an Knie", nogi: "Elbow-Knee", avoid: ["Elbow Knee"] },
  { de: "Ellbogen eng", nogi: "Elbows Tight", avoid: ["Elbows In"] },
  { de: "Unterarm als Stütze / Rahmen", nogi: "Frame", avoid: [] },
  { de: "Wegrutschen", nogi: "Shrimp", avoid: [] },
  { de: "Aufsitzen und aufstehen", nogi: "Wrestle-up", avoid: ["Wrestle up", "Wrestleup"] },
];

export const CARDS2: Card2[] = [
  ...stand, ...clinch, ...guardTop, ...guardBottom, ...halfTop, ...halfBottom, elbowKnee,
  ...sideTop, ...sideBottom, ...mountTop, ...mountBottom, ...backTop, ...backBottom,
  ...turtleTop, ...turtleBottom, ...headlockTop, ...headlockBottom,
].map(withMma);
export const CARD2: Record<string, Card2> = Object.fromEntries(CARDS2.map((c) => [c.id, c]));
export function cardsFor(pos: Pos2, role: Role2): Card2[] {
  return CARDS2.filter((c) => c.slots.some((s) => s.pos === pos && s.role === role));
}
