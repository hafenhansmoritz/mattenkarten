// ============================================================
// Tagesrätsel ("Puzzles"): handgebaute Situationen – eine Karte ist die beste Antwort.
// Jedes Rätsel wird mit der echten Engine (resolveReveal) gelöst, siehe puzzles.test.ts.
// ============================================================
import { CARD } from "./cards";
import { POSITION_GUIDE } from "./positions";
import { createMatch } from "../engine/match";
import { resolveReveal } from "../engine/resolve";
import { mulberry32, shuffle } from "../engine/rng";
import type { MatchState, PositionId, RevealOutcome, Role, Side } from "../engine/types";

export type PuzzleConcept = "Dreieck" | "Kontern" | "Position vor Aufgabe" | "Dilemma" | "Fluchtweg" | "Punkte";
export const PUZZLE_CONCEPTS: PuzzleConcept[] = ["Dreieck", "Kontern", "Position vor Aufgabe", "Dilemma", "Fluchtweg", "Punkte"];

/** Ein Satz pro Konzept für die Übungsliste. */
export const CONCEPT_INFO: Record<PuzzleConcept, string> = {
  Dreieck: "Angreifen schlägt Vorbereiten, Vorbereiten schlägt Kontern, Kontern schlägt Angreifen.",
  Kontern: "Der richtige Konter stoppt genau diesen Angriff – der falsche gar nichts.",
  "Position vor Aufgabe": "Erst die bessere Position, dann der Abschluss.",
  Dilemma: "Schützt er das eine, ist das andere offen.",
  Fluchtweg: "Unten zuerst raus – erst Platz, dann weg.",
  Punkte: "Takedown 2, Sweep 2, Vorbeigehen 3, Draufsitzen und Rücken 4.",
};

export type Difficulty = 1 | 2 | 3;

export interface Puzzle {
  id: string;
  title: string;
  difficulty: Difficulty;
  pos: PositionId;
  /** Wer oben ist (null = neutral im Stand). */
  top: Side | null;
  /** Alltagssprache: was passiert und was er vorhat. */
  situation: string;
  /** Die Karte, die er spielen wird (wird erst beim Aufdecken gezeigt). */
  oppCard: string;
  /** Drei Karten, die du in dieser Lage spielen darfst. */
  options: [string, string, string];
  answer: string;
  /** ≤ 20 Wörter, Alltagssprache zuerst. */
  why: string;
  concept: PuzzleConcept;
  /** Vorgeschichte (Dilemma): Deine letzte Karte wurde von dieser Reaktion gekontert. */
  prior?: { played: string; counteredBy: string };
}

const P = (x: Puzzle) => x;

