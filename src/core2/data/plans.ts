// Kern 2 – Spielpläne (Mechanik 6, Spec B51–B56): Standard-Plan je Spielstil, Signatur-Plan je Boss, gespeicherter Plan.
// Regeln (Ziehen, Mulligan, Grundlagen) stehen in engine/plan.ts – hier nur Inhalte und Speicher.
// Quelle (per WebFetch geprüft, 2026-11-06): Gracie Barra, How To Build Your A Game – „Study all aspects of that smaller number
// of A Game techniques and make them as sharp as possible.“ / „Foundation in the fundamentals comes first.“
import { PLAN_SIZE } from "../engine/plan";
import type { StilId } from "../types";
import { STIL_IDS } from "../engine/stil";

export const PLAN_SRC = { title: "Gracie Barra – How To Build Your A Game", url: "https://graciebarra.com/gb-learning/how-to-build-your-a-game" };

/** „Warum das im echten Grappling so ist“ (≤ 20 Wörter). */
export const PLAN_BJJ = "Erst die Grundlagen, dann wenige eigene Techniken – die übst du, bis sie richtig scharf sind.";
/** Die Regel in zwei Sätzen (Hub, Mulligan, Glossar). */
export const PLAN_RULE = [
  "Dein Spielplan sind 15 Angriffe: Du startest mit 4, tauschst einmal bis zu 2 und ziehst jede Runde 1.",
  "Gezogene Angriffe sind geübt und brauchen 1 weniger – Aufbauen, Rahmen und Befreiungen kann jeder, immer.",
];

export interface PlanDef {
  id: string;
  name: string;
  /** Zu welchem Stil er passt (Standard-Plan) bzw. wessen Stil (Boss). */
  stil: StilId;
  /** Idee in einem Satz (≤ 20 Wörter, du-Form). */
  idea: string;
  cards: string[];
}

/** B56 Standard-Spielpläne je Spielstil (spielbar, bevor es den Spielplan-Bauer gibt). Reihenfolge wie STIL_IDS. */
export const DEFAULT_PLANS: PlanDef[] = [
  {
    id: "std-ringer", name: "Ringer-Plan", stil: "ringer",
    idea: "Schießen, umklammern oder Kopf runter – oben passieren, dann Kimura, Americana, Armbar oder Guillotine.",
    cards: [
      "nd_double_leg", "nd_single_leg", "nd_clinch_entry", "gt_knee_slice", "ht_pass", "ht_knee_slide", "sct_to_mount",
      "sct_kimura", "sct_americana", "mt_americana", "mt_armbar", "gt_toreando", "cl_snap_down", "cl_body_lock", "hl_guillotine",
    ],
  },
  {
    id: "std-guard", name: "Guard-Plan", stil: "guard",
    idea: "Guard ziehen, dann Sweep, Triangle, Armbar oder Guillotine – und oben passieren bis zum Arm-Triangle.",
    cards: [
      "nd_clinch_entry", "cl_pull_guard", "cl_snap_down", "gb_butterfly_sweep", "gb_armbar", "gb_triangle", "gb_guillotine",
      "hl_guillotine", "mt_armbar", "ht_knee_slide", "sct_arm_triangle", "sct_to_mount", "ht_pass", "cl_body_lock", "nd_single_leg",
    ],
  },
  {
    id: "std-druecker", name: "Druck-Plan", stil: "druecker",
    idea: "Runterbringen, schwer passieren, in der Seitenkontrolle drücken – Arm-Triangle oder Americana.",
    cards: [
      "nd_double_leg", "nd_single_leg", "nd_clinch_entry", "cl_body_lock", "gt_body_lock", "gt_knee_slice", "ht_pass",
      "ht_knee_slide", "sct_to_mount", "sct_arm_triangle", "sct_americana", "mt_americana", "cl_snap_down", "gt_toreando", "hl_guillotine",
    ],
  },
  {
    id: "std-ruecken", name: "Rücken-Plan", stil: "ruecken",
    idea: "Arm Drag oder Snap Down, hinter ihn, Rücken nehmen – dann der Würger von hinten.",
    cards: [
      "nd_clinch_entry", "nd_single_leg", "nd_arm_drag", "cl_snap_down", "tt_back_take", "tt_to_headlock", "hl_go_behind",
      "hl_guillotine", "bt_rnc", "bt_armbar", "ht_pass", "ht_knee_slide", "sct_arm_triangle", "nd_double_leg", "gt_knee_slice",
    ],
  },
];
export const DEFAULT_PLAN: Record<StilId, PlanDef> = Object.fromEntries(DEFAULT_PLANS.map((p) => [p.stil, p])) as Record<StilId, PlanDef>;

