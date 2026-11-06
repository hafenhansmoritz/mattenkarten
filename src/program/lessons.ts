// 7-Tage-Startprogramm – neue Kern-2-Lektionen für Tag 3, 4, 5 und 6 (No-Gi-Reihenfolge, KB 8.12).
// Nur bestehende Karten aus src/core2/data/cards.ts. Lösbarkeit: lessons.test.ts (fester Seed + Skript-Gegner: 100 %;
// andere Seeds ≥ 90 %). ui = Freischalt-Stufe (Tag), siehe core2/ui/disclosure.ts → uiFeatures.
// Quellen: research_notes/7 Tage Startprogramm/notes.md, docs/knowledge-base.md (Danaher: erst Pin-Escapes).
import type { TutorialK2Def } from "../core2/ui/tutorialTypes";

export const LESSONS_PROGRAM: TutorialK2Def[] = [
  {
    id: "p-side-escape",
    title: "Rahmen, Hüfte, Guard zurück",
    idea: "Unten in der Seitenkontrolle: erst Unterarm als Stütze, dann wegrutschen.",
    // Tag 3 (Stufe 3): Kopf/Nacken, Hüfte, Beine; Rahmen neu. Arme bleiben ausgeblendet.
    // Kopf −1 (sein Crossface), Arme −1 (sein Underhook – unsichtbar, macht aber seinen Kopf-Arm-Würger möglich:
    // genau eine gegnerische Aufgabe). Hüfte +1: Knie an der Hüfte, Shrimp ist spielbar.
    start: { pos: "side", top: "o", board: { kopf: -1, arme: -1, huefte: 1 } },
    ui: 3,
    // Erste Woche: Griffe, Ketten, verdeckte Konter und Spielstil bleiben aus (eine Idee pro Lektion).
    grips: false, chains: false, konter: false, stil: false,
    seed: 3301,
    // Skript: R1 keilt er die Hüfte, R2 setzt er den Nacken-Keil, R3 greift er einmal mit dem Kopf-Arm-Würger an
    // (du rahmst am Nacken). Danach keilt er nur noch – kein zweiter Würger.
    foe: { script: { 1: "sct_far_hip", 2: "sct_crossface", 3: "sct_arm_triangle" }, prefer: ["sct_to_mount", "sct_crossface", "sct_far_hip", "sct_hip_block"], subs: ["arm_triangle"] },
    // Ziel: Guard oder Half Guard unten – Turtle zählt nicht („Rücken nie zeigen“).
    goal: [
      { pos: "guard", role: "bottom" },
      { pos: "half", role: "bottom" },
    ],
    aiLevel: 1,
    maxRounds: 9,
    steps: [
      {
        round: 1, when: "start", highlightZone: "kopf",
        text: "Er liegt quer auf dir: Seitenkontrolle (Side Control). Erst schützt du deinen Hals, dann schaffst du Platz.",
      },
      {
        round: 1, when: "pick", requireCard: "scb_frame", highlightZone: "kopf",
        text: "Spiel „Unterarm als Stütze“ (Frame): Unterarm an seinen Hals, Ellbogen nah. Du drückst nicht – du stützt nur ab.",
      },
      {
        round: 1, when: "after",
        text: "Die Stütze hält ihn auf Abstand. In die Lücke kommt gleich deine Hüfte.",
      },
      {
        round: 2, when: "pick", requireCard: "bot_elbow_knee", highlightZone: "huefte",
        text: "Jetzt „Ellbogen ans Knie“ (Elbow-Knee): Ellbogen und Knie zusammen. So kann er nicht über deine Hüfte steigen.",
      },
      {
        round: 2, when: "after", highlightZone: "kopf",
        text: "Deine Hüfte ist geschützt. Aber er hat jetzt deinen Nacken – rot heißt: Dort kann er würgen.",
      },
      {
        round: 3, when: "pick", requireCard: "scb_head_arm_def", highlightZone: "kopf",
        text: "Er will Kopf und Arm einschließen (Arm Triangle). Spiel „Arm nicht rüberlassen“ – ein Rahmen am Nacken stoppt den Angriff dort.",
      },
      {
        round: 3, when: "after",
        text: "Gestoppt! Sein Würger ist weg. Jetzt ist Platz für „Wegrutschen, Beine davor“ (Shrimp).",
      },
      {
        round: 4, when: "start",
        text: "Jetzt du allein: wegrutschen, Beine zurück vor ihn – Guard oder Halbe Guard. Rücken nie zeigen.",
      },
    ],
  },
  {
    id: "p-guard-posture",
    title: "Haltung in der Guard",
    idea: "Oben in der Guard: erst aufrecht sitzen, dann seine Beine öffnen.",
    // Hüfte +1: dein Knie-Keil sitzt, sein Hüft-Sweep ist anfangs nicht spielbar. Arme +1: Ellbogen eng.
    // Fokus: erst Haltung (Kopf). Tag 4 (Stufe 4): alle Zonen, „Flucht“ neu.
    start: { pos: "guard", top: "p", board: { arme: 1, huefte: 1 } },
    ui: 4,
    foe: { script: { 1: "gb_hip_frame" } },
    // Erste Woche: Griffe, Ketten, verdeckte Konter und Spielstil bleiben aus (eine Idee pro Lektion).
    grips: false, chains: false, konter: false, stil: false,
    seed: 4401,
    goal: [
      { pos: "half", role: "top" },
      { pos: "side", role: "top" },
      { pos: "mount", role: "top" },
    ],
    aiLevel: 1,
    maxRounds: 8,
    steps: [
      {
        round: 1, when: "start", highlightZone: "kopf",
        text: "Du kniest in seiner Guard. Er zieht deinen Kopf runter. Unten will er Würger und Armhebel.",
      },
      {
        round: 1, when: "pick", requireCard: "gt_posture", highlightZone: "kopf",
        text: "Spiel „Aufrecht sitzen“ (Posture): Rücken gerade, Hände auf seinen Bauch. Dann kommt er schwer an dich ran.",
      },
      {
        round: 1, when: "after",
        text: "Merke: Oben heißt es „Haltung“. Unten heißt es „Haltung brechen“. Wer gewinnt, bestimmt das Spiel.",
      },
      {
        round: 2, when: "pick", highlightZone: "beine", predict: true,
        text: "Jetzt seine Beine aufmachen (Guard öffnen). Ohne offene Beine kommst du nicht vorbei.",
      },
      {
        round: 3, when: "start",
        text: "Jetzt du allein: Halte deine Haltung und geh an seinen Beinen vorbei. Rot zeigt seine Angriffe.",
      },
    ],
  },
  {
    id: "p-shot-sprawl",
    title: "Shot oder Sprawl",
    idea: "Im Stand: tief gehen, dann schießen – schießt er, Beine weg.",
    // Kopf +1: du stehst gut (Auslage, Blick nach vorn). Beine +1: du stehst tief, Hände vorn (No-Gi-Hand-Fighting) –
    // sein Shot ist nicht sofort spielbar. Fokus liegt auf Tiefe und Beinen (Test: ≥ 90 % über 30 Seeds).
    start: { pos: "stand", top: null, board: { kopf: 1, beine: 1 } },
    // Tag 5 (Stufe 5): Atem und Phasenleiste neu.
    ui: 5,
    foe: { script: { 1: "nd_outside_foot" } },
    // Erste Woche: Griffe, Ketten, verdeckte Konter und Spielstil bleiben aus (eine Idee pro Lektion).
    grips: false, chains: false, konter: false, stil: false,
    seed: 5501,
    goal: [
      { pos: "guard", role: "top" },
      { pos: "half", role: "top" },
      { pos: "side", role: "top" },
      { pos: "turtle", role: "top" },
      { pos: "mount", role: "top" },
      { pos: "back", role: "top" },
    ],
    aiLevel: 1,
    maxRounds: 8,
    steps: [
      {
        round: 1, when: "start", highlightZone: "beine",
        text: "Du stehst ihm gegenüber. Wer den anderen zu Boden bringt (Takedown), landet oben.",
      },
      {
        round: 1, when: "pick", requireCard: "nd_level_change", highlightZone: "beine",
        text: "Erst „Tief gehen, Schritt rein“ (Level Change). Aus der Tiefe kommst du an seine Beine.",
      },
      {
        round: 1, when: "after",
        text: "Jetzt sind seine Beine näher. Ein Schuss auf beide Beine (Double Leg) wird stärker.",
      },
      {
        round: 2, when: "pick", highlightZone: "beine", predict: true,
        text: "Greift er deine Beine an? Dann Beine nach hinten, Hüfte drauf (Sprawl). Sonst: schieß selbst.",
      },
      {
        round: 3, when: "start",
        text: "Jetzt du allein. Bring ihn runter und lande oben. Rot zeigt, wo er schießen kann.",
      },
    ],
  },
  {
    id: "p-back-protect",
    title: "Rücken schützen",
    idea: "Er ist an deinem Rücken: erst die Hände, dann raus zur Seite.",
    // Kopf −1: sein Würgearm ist nah. Arme +1: deine Hände sind schon an seinen – sein RNC (braucht seine Arme +1) ist gesperrt.
    // Quellen: Grapplearts RNC (Hände zuerst), BJJ Atlas Back Escapes (Seitenkontrolle unten ist ein Erfolg).
    start: { pos: "back", top: "o", board: { kopf: -1, arme: 1, huefte: 0, beine: 0 } },
    // Tag 6 (Stufe 6): Keil, Dilemma, Vorhersage (abschaltbar).
    ui: 6,
    foe: { script: { 1: "bt_hook_retention" } },
    // Erste Woche: Griffe, Ketten, verdeckte Konter und Spielstil bleiben aus (eine Idee pro Lektion).
    grips: false, chains: false, konter: false, stil: false,
    seed: 6601,
    goal: [
      { pos: "side", role: "bottom" },
      { pos: "guard", role: "bottom" },
      { pos: "half", role: "bottom" },
      { pos: "stand", role: "neutral" },
    ],
    aiLevel: 1,
    maxRounds: 8,
    steps: [
      {
        round: 1, when: "start", highlightZone: "kopf",
        text: "Er ist hinter dir, Arme um deinen Oberkörper. Ohne Gi droht vor allem der Würger von hinten (RNC).",
      },
      {
        round: 1, when: "pick", requireCard: "bb_hand_fight", highlightZone: "arme",
        text: "Spiel „Hände gegen Hände“ (Hand Fighting): beide Hände an seine Würgehand. So verbindet er die Hände nicht.",
      },
      {
        round: 1, when: "after",
        text: "Deine Hände halten seine. Kinn bleibt unten. Jetzt kannst du dich befreien.",
      },
      {
        round: 2, when: "pick", highlightZone: "beine", predict: true,
        text: "Steig über seinen oberen Haken und dreh dich zu ihm (Rausdrehen zur Seite). Seitenkontrolle unten ist schon ein Erfolg.",
      },
      {
        round: 3, when: "start",
        text: "Jetzt du allein: Hände am Hals verteidigen, dann raus. Rot zeigt, wo er angreifen kann.",
      },
    ],
  },
];