export const PUZZLES: Puzzle[] = [
  // ---------------- Distanz ----------------
  P({
    id: "dist-sprawl-double", title: "Er taucht ab", difficulty: 1, pos: "dist", top: null,
    situation: "Er wirkt angriffslustig, senkt den Kopf und will an deine Beine.",
    oppCard: "double_leg", options: ["sprawl", "b_distance", "level_change"], answer: "sprawl",
    why: "Beine weg, Hüfte drauf stoppt Beinangriffe – danach hast du seinen Kopf.", concept: "Kontern",
  }),
  P({
    id: "dist-distance-jab", title: "Schnelle Hand", difficulty: 1, pos: "dist", top: null,
    situation: "Er tänzelt vor dir und zuckt mit der vorderen Hand – gleich schlägt er.",
    oppCard: "jab", options: ["b_distance", "sprawl", "b_stance"], answer: "b_distance",
    why: "Abstand halten lässt Schläge ins Leere gehen. Beine weg hilft nur gegen Beinangriffe.", concept: "Kontern",
  }),
  P({
    id: "dist-double-stance", title: "Er sammelt sich", difficulty: 1, pos: "dist", top: null,
    situation: "Er steht ruhig, sortiert seine Füße und bereitet sich vor.",
    oppCard: "b_stance", options: ["double_leg", "sprawl", "b_stance"], answer: "double_leg",
    why: "Wer sich noch vorbereitet, wird erwischt. Beine schnappen bringt dich oben auf den Boden: 2 Punkte.", concept: "Punkte",
  }),
  P({
    id: "dist-level-vs-sprawl", title: "Er lauert", difficulty: 2, pos: "dist", top: null,
    situation: "Er wartet tief und lauert nur darauf, dass du an seine Beine schießt.",
    oppCard: "sprawl", options: ["level_change", "double_leg", "single_leg"], answer: "level_change",
    why: "Er wartet auf deinen Beinangriff. In die Knie gehen lockt ihn ins Leere und öffnet eine Lücke.", concept: "Dreieck",
  }),
  P({
    id: "dist-distance-clinch", title: "Er rückt ran", difficulty: 2, pos: "dist", top: null,
    situation: "Er kommt mit hohen Armen nach vorne und will dich festhalten.",
    oppCard: "clinch_entry", options: ["b_distance", "sprawl", "double_leg"], answer: "b_distance",
    why: "Abstand halten stoppt das Ranrücken. Sein Ranrücken ist schneller als dein Beinangriff.", concept: "Kontern",
  }),
  P({
    id: "dist-clinch-vs-level", title: "Die Finte", difficulty: 2, pos: "dist", top: null,
    situation: "Er geht tief in die Knie und täuscht einen Beinangriff an – noch kommt er nicht.",
    oppCard: "level_change", options: ["sprawl", "clinch_entry", "b_stance"], answer: "clinch_entry",
    why: "Er bereitet nur vor. Wer jetzt angreift, erwischt ihn – Kontern ginge ins Leere.", concept: "Dreieck",
  }),
  P({
    id: "dist-sprawl-single", title: "Ein Bein im Visier", difficulty: 2, pos: "dist", top: null,
    situation: "Er schaut auf dein vorderes Bein und verlagert sein Gewicht nach vorne.",
    oppCard: "single_leg", options: ["sprawl", "b_distance", "jab"], answer: "sprawl",
    why: "Der Schlag bremst ihn nur. Beine weg stoppt den Angriff und du landest oben am Kopf.", concept: "Kontern",
  }),
  P({
    id: "dist-jab-tempo", title: "Wer ist schneller?", difficulty: 3, pos: "dist", top: null,
    situation: "Er spannt sich an und will an deine Beine. Ein Konter passt hier nicht.",
    oppCard: "double_leg", options: ["jab", "single_leg", "b_stance"], answer: "jab",
    why: "Beide greifen an – der Schnellere gewinnt. Der Schlag kommt vor seinem Beinangriff an.", concept: "Dreieck",
  }),

  // ---------------- Clinch ----------------
  P({
    id: "clinch-frames-ogoshi", title: "Hüfte rein", difficulty: 2, pos: "clinch", top: null,
    situation: "Er dreht sich ein und schiebt seine Hüfte vor deine – er will dich werfen.",
    oppCard: "o_goshi", options: ["frames_hips_back", "sprawl", "head_up"], answer: "frames_hips_back",
    why: "Wegdrücken und Hüfte zurück stoppt Würfe. Beine weg hilft nur gegen Beinangriffe.", concept: "Kontern",
  }),
  P({
    id: "clinch-headup-snap", title: "Hand im Nacken", difficulty: 1, pos: "clinch", top: null,
    situation: "Seine Hand liegt schwer in deinem Nacken. Er will deinen Kopf runterziehen.",
    oppCard: "snap_down", options: ["head_up", "sprawl", "whizzer"], answer: "head_up",
    why: "Kopf hoch bleiben stoppt das Runterziehen. Die anderen Konter passen nicht dazu.", concept: "Kontern",
  }),
  P({
    id: "clinch-whizzer-single", title: "Er will ein Bein", difficulty: 2, pos: "clinch", top: null,
    situation: "Er senkt die Schulter und greift nach deinem vorderen Bein.",
    oppCard: "single_leg", options: ["whizzer", "frames_hips_back", "head_up"], answer: "whizzer",
    why: "Arm überhaken und Hüfte rein stoppt ein Bein – und du hast danach seinen Kopf.", concept: "Kontern",
  }),
  P({
    id: "clinch-snap-collar", title: "Er sucht Griffe", difficulty: 1, pos: "clinch", top: null,
    situation: "Er fummelt an deinem Nacken herum und sucht noch den richtigen Griff.",
    oppCard: "collar_tie", options: ["snap_down", "head_up", "underhook"], answer: "snap_down",
    why: "Er bereitet nur vor. Kopf runterziehen erwischt ihn sofort.", concept: "Dreieck",
  }),
  P({
    id: "clinch-underhook-headup", title: "Steifer Nacken", difficulty: 2, pos: "clinch", top: null,
    situation: "Er hält den Kopf steif und wartet, dass du am Kopf ziehst.",
    oppCard: "head_up", options: ["snap_down", "underhook", "b_hips_back"], answer: "underhook",
    why: "Er wartet auf deinen Angriff. Vorbereiten lockt ihn ins Leere und bringt dir Griff.", concept: "Dreieck",
  }),
  P({
    id: "clinch-frames-bodylock", title: "Arme um die Hüfte", difficulty: 2, pos: "clinch", top: null,
    situation: "Er schließt beide Arme um deinen Bauch und stellt sein Bein hinter deins.",
    oppCard: "body_lock_trip", options: ["frames_hips_back", "b_hips_back", "whizzer"], answer: "frames_hips_back",
    why: "Gegen Umklammern hilft nur Wegdrücken mit Hüfte zurück. Die anderen stoppen Beinangriffe.", concept: "Kontern",
  }),
  P({
    id: "clinch-hipsback-ankle", title: "Blick zum Fuß", difficulty: 3, pos: "clinch", top: null,
    situation: "Er zieht deinen Kopf etwas runter und schielt auf deinen Fuß.",
    oppCard: "ankle_pick", options: ["b_hips_back", "head_up", "frames_hips_back"], answer: "b_hips_back",
    why: "Er will deinen Fuß, nicht den Kopf. Hüfte zurück stoppt Angriffe auf die Beine.", concept: "Kontern",
  }),
  P({
    id: "clinch-armdrag-osoto", title: "Bein von hinten", difficulty: 3, pos: "clinch", top: null,
    situation: "Er tritt neben dich und holt mit dem Bein aus. Kein Konter stoppt dieses Sicheln.",
    oppCard: "o_soto", options: ["frames_hips_back", "arm_drag", "b_pummel"], answer: "arm_drag",
    why: "Wenn kein Konter passt, sei schneller: Arm ziehen geht vor seinem Wurf durch – du bist hinten.", concept: "Dreieck",
  }),
  P({
    id: "clinch-dilemma-double", title: "Kopf oder Beine", difficulty: 3, pos: "clinch", top: null,
    situation: "Eben hast du am Kopf gezogen – er hielt ihn hoch. Jetzt wartet er wieder steif.",
    oppCard: "head_up", options: ["snap_down", "double_leg", "b_pummel"], answer: "double_leg",
    why: "Er schützt den Kopf – also sind die Beine frei. Beine schnappen bringt 2 Punkte.", concept: "Dilemma",
    prior: { played: "snap_down", counteredBy: "head_up" },
  }),
  P({
    id: "clinch-ogoshi-underhook", title: "Er gräbt unter", difficulty: 1, pos: "clinch", top: null,
    situation: "Er schiebt seinen Arm unter deine Achsel und bereitet etwas vor.",
    oppCard: "underhook", options: ["o_goshi", "frames_hips_back", "collar_tie"], answer: "o_goshi",
    why: "Er bereitet nur vor. Dein Hüftwurf trifft ihn sofort: 2 Punkte und du liegst quer drauf.", concept: "Punkte",
  }),
  P({
    id: "clinch-ankle-vs-frames", title: "Er rechnet mit dem Wurf", difficulty: 3, pos: "clinch", top: null,
    situation: "Er hält dich mit gestreckten Armen weg und zieht die Hüfte zurück – gegen jeden Wurf.",
    oppCard: "frames_hips_back", options: ["o_goshi", "body_lock_trip", "ankle_pick"], answer: "ankle_pick",
    why: "Sein Konter stoppt Würfe, nicht den Griff zum Fuß. Greif an, wo er nicht schützt.", concept: "Kontern",
  }),

  // ---------------- Kopf unterm Arm (oben) ----------------
  P({
    id: "fhl-hold-situp", title: "Er will raussitzen", difficulty: 1, pos: "fhl", top: "p",
    situation: "Sein Kopf steckt unter deinem Arm. Er zappelt und will rausrutschen.",
    oppCard: "sit_out", options: ["b_fhl_sprawl_hold", "b_fhl_pressure", "guillotine"], answer: "b_fhl_sprawl_hold",
    why: "Er will entkommen. Hüfte schwer, Beine hinten hält ihn genau dort fest.", concept: "Kontern",
  }),
  P({
    id: "fhl-gobehind-chin", title: "Kinn eingezogen", difficulty: 2, pos: "fhl", top: "p",
    situation: "Er zieht das Kinn tief ein und wartet, dass du seinen Hals greifst.",
    oppCard: "b_fhl_chin", options: ["guillotine", "go_behind", "b_fhl_sprawl_hold"], answer: "go_behind",
    why: "Sein Hals ist zu. Erst hinter ihn – im Rücken bist du in der besten Position.", concept: "Position vor Aufgabe",
  }),
  P({
    id: "fhl-guillo-handfight", title: "Er kämpft um Griffe", difficulty: 1, pos: "fhl", top: "p",
    situation: "Er ist nur damit beschäftigt, deine Hände zu lösen.",
    oppCard: "b_fhl_handfight", options: ["guillotine", "b_fhl_sprawl_hold", "b_fhl_pressure"], answer: "guillotine",
    why: "Er bereitet nur vor. Jetzt angreifen – der Würger von vorne beendet den Kampf.", concept: "Dreieck",
  }),
  P({
    id: "fhl-guillo-elbowblock", title: "Seite zu, Hals offen", difficulty: 3, pos: "fhl", top: "p",
    situation: "Er klemmt den Ellbogen fest an, damit du nicht hinter ihn kommst.",
    oppCard: "elbow_block", options: ["go_behind", "b_fhl_turnover", "guillotine"], answer: "guillotine",
    why: "Er schützt die Seite – dafür ist der Hals offen. Würger von vorne geht durch.", concept: "Dilemma",
  }),

  // ---------------- Kopf unterm Arm (unten) ----------------
  P({
    id: "fhlb-chin-guillo", title: "Arm um den Hals", difficulty: 1, pos: "fhl", top: "o",
    situation: "Dein Kopf steckt unter seinem Arm. Er schiebt den Unterarm unter dein Kinn.",
    oppCard: "guillotine", options: ["b_fhl_chin", "elbow_block", "sit_out"], answer: "b_fhl_chin",
    why: "Er will dich würgen. Kinn ein, Ellbogen eng – sein Würger scheitert.", concept: "Kontern",
  }),
  P({
    id: "fhlb-elbow-gobehind", title: "Er läuft rum", difficulty: 2, pos: "fhl", top: "o",
    situation: "Er lockert den Griff am Kopf und macht einen Schritt zur Seite.",
    oppCard: "go_behind", options: ["elbow_block", "b_fhl_chin", "b_fhl_handfight"], answer: "elbow_block",
    why: "Er will hinter dich. Ellbogen zu und mitdrehen blockiert den Weg.", concept: "Kontern",
  }),
  P({
    id: "fhlb-sitout-pressure", title: "Er drückt nur", difficulty: 1, pos: "fhl", top: "o",
    situation: "Er drückt deinen Kopf runter und baut nur Druck auf.",
    oppCard: "b_fhl_pressure", options: ["sit_out", "b_fhl_chin", "b_fhl_handfight"], answer: "sit_out",
    why: "Er bereitet nur vor. Raussitzen bringt dich zurück in den Stand.", concept: "Fluchtweg",
  }),
  P({
    id: "fhlb-handfight-hold", title: "Er wartet auf die Flucht", difficulty: 2, pos: "fhl", top: "o",
    situation: "Er liegt schwer auf dir und wartet nur, dass du rausrutschen willst.",
    oppCard: "b_fhl_sprawl_hold", options: ["sit_out", "b_fhl_standup", "b_fhl_handfight"], answer: "b_fhl_handfight",
    why: "Er wartet auf deine Flucht. Erst Griffe lösen – das öffnet den Fluchtweg.", concept: "Fluchtweg",
  }),

  // ---------------- Beine um ihn (oben) ----------------
  P({
    id: "guard-posture-armbar", title: "Sein Bein klettert", difficulty: 1, pos: "guard", top: "p",
    situation: "Du kniest in seinen Beinen. Er greift deinen Arm und schwingt ein Bein hoch.",
    oppCard: "armbar_guard", options: ["posture_defense", "base_post", "stack_pass"], answer: "posture_defense",
    why: "Er will deinen Arm strecken. Aufrecht bleiben, Ellbogen eng – sein Hebel greift nicht.", concept: "Kontern",
  }),
  P({
    id: "guard-base-hipbump", title: "Hüfte hoch", difficulty: 2, pos: "guard", top: "p",
    situation: "Er setzt sich auf und schiebt seine Hüfte gegen dich – er will dich umwerfen.",
    oppCard: "hip_bump", options: ["base_post", "posture_defense", "stack_pass"], answer: "base_post",
    why: "Er will dich umdrehen. Breit stehen, Hand abstützen – du bleibst oben.", concept: "Kontern",
  }),
  P({
    id: "guard-posture-triangle", title: "Beine um den Hals", difficulty: 3, pos: "guard", top: "p",
    situation: "Er zieht deinen Kopf runter und schiebt ein Bein über deine Schulter.",
    oppCard: "triangle", options: ["posture_defense", "b_guard_elbows", "base_post"], answer: "posture_defense",
    why: "Ellbogen eng stoppt nur Armhebel. Gegen den Beinwürger hilft nur: aufrecht bleiben.", concept: "Kontern",
  }),
  P({
    id: "guard-slice-breakposture", title: "Er zieht dich runter", difficulty: 1, pos: "guard", top: "p",
    situation: "Er zieht an deinem Kragen und will deine Haltung brechen.",
    oppCard: "b_break_posture", options: ["knee_slice", "base_post", "b_guard_posture"], answer: "knee_slice",
    why: "Er bereitet nur vor. Knie durchschneiden bringt dich quer drauf: 3 Punkte.", concept: "Punkte",
  }),
  P({
    id: "guard-posture-frame", title: "Knie dazwischen", difficulty: 2, pos: "guard", top: "p",
    situation: "Er hat sein Knie zwischen euch geschoben und wartet, dass du vorbeigehen willst.",
    oppCard: "b_guard_frame", options: ["knee_slice", "stack_pass", "b_guard_posture"], answer: "b_guard_posture",
    why: "Er wartet auf deinen Pass. Erst aufrecht sitzen und Griff holen – er wartet umsonst.", concept: "Dreieck",
  }),
  P({
    id: "guard-slice-standup", title: "Er will aufstehen", difficulty: 2, pos: "guard", top: "p",
    situation: "Er stützt sich auf eine Hand und will aufstehen.",
    oppCard: "b_tech_standup", options: ["knee_slice", "b_guard_posture", "b_guard_open_pass"], answer: "knee_slice",
    why: "Er ist langsam. Der schnelle Pass kommt zuerst: quer drauf, 3 Punkte.", concept: "Punkte",
  }),

  // ---------------- Beine um ihn (unten) ----------------
  P({
    id: "guardb-hipbump-posture", title: "Er sitzt aufrecht", difficulty: 1, pos: "guard", top: "o",
    situation: "Er sitzt aufrecht in deinen Beinen und sortiert seine Haltung.",
    oppCard: "b_guard_posture", options: ["hip_bump", "b_guard_frame", "b_break_posture"], answer: "hip_bump",
    why: "Er bereitet nur vor. Hüfte hoch wirft ihn um – du sitzt drauf: 2 Punkte.", concept: "Punkte",
  }),
  P({
    id: "guardb-frame-slice", title: "Knie schneidet", difficulty: 1, pos: "guard", top: "o",
    situation: "Er drückt ein Knie über deinen Oberschenkel und will vorbei.",
    oppCard: "knee_slice", options: ["b_guard_frame", "hip_bump", "triangle"], answer: "b_guard_frame",
    why: "Er will vorbei. Hüfte raus, Knie dazwischen – er kommt nicht durch.", concept: "Kontern",
  }),
  P({
    id: "guardb-dilemma-armbar", title: "Dreieck verteidigt", difficulty: 3, pos: "guard", top: "o",
    situation: "Eben hat er sich gegen dein Bein-Dreieck aufgerichtet. Jetzt wartet er wieder aufrecht.",
    oppCard: "posture_defense", options: ["triangle", "armbar_guard", "b_guard_frame"], answer: "armbar_guard",
    why: "Er hat das Dreieck verteidigt – dabei liegt der Arm frei. Armhebel geht durch.", concept: "Dilemma",
    prior: { played: "triangle", counteredBy: "posture_defense" },
  }),
  P({
    id: "guardb-dilemma-kimura", title: "Er stützt sich ab", difficulty: 3, pos: "guard", top: "o",
    situation: "Dein Umwerfen hat er mit der Hand auf der Matte gestoppt. Er stützt sich wieder ab.",
    oppCard: "base_post", options: ["hip_bump", "kimura_guard", "scissor_sweep"], answer: "kimura_guard",
    why: "Seine Hand stützt auf der Matte – greif genau diesen Arm und dreh ihn nach hinten.", concept: "Dilemma",
    prior: { played: "hip_bump", counteredBy: "base_post" },
  }),
  P({
    id: "guardb-triangle-elbows", title: "Ellbogen eng", difficulty: 2, pos: "guard", top: "o",
    situation: "Er hält beide Ellbogen eng am Körper, damit du keinen Arm strecken kannst.",
    oppCard: "b_guard_elbows", options: ["armbar_guard", "triangle", "b_guard_frame"], answer: "triangle",
    why: "Er schützt die Arme – sein Hals ist offen. Das Bein-Dreieck geht durch.", concept: "Dilemma",
  }),
  P({
    id: "guardb-frame-stack", title: "Er stapelt dich", difficulty: 2, pos: "guard", top: "o",
    situation: "Er hebt deine Beine an und drückt dich auf die Schultern.",
    oppCard: "stack_pass", options: ["b_guard_frame", "b_break_posture", "scissor_sweep"], answer: "b_guard_frame",
    why: "Er will vorbei. Hüfte raus, Knie dazwischen stoppt jeden Pass.", concept: "Kontern",
  }),

  // ---------------- Quer drauf (oben) ----------------
  P({
    id: "side-hips-shrimp", title: "Er rutscht weg", difficulty: 1, pos: "side", top: "p",
    situation: "Du liegst quer auf ihm. Er drückt mit den Armen und will mit der Hüfte weg.",
    oppCard: "shrimp_recover", options: ["b_side_hips", "b_side_crossface", "americana"], answer: "b_side_hips",
    why: "Er will entkommen. Knie an seine Hüfte – er kommt nicht raus.", concept: "Kontern",
  }),
  P({
    id: "side-mount-frames", title: "Er stemmt nur", difficulty: 1, pos: "side", top: "p",
    situation: "Er stemmt die Unterarme gegen dich und bereitet seine Flucht vor.",
    oppCard: "b_side_frames", options: ["to_mount", "b_side_hips", "b_side_crossface"], answer: "to_mount",
    why: "Er bereitet nur vor. Aufsteigen bringt dich auf seinen Bauch: 4 Punkte.", concept: "Punkte",
  }),
  P({
    id: "side-mount-arms", title: "Hände zusammen", difficulty: 2, pos: "side", top: "p",
    situation: "Er hält seine Hände fest zusammen und rechnet mit einem Schulterhebel.",
    oppCard: "b_side_arms", options: ["americana", "kimura_side", "to_mount"], answer: "to_mount",
    why: "Seine Arme sind zu. Erst die bessere Position: draufsitzen, 4 Punkte.", concept: "Position vor Aufgabe",
  }),
  P({
    id: "side-crossface-wrist", title: "Er wartet ab", difficulty: 2, pos: "side", top: "p",
    situation: "Er liegt still und wartet nur, dass du nach seinem Arm greifst.",
    oppCard: "wrist_free", options: ["kimura_side", "b_side_crossface", "b_side_hips"], answer: "b_side_crossface",
    why: "Er wartet auf deinen Hebel. Erst Druck mit der Brust aufbauen – er wartet umsonst.", concept: "Dreieck",
  }),

  // ---------------- Quer drauf (unten) ----------------
  P({
    id: "sideb-arms-americana", title: "Er dreht deinen Arm", difficulty: 1, pos: "side", top: "o",
    situation: "Er liegt quer auf dir, drückt dein Handgelenk auf die Matte und will drehen.",
    oppCard: "americana", options: ["b_side_arms", "underhook_knees", "b_side_frames"], answer: "b_side_arms",
    why: "Er will die Schulter drehen. Ellbogen eng, Hände zusammen – der Hebel greift nicht.", concept: "Kontern",
  }),
  P({
    id: "sideb-shrimp-crossface", title: "Er drückt mit der Brust", difficulty: 1, pos: "side", top: "o",
    situation: "Er drückt seine Brust schwer auf dich und dreht deinen Kopf weg.",
    oppCard: "b_side_crossface", options: ["shrimp_recover", "b_side_arms", "b_side_frames"], answer: "shrimp_recover",
    why: "Er bereitet nur vor. Jetzt wegrutschen und die Beine zurück dazwischen bringen.", concept: "Fluchtweg",
  }),
  P({
    id: "sideb-frames-hips", title: "Knie an der Hüfte", difficulty: 2, pos: "side", top: "o",
    situation: "Er klebt mit dem Knie an deiner Hüfte und wartet auf deine Flucht.",
    oppCard: "b_side_hips", options: ["shrimp_recover", "b_side_bridge_shrimp", "b_side_frames"], answer: "b_side_frames",
    why: "Er wartet auf deine Flucht. Erst Unterarme dagegen – das schafft Platz für später.", concept: "Fluchtweg",
  }),
  P({
    id: "sideb-shrimp-kimura", title: "Langsamer Griff", difficulty: 3, pos: "side", top: "o",
    situation: "Er fädelt umständlich einen Arm um deinen und braucht noch etwas Zeit.",
    oppCard: "kimura_side", options: ["shrimp_recover", "b_side_frames", "b_side_bridge_shrimp"], answer: "shrimp_recover",
    why: "Sein Hebel ist langsam. Schnell wegrutschen – du bist raus, bevor er dreht.", concept: "Fluchtweg",
  }),

  // ---------------- Draufsitzen (oben) ----------------
  P({
    id: "mount-post-upa", title: "Er brückt", difficulty: 1, pos: "mount", top: "p",
    situation: "Du sitzt auf ihm. Er klemmt deinen Arm ein und drückt die Hüfte hoch.",
    oppCard: "upa", options: ["b_mount_post", "b_mount_base", "armbar_mount"], answer: "b_mount_post",
    why: "Er will dich abwerfen. Hand weit abstützen – du bleibst oben.", concept: "Kontern",
  }),
  P({
    id: "mount-americana-frames", title: "Er schafft Platz", difficulty: 1, pos: "mount", top: "p",
    situation: "Er schiebt die Ellbogen zwischen euch und bereitet seine Flucht vor.",
    oppCard: "b_mount_frames", options: ["americana", "b_mount_post", "b_mount_base"], answer: "americana",
    why: "Er bereitet nur vor. Arm nach unten drehen erwischt ihn – Kampf vorbei.", concept: "Dreieck",
  }),
  P({
    id: "mount-back-elbows", title: "Arme versteckt", difficulty: 2, pos: "mount", top: "p",
    situation: "Er hält die Arme eng und dreht sich leicht zur Seite.",
    oppCard: "b_mount_elbows", options: ["armbar_mount", "mount_to_back", "b_mount_post"], answer: "mount_to_back",
    why: "Er schützt die Arme. Wer trotzdem streckt, verliert die Position – geh an den Rücken.", concept: "Position vor Aufgabe",
  }),
  P({
    id: "mount-back-elbowknee", title: "Er dreht sich weg", difficulty: 3, pos: "mount", top: "p",
    situation: "Er dreht sich auf die Seite und schiebt ein Knie rein. Abstützen hilft hier nicht.",
    oppCard: "elbow_knee", options: ["b_mount_post", "americana", "mount_to_back"], answer: "mount_to_back",
    why: "Er dreht dir den Rücken zu. Geh schnell mit – an den Rücken, bevor das Knie drin ist.", concept: "Position vor Aufgabe",
  }),
  P({
    id: "mount-dilemma-americana", title: "Arm gerettet?", difficulty: 3, pos: "mount", top: "p",
    situation: "Er hat dein Armstrecken eben abgewehrt und hält die Ellbogen wieder eng.",
    oppCard: "b_mount_elbows", options: ["armbar_mount", "americana", "b_mount_post"], answer: "americana",
    why: "Er schützt gegen das Strecken – dann dreh den Arm nach unten. Schulterhebel geht durch.", concept: "Dilemma",
    prior: { played: "armbar_mount", counteredBy: "b_mount_elbows" },
  }),

  // ---------------- Draufsitzen (unten) ----------------
  P({
    id: "mountb-elbows-armbar", title: "Er greift deinen Arm", difficulty: 1, pos: "mount", top: "o",
    situation: "Er sitzt auf dir, packt deinen Arm und will ein Bein über deinen Kopf schwingen.",
    oppCard: "armbar_mount", options: ["b_mount_elbows", "wrist_free", "b_mount_frames"], answer: "b_mount_elbows",
    why: "Arme nie strecken! Bleiben sie eng, rutscht er beim Versuch sogar von dir runter.", concept: "Kontern",
  }),
  P({
    id: "mountb-wrist-americana", title: "Handgelenk auf der Matte", difficulty: 2, pos: "mount", top: "o",
    situation: "Er drückt dein Handgelenk neben deinem Kopf auf die Matte.",
    oppCard: "americana", options: ["wrist_free", "b_mount_elbows", "b_mount_shrimp"], answer: "wrist_free",
    why: "Er will die Schulter drehen. Handgelenk hochholen stoppt das – Ellbogen eng hilft nur gegen Strecken.", concept: "Kontern",
  }),
  P({
    id: "mountb-upa-base", title: "Er rückt zurecht", difficulty: 1, pos: "mount", top: "o",
    situation: "Er rutscht auf dir zurecht und sucht noch sein Gleichgewicht.",
    oppCard: "b_mount_base", options: ["upa", "b_mount_elbows", "b_mount_frames"], answer: "upa",
    why: "Er bereitet nur vor. Brücke und rollen – jetzt bist du oben.", concept: "Fluchtweg",
  }),
  P({
    id: "mountb-elbowknee-post", title: "Er stützt sich ab", difficulty: 2, pos: "mount", top: "o",
    situation: "Er stützt beide Hände weit ab und wartet, dass du ihn abwirfst.",
    oppCard: "b_mount_post", options: ["upa", "elbow_knee", "b_mount_frames"], answer: "elbow_knee",
    why: "Er erwartet die Brücke. Rutsch stattdessen seitlich raus und bring das Knie dazwischen.", concept: "Fluchtweg",
  }),
  P({
    id: "mountb-upa-americana", title: "Er dreht langsam", difficulty: 3, pos: "mount", top: "o",
    situation: "Er greift umständlich nach deinem Handgelenk. Seine Hände sind beschäftigt.",
    oppCard: "americana", options: ["upa", "b_mount_elbows", "b_mount_frames"], answer: "upa",
    why: "Seine Hände sind beschäftigt – brück ihn schnell runter, bevor er den Arm dreht.", concept: "Fluchtweg",
  }),

  // ---------------- Im Rücken (oben) ----------------
  P({
    id: "back-hooks-escape", title: "Er rutscht weg", difficulty: 1, pos: "back", top: "p",
    situation: "Du klebst an seinem Rücken. Er schiebt die Schultern zur Matte und will raus.",
    oppCard: "back_escape", options: ["b_back_hooks_hold", "rnc", "b_back_seatbelt"], answer: "b_back_hooks_hold",
    why: "Er will entkommen. Hüfte folgt ihm – deine Beine bleiben drin.", concept: "Kontern",
  }),
  P({
    id: "back-rnc-handfight", title: "Hände gegen Hände", difficulty: 1, pos: "back", top: "p",
    situation: "Er kämpft mit beiden Händen um dein Handgelenk und bereitet etwas vor.",
    oppCard: "b_back_handfight", options: ["rnc", "b_back_hooks_hold", "seatbelt_hooks"], answer: "rnc",
    why: "Er bereitet nur vor. Jetzt der Würger von hinten – Kampf vorbei.", concept: "Dreieck",
  }),
  P({
    id: "back-hooks-chin", title: "Kinn auf der Brust", difficulty: 2, pos: "back", top: "p",
    situation: "Er drückt das Kinn auf die Brust und wartet auf deinen Würger.",
    oppCard: "b_back_chin", options: ["rnc", "seatbelt_hooks", "b_back_hooks_hold"], answer: "seatbelt_hooks",
    why: "Sein Hals ist zu. Erst festschnallen und Füße rein – das bringt 4 Punkte.", concept: "Punkte",
  }),
  P({
    id: "back-rnc-slide", title: "Langsame Flucht", difficulty: 3, pos: "back", top: "p",
    situation: "Er versucht umständlich, deinen Fuß abzustreifen. Sein Hals ist frei.",
    oppCard: "b_back_slide", options: ["rnc", "b_back_hooks_hold", "seatbelt_hooks"], answer: "rnc",
    why: "Er flieht langsam und vergisst den Hals. Dein Würger ist schneller – Kampf vorbei.", concept: "Dreieck",
  }),

  // ---------------- Im Rücken (unten) ----------------
  P({
    id: "backb-chin-rnc", title: "Arm um den Hals", difficulty: 1, pos: "back", top: "o",
    situation: "Er ist hinter dir und schiebt seinen Arm unter dein Kinn.",
    oppCard: "rnc", options: ["b_back_chin", "back_escape", "b_back_handfight"], answer: "b_back_chin",
    why: "Er will würgen. Kinn auf die Brust – sein Arm kommt nicht durch.", concept: "Kontern",
  }),
  P({
    id: "backb-escape-seatbelt", title: "Er umarmt dich", difficulty: 1, pos: "back", top: "o",
    situation: "Er umarmt dich von hinten und sortiert seine Griffe.",
    oppCard: "b_back_seatbelt", options: ["back_escape", "b_back_chin", "b_back_handfight"], answer: "back_escape",
    why: "Er bereitet nur vor. Rausdrehen – raus aus der gefährlichsten Lage.", concept: "Fluchtweg",
  }),
  P({
    id: "backb-handfight-hooks", title: "Er wartet auf die Flucht", difficulty: 2, pos: "back", top: "o",
    situation: "Seine Beine kleben an deiner Hüfte. Er wartet, dass du wegrutschst.",
    oppCard: "b_back_hooks_hold", options: ["back_escape", "b_back_slide", "b_back_handfight"], answer: "b_back_handfight",
    why: "Er wartet auf deine Flucht. Erst zwei Hände an ein Handgelenk – das öffnet den Weg.", concept: "Fluchtweg",
  }),
  P({
    id: "backb-escape-hooks", title: "Haken kommen", difficulty: 2, pos: "back", top: "o",
    situation: "Er schnallt sich fest und will beide Füße reinhaken – das wären 4 Punkte.",
    oppCard: "seatbelt_hooks", options: ["back_escape", "hand_defense", "b_back_chin"], answer: "back_escape",
    why: "Er bereitet nur vor. Jetzt raus, bevor die Haken sitzen – sonst kassiert er 4 Punkte.", concept: "Punkte",
  }),
];