/** B55 Signatur-Pläne der Bosse (ihr A-Game aus data/bosses.ts: Lieblingslagen, Aufgaben, Griffe, Ketten). */
export const BOSS_PLANS: Record<StilId, PlanDef> = {
  ringer: {
    id: "boss-ringer", name: "Kopfklammer-System", stil: "ringer",
    idea: "Collar Tie, Snap Down, Kopf fassen – dann Guillotine oder dahinter.",
    cards: [
      "nd_double_leg", "nd_single_leg", "nd_clinch_entry", "cl_snap_down", "nd_arm_drag", "hl_guillotine", "hl_go_behind",
      "tt_back_take", "tt_to_headlock", "bt_rnc", "gt_knee_slice", "ht_pass", "sct_to_mount", "sct_kimura", "mt_americana",
    ],
  },
  guard: {
    id: "boss-guard", name: "Closed-Guard-System", stil: "guard",
    idea: "Guard ziehen, Handgelenk kontrollieren – Triangle, Armbar und Guillotine als Kette.",
    cards: [
      "nd_clinch_entry", "cl_pull_guard", "cl_snap_down", "nd_single_leg", "gb_butterfly_sweep", "gb_armbar", "gb_triangle",
      "gb_guillotine", "hl_guillotine", "mt_armbar", "mt_americana", "mt_to_back", "sct_arm_triangle", "ht_pass", "bt_rnc",
    ],
  },
  druecker: {
    id: "boss-druecker", name: "Druck-System", stil: "druecker",
    // B62: vorher mit Mount → Rücken (ohne Aufgabe dort) und ohne Weg in den Clinch – im Spielplan-Modus nur 35,6 %.
    idea: "Kopf runter oder umklammern, schwer passieren – Kimura, Americana, Armbar; vorne die Guillotine.",
    cards: [
      "nd_double_leg", "nd_single_leg", "nd_clinch_entry", "cl_body_lock", "cl_snap_down", "hl_guillotine", "gt_body_lock",
      "gt_knee_slice", "ht_pass", "ht_knee_slide", "sct_to_mount", "sct_kimura", "sct_americana", "mt_americana", "mt_armbar",
    ],
  },
  ruecken: {
    id: "boss-ruecken", name: "Rücken-System", stil: "ruecken",
    idea: "Turtle, Seatbelt, Haken rein – RNC oder Armbar vom Rücken.",
    cards: [
      "nd_clinch_entry", "nd_single_leg", "nd_double_leg", "nd_arm_drag", "cl_snap_down", "tt_back_take", "tt_to_headlock",
      "hl_go_behind", "hl_guillotine", "bt_rnc", "bt_armbar", "mt_to_back", "sct_to_mount", "gt_knee_slice", "ht_knee_slide",
    ],
  },
};

export const ALL_PLANS: PlanDef[] = [...DEFAULT_PLANS, ...STIL_IDS.map((id) => BOSS_PLANS[id])];

// ---------------- Gewählter Spielplan (localStorage) ----------------
/** Gewählter Spielplan: { id, cards } – Prompt 7 (Spielplan-Bauer) speichert hier eigene Pläne mit derselben Form. */
export const PLAN_KEY = "mk.k2.plan";
/** Hinweis „So geht der Spielplan-Modus“ schon gesehen. */
export const PLAN_HINT_KEY = "mk.k2.plan.hint";

export interface SavedPlan { id: string; cards: string[] }

