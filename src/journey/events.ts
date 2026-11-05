// Kleiner Ereignis-Kanal: Quiz.tsx meldet jede erste Antwort, die Reise (src/journey) hört zu.
// So bleibt Quiz.tsx unabhängig vom Speicher der Reise.

export interface QuizAnswerEvent { id: string; ok: boolean; session: string }

type Listener = (e: QuizAnswerEvent) => void;
const listeners = new Set<Listener>();

/** Von Quiz.tsx aufgerufen: erster Versuch einer Frage in einer Runde. */
export function emitQuizAnswer(e: QuizAnswerEvent) {
  for (const l of listeners) {
    try { l(e); } catch { /* ein Fehler im Zuhörer darf das Quiz nie stören */ }
  }
}

export function onQuizAnswer(l: Listener): () => void {
  listeners.add(l);
  return () => { listeners.delete(l); };
}

let n = 0;
/** Eindeutige Runden-ID (eine pro Quiz-Durchgang). */
export function newQuizSession(): string {
  n++;
  return `s${Date.now().toString(36)}-${n}-${Math.floor(Math.random() * 1e6).toString(36)}`;
}
