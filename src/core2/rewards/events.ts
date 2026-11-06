// Mechanik 8 – Lern-Ereignisse (B63). Lernbereiche (Programm, Reise, Beinhebel-Modul) MELDEN nur, dass etwas
// geschafft ist. Sie lesen nie den Belohnungs-Speicher – Lernen ist nie hinter Belohnungen gesperrt.
// Dieses Modul hat bewusst keine Abfrage-Funktion: nur melden und zuhören.

export type LearningEvent =
  | { type: "program_day"; day: number }
  | { type: "exam_passed" }
  | { type: "review_done" }
  | { type: "error_cleared"; id: string }
  | { type: "training_logged" }
  | { type: "daily_won"; date: string }
  | { type: "boss_first_win"; boss: string; name?: string }
  | { type: "leglock_badge" };

export type LearningEventType = LearningEvent["type"];

type Listener = (e: LearningEvent) => void;
const listeners = new Set<Listener>();
/** Ereignisse, bevor jemand zuhört (z. B. Speicher noch nicht geladen) – höchstens 20. */
const early: LearningEvent[] = [];

/** Etwas Gelerntes melden. Gibt nichts zurück und wirft nie – ein Fehler darf das Lernen nie stören. */
export function emitLearning(e: LearningEvent): void {
  if (!listeners.size) { if (early.length < 20) early.push(e); return; }
  for (const l of listeners) {
    try { l(e); } catch { /* Belohnungen sind Zugabe, nie Bedingung */ }
  }
}

export function onLearning(l: Listener): () => void {
  listeners.add(l);
  if (early.length) {
    for (const e of early.splice(0)) { try { l(e); } catch { /* egal */ } }
  }
  return () => { listeners.delete(l); };
}