export function readPlan(): SavedPlan | null {
  try {
    const v = JSON.parse(localStorage.getItem(PLAN_KEY) ?? "null");
    if (v && typeof v.id === "string" && Array.isArray(v.cards) && v.cards.length === PLAN_SIZE && v.cards.every((x: unknown) => typeof x === "string")) return v;
    return null;
  } catch { return null; }
}
export function writePlan(p: SavedPlan): void {
  try { localStorage.setItem(PLAN_KEY, JSON.stringify(p)); } catch { /* privat oder voll */ }
}
export function readPlanHintSeen(): boolean {
  try { return localStorage.getItem(PLAN_HINT_KEY) === "1"; } catch { return false; }
}
export function markPlanHintSeen(): void {
  try { localStorage.setItem(PLAN_HINT_KEY, "1"); } catch { /* egal */ }
}
/** Name eines gespeicherten Plans (Standard-Plan, eigener Plan aus dem Spielplan-Bauer oder „Eigener Plan“). */
export function planName(p: SavedPlan): string {
  return ALL_PLANS.find((x) => x.id === p.id)?.name ?? readMyPlans().find((x) => x.id === p.id)?.name ?? "Eigener Plan";
}

// ---------------- Mechanik 7: eigene Pläne (Spielplan-Bauer, Spec B57–B62) ----------------
/** Bis zu 5 eigene Pläne: { plans: [{ id, name, stil, cards }] }. Der aktive Plan steht weiter in PLAN_KEY ({ id, cards }). */
export const MY_PLANS_KEY = "mk.k2.plans.v1";
export const MY_PLANS_MAX = 5;
export const PLAN_NAME_MAX = 24;
export interface MyPlan { id: string; name: string; stil: StilId; cards: string[] }

export function readMyPlans(): MyPlan[] {
  try {
    const v = JSON.parse(localStorage.getItem(MY_PLANS_KEY) ?? "null");
    const arr: unknown[] = Array.isArray(v?.plans) ? v.plans : [];
    return arr.filter((x): x is MyPlan => {
      const p = x as MyPlan;
      return !!p && typeof p.id === "string" && typeof p.name === "string" && (STIL_IDS as string[]).includes(p.stil)
        && Array.isArray(p.cards) && p.cards.length === PLAN_SIZE && p.cards.every((c) => typeof c === "string");
    }).slice(0, MY_PLANS_MAX);
  } catch { return []; }
}
function writeMyPlans(plans: MyPlan[]): void {
  try { localStorage.setItem(MY_PLANS_KEY, JSON.stringify({ plans })); } catch { /* privat oder voll */ }
}
/** Speichert (neu oder überschreibt gleiche id). Wirft, wenn schon MY_PLANS_MAX andere Pläne da sind. */
export function saveMyPlan(p: MyPlan): MyPlan[] {
  const cur = readMyPlans();
  const clean: MyPlan = { ...p, name: p.name.trim().slice(0, PLAN_NAME_MAX) || "Eigener Plan", cards: [...p.cards] };
  const i = cur.findIndex((x) => x.id === p.id);
  if (i < 0 && cur.length >= MY_PLANS_MAX) throw new Error(`Höchstens ${MY_PLANS_MAX} eigene Pläne – lösch erst einen.`);
  const next = i < 0 ? [...cur, clean] : cur.map((x, k) => (k === i ? clean : x));
  writeMyPlans(next);
  return next;
}
export function deleteMyPlan(id: string): MyPlan[] {
  const next = readMyPlans().filter((x) => x.id !== id);
  writeMyPlans(next);
  return next;
}
export function newPlanId(): string {
  return `eigen-${Date.now().toString(36)}${Math.floor(Math.random() * 1296).toString(36)}`;
}
/** Stil eines Plans: Standard-Plan → sein Stil, eigener Plan → gespeicherter Stil. */
export function stilOfPlanId(id: string): StilId | undefined {
  return DEFAULT_PLANS.find((x) => x.id === id)?.stil ?? readMyPlans().find((x) => x.id === id)?.stil;
}