export const PUZZLE: Record<string, Puzzle> = Object.fromEntries(PUZZLES.map((p) => [p.id, p]));

// ------------------------------------------------------------------
// Auflösung mit der echten Engine
// ------------------------------------------------------------------

/** Rolle des Spielers im Rätsel. */
export function puzzleRole(p: Puzzle): Role {
  return p.top === null ? "neutral" : p.top === "p" ? "top" : "bottom";
}

/** Startzustand des Rätsels: Position, feste Hand = Optionen, keine Ressourcen, optionale Vorgeschichte. */
export function puzzleState(p: Puzzle): MatchState {
  const s = createMatch([], [], 1, 12, {
    startPos: p.pos, startTop: p.top, noResources: true, fixedHand: [...p.options], handSize: 3,
  });
  if (!p.prior) return s;
  const counters = CARD[p.prior.counteredBy]?.counters ?? [];
  return { ...s, p: { ...s.p, lastPlayed: p.prior.played, lastCounteredBy: [...counters] } };
}

function rankOf(pos: PositionId, role: Role): number {
  return POSITION_GUIDE[pos].rank[role] ?? 0;
}
function roleIn(s: MatchState, side: Side): Role {
  return s.top === null ? "neutral" : s.top === side ? "top" : "bottom";
}

export interface PuzzleResult {
  cardId: string;
  outcome: RevealOutcome;
  after: MatchState;
  /** Bewertung aus Sicht des Spielers (höher = besser). Tap = ±100. */
  score: number;
  tap: "p" | "o" | null;
}

