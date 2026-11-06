// Erklärungen aus Sicht des Spielers, wenn der GEGNER die Karte spielt (UX-Review 2, Punkt 4).
// Normalfall: automatisch umgedreht (engine/perspective.ts → flipPerspective: du ↔ er, dein ↔ sein, Verben).
// Hier stehen nur die Sätze, die sich nicht mechanisch drehen lassen: Imperative („Fang den Kopf“), „er“/„ihn“ für
// Dinge („verlierst du ihn“ = den Underhook) und Sätze, die aus Spielersicht klarer anders gesagt werden.
// Geprüft in engine/perspective.test.ts (Heuristik: keine Handlung des Gegners in du-Form).

export const WHY_OPP: Record<string, string> = {
  cl_collar_tie: "Mit der Hand in deinem Nacken (Collar Tie) führt er deinen Kopf und bereitet das Runterziehen vor.",
  cl_underhook: "Er hat den Underhook – die beste Clinch-Position. Schwimm mit deinem Arm innen zurück (Pummeling).",
  cl_snap_down: "Er zieht deinen Kopf runter, bis du auf die Hände fällst (Snap Down): er landet in der Kopfklammer (Front Headlock).",
  gt_base_post: "Breite Basis und eine stützende Hand (Base, Post) stoppen deinen Sweep – er holt die Hand schnell zurück.",
  gb_break_posture: "Er zieht deinen Kopf zu sich runter (Haltung brechen): erst dann erreicht er Hals und Arme.",
  gb_guillotine: "Sinkt dein Kopf, fängt er ihn (Guillotine): Arm tief um deinen Hals, Hüfte vor.",
  ht_underhook: "Hat er den Underhook (Unterhaken), fehlt er dir – wer ihn hat, bestimmt die halbe Guard.",
  hb_back_take: "Sein Knie-Schild hält dich fern, er zieht deinen Arm am Trizeps vorbei (Arm Drag) und rutscht hinter dich.",
  hl_go_behind: "Er zieht dich vor und blockt deine Achsel – so kommt er hinter dich (Go-Behind), du kannst nicht mitdrehen.",
  tt_to_headlock: "Hältst du deinen Rücken dicht, geht er nach vorn an deinen Kopf (Front Headlock) – dort droht die Guillotine.",
  tb_sit_out: "Er kickt ein Bein unter sich durch und dreht sich zu dir (Sit-out) – sein Rücken ist wieder weg von dir.",
  tb_base: "Er startet seine Flucht sofort (Base) – wer wartet, gibt den Rücken ab.",
  tb_guillotine_def: "Er drückt an deinem Handgelenk, nicht am Ellbogen (Guillotine-Abwehr), und schiebt den Kopf zur anderen Seite.",
  hlb_shot_through: "Hängst du schwer über ihm, schießt er durch an deine Beine (Re-Shot) – du fällst auf den Rücken.",
  // Review-Beispiele: aus Spielersicht, mit dem Namen deiner Karte („Wegrutschen, Knie dazwischen“).
  mt_knee_pinch: "Seine engen Knie (Knee Pinch) lassen keinen Platz für dein Knie – dein Wegrutschen mit Knie dazwischen stockt.",
  mt_to_back: "Drehst du dich weg, nimmt er deinen Rücken (Mount to Back) – Gurtgriff und beide Haken. Jetzt: Hände an den Hals.",
  sct_to_mount: "Er blockt deine Hüfte und steigt mit dem Knie über deinen Bauch (Mount). Stemmst du dagegen, liegt dein Arm frei.",
};

export const CHAIN_WHY_OPP: Record<string, string> = {
  mt_americana: "Beugst du den Arm gegen die Armbar, dreht er ihn zur Matte: Americana.",
  hl_go_behind: "Nach dem Snap Down sind deine Hände auf der Matte – er geht rum, bevor du dich aufrichtest.",
};
