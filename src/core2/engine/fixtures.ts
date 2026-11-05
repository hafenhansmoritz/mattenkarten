// Kleines Test-Kartenset für die Engine-Tests (unabhängig von src/core2/data/cards.ts).
import type { Card2, Pos2, Role2 } from "../types";

const base = { term: "T", plainDo: "tut etwas", keys: [], mistakes: [] };
const slot = (pos: Pos2, role: Role2) => [{ pos, role }];

export const FIX: Card2[] = [
  // Stand (neutral)
  { ...base, id: "s_build_beine", plain: "Fußarbeit", kind: "aufbauen", zone: "beine", slots: slot("stand", "neutral"), why: "Gute Füße gewinnen Winkel." },
  { ...base, id: "s_build_arme", plain: "Griffkampf", kind: "aufbauen", zone: "arme", slots: slot("stand", "neutral"), alsoGain: { kopf: 1 }, why: "Griffe zuerst." },
  { ...base, id: "s_frame_beine", plain: "Sprawl", kind: "rahmen", zone: "beine", slots: slot("stand", "neutral"), why: "Hüfte weg, Beine zurück." },
  { ...base, id: "s_frame_arme", plain: "Hände lösen", kind: "rahmen", zone: "arme", slots: slot("stand", "neutral"), why: "Griff brechen." },
  {
    ...base, id: "s_double", plain: "Beide Beine fassen", kind: "angriff", zone: "beine", slots: slot("stand", "neutral"),
    requires: { beine: 1 }, to: { pos: "side", role: "top", points: 2 }, dilemmaOpens: "kopf", why: "Hüfte unter seine Hüfte.",
  },
  {
    ...base, id: "s_clinch", plain: "Ran an den Körper", kind: "angriff", zone: "arme", slots: slot("stand", "neutral"),
    to: { pos: "clinch", role: "neutral" }, why: "Nähe nimmt Schläge.",
  },
  // Side Control oben
  { ...base, id: "sc_cross", plain: "Kopf wegdrücken", kind: "aufbauen", zone: "kopf", slots: slot("side", "top"), why: "Wohin der Kopf geht, folgt der Körper." },
  { ...base, id: "sc_hip", plain: "Hüfte blockieren", kind: "aufbauen", zone: "huefte", slots: slot("side", "top"), gain: 2, why: "Keil an der Hüfte." },
  {
    ...base, id: "sc_kimura", plain: "Arm verdrehen", kind: "angriff", zone: "arme", slots: slot("side", "top"),
    submission: { id: "kimura", name: "Kimura" }, why: "Schulter isolieren.",
  },
  {
    ...base, id: "sc_kimura_fin", plain: "Arm fertig drehen", kind: "angriff", zone: "arme", slots: slot("side", "top"),
    submission: { id: "kimura", name: "Kimura" }, kraft: 2, why: "Langsam drehen, Partner tappt.",
  },
  {
    ...base, id: "sc_mount", plain: "Aufsteigen", kind: "angriff", zone: "huefte", slots: slot("side", "top"),
    requires: { huefte: 1 }, to: { pos: "mount", role: "top", points: 4 }, why: "Knie über die Hüfte.",
  },
  {
    ...base, id: "sc_bigmove", plain: "Großer Wechsel", kind: "angriff", zone: "kopf", slots: slot("side", "top"),
    kraft: 4, to: { pos: "back", role: "top", points: 4 }, why: "Teuer.",
  },
  // Side Control unten
  { ...base, id: "scb_frame_arme", plain: "Ellbogen rein", kind: "rahmen", zone: "arme", slots: slot("side", "bottom"), why: "Ellbogen schützt den Arm." },
  { ...base, id: "scb_frame_huefte", plain: "Hüfte rausschieben", kind: "rahmen", zone: "huefte", slots: slot("side", "bottom"), why: "Rahmen an der Hüfte." },
  { ...base, id: "scb_build_kopf", plain: "Kopf freimachen", kind: "aufbauen", zone: "kopf", slots: slot("side", "bottom"), why: "Kopf zuerst." },
  {
    ...base, id: "scb_escape", plain: "Zurück in die Guard", kind: "angriff", zone: "beine", slots: slot("side", "bottom"),
    requires: { beine: 0 }, to: { pos: "guard", role: "bottom", escape: "guard" }, why: "Knie zwischen euch.",
  },
  // Mount
  { ...base, id: "m_build", plain: "Schwer sitzen", kind: "aufbauen", zone: "huefte", slots: slot("mount", "top"), why: "Gewicht auf die Hüfte." },
  { ...base, id: "mb_frame", plain: "Brücke", kind: "rahmen", zone: "huefte", slots: slot("mount", "bottom"), why: "Brücke hebt." },
  // Guard
  { ...base, id: "g_build_top", plain: "Haltung", kind: "aufbauen", zone: "kopf", slots: slot("guard", "top"), why: "Aufrecht bleiben." },
  { ...base, id: "g_build_bot", plain: "Kopf runterziehen", kind: "aufbauen", zone: "kopf", slots: slot("guard", "bottom"), why: "Haltung brechen." },
];