/**
 * Bewertung eines Reveals: Tap ±100, Positionsrang ×3, Punktedifferenz, Kontrolle ×0.5,
 * Lücke +1, gewonnener Schlagabtausch +1 / verlorener −1.
 */
export function scoreResult(before: MatchState, after: MatchState, outcome: RevealOutcome): { score: number; tap: "p" | "o" | null } {
  const tap = after.result?.type === "submission" ? after.result.winner : null;
  let score = tap === "p" ? 100 : tap === "o" ? -100 : 0;
  score += 3 * (rankOf(after.pos, roleIn(after, "p")) - rankOf(before.pos, roleIn(before, "p")));
  score += (after.p.pts - before.p.pts) - (after.o.pts - before.o.pts);
  score += 0.5 * ((after.p.control - before.p.control) - (after.o.control - before.o.control));
  if (after.p.opening && !before.p.opening) score += 1;
  if (after.o.opening && !before.o.opening) score -= 1;
  score += outcome.winner === "p" ? 1 : outcome.winner === "o" ? -1 : 0;
  return { score, tap };
}

/** Spielt eine Option gegen die Gegnerkarte (echte Regeln). */
export function playPuzzle(p: Puzzle, cardId: string): PuzzleResult {
  const before = puzzleState(p);
  const { state: after, outcome } = resolveReveal(before, cardId, p.oppCard);
  return { cardId, outcome, after, ...scoreResult(before, after, outcome) };
}