/** B57 Leihkarten: Mit kleiner Sammlung (weniger als LEIH_MIN Angriffs-Karten) leihst du dir die Karten deines Spielstils
 *  (Standard-Plan + Boss-Plan dieses Stils) – so bleibt kein Anfänger hängen. Die Standard-Pläne gehen ohnehin immer. */
export const LEIH_MIN = 20;
export function stilCards(stil: StilId): string[] {
  return [...new Set([...DEFAULT_PLAN[stil].cards, ...BOSS_PLANS[stil].cards])];
}
export function availablePlanCards(collected: string[], planCards: string[], stil: StilId): { owned: string[]; leih: string[]; small: boolean } {
  const pc = new Set(planCards);
  const owned = [...new Set(collected)].filter((id) => pc.has(id));
  const small = owned.length < LEIH_MIN;
  const leih = small ? stilCards(stil).filter((id) => pc.has(id) && !owned.includes(id)) : [];
  return { owned, leih, small };
}

// ---------------- Mechanik 7: Sideboard vor dem Boss (B60) ----------------
export interface BossSideboard {
  /** Seine Signatur-Karten (aus seinem Plan) – darauf stellst du dich ein. */
  signature: string[];
  /** Grundlagen dagegen – kannst du immer, die musst du nicht tauschen. */
  basics: string[];
  /** Empfohlen hinein (Reihenfolge = Wichtigkeit). */
  wants: string[];
  /** Bringt gegen ihn wenig – zuerst raus. */
  avoid: string[];
  /** Empfehlung in einem Satz (≤ 20 Wörter). */
  tip: string;
}
export const BOSS_SIDEBOARD: Record<StilId, BossSideboard> = {
  ringer: {
    signature: ["cl_snap_down", "hl_guillotine", "hl_go_behind", "nd_double_leg"],
    basics: ["nd_sprawl", "cl_underhook", "hlb_hands"],
    // Sim (B60): Guard ziehen gegen ihn kostet 4–8 Punkte – oben bleiben und passieren hält das Niveau.
    wants: ["nd_single_leg", "ht_pass", "ht_knee_slide", "gt_knee_slice"],
    avoid: ["nd_double_leg", "cl_pull_guard", "nd_arm_drag"],
    tip: "Gegen den Ringer: Sprawl kannst du immer. Bleib oben – Single Leg und Pässe, am Boden ist er schwächer.",
  },
  guard: {
    signature: ["cl_pull_guard", "gb_triangle", "gb_armbar", "gb_butterfly_sweep"],
    basics: ["gt_posture", "gt_elbows_in", "gt_both_arms"],
    wants: ["gt_knee_slice", "gt_toreando", "gt_body_lock"],
    avoid: ["cl_pull_guard", "gb_triangle", "gb_armbar", "gb_guillotine", "gb_butterfly_sweep"],
    tip: "Gegen die Guard-Spielerin: Haltung kannst du immer. Nimm Pässe, damit du aus ihrer Guard rauskommst.",
  },
  druecker: {
    signature: ["gt_knee_slice", "sct_kimura", "sct_americana", "mt_americana"],
    basics: ["scb_frame", "mb_elbows_tight", "scb_shrimp"],
    wants: ["cl_snap_down", "hl_guillotine", "gb_butterfly_sweep"],
    avoid: ["cl_pull_guard", "nd_double_leg"],
    tip: "Gegen den Drücker: Rahmen kannst du immer. Bleib vorne – Snap Down und Guillotine, aus der Guard der Sweep.",
  },
  ruecken: {
    signature: ["nd_arm_drag", "tt_back_take", "bt_rnc", "bt_armbar"],
    basics: ["tb_shell", "bb_chin_tuck", "bb_hand_fight"],
    wants: ["cl_snap_down", "hl_guillotine", "gt_knee_slice"],
    avoid: ["cl_pull_guard", "nd_arm_drag"],
    tip: "Gegen die Rückenjägerin: Gesicht zu ihr kannst du immer. Greif vorne an – Snap Down und Guillotine.",
  },
};