// ------------------------------------------------------------------
// Tagesauswahl
// ------------------------------------------------------------------

/** "YYYY-MM-DD" in lokaler Zeit. */
export function dateKey(d: Date | string): string {
  if (typeof d === "string") return d.slice(0, 10);
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

/** Tage seit 1970-01-01 für einen Datumsschlüssel (zeitzonenfrei). */
export function dayNumber(key: string): number {
  const [y, m, d] = key.split("-").map(Number);
  return Math.floor(Date.UTC(y, m - 1, d) / 86_400_000);
}

const POOL_SEED = 0x7a6e;
const POOLS: Record<Difficulty, Puzzle[]> = {
  1: shuffle(PUZZLES.filter((p) => p.difficulty === 1), mulberry32(POOL_SEED + 1)),
  2: shuffle(PUZZLES.filter((p) => p.difficulty === 2), mulberry32(POOL_SEED + 2)),
  3: shuffle(PUZZLES.filter((p) => p.difficulty === 3), mulberry32(POOL_SEED + 3)),
};

/**
 * Drei Rätsel pro Tag (leicht → mittel → schwer), deterministisch nach Datum.
 * Jede Stufe läuft reihum durch einen fest gemischten Pool – Wiederholungen erst nach einem vollen Durchlauf.
 */
export function puzzleOfDay(date: Date | string): Puzzle[] {
  const n = dayNumber(dateKey(date));
  return ([1, 2, 3] as const).map((d) => {
    const pool = POOLS[d];
    return pool[((n % pool.length) + pool.length) % pool.length];
  });
}

/** Freies Üben: Rätsel eines Konzepts (oder alle), leicht → schwer, ungelöste zuerst. */
export function practiceSet(concept: PuzzleConcept | null, solved: readonly string[] = []): Puzzle[] {
  const list = PUZZLES.filter((p) => concept === null || p.concept === concept);
  return [...list].sort((a, b) =>
    Number(solved.includes(a.id)) - Number(solved.includes(b.id)) || a.difficulty - b.difficulty);
}
