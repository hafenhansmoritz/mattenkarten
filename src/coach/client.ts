// Client für /api/coach: Streaming-Text, freundliche Fehler, Verfügbarkeits-Check.
import { COACH_LIMITS, type CoachErrorCode, type CoachRequest, type CoachStatus } from "./types";

const ENDPOINT = "/api/coach";

const ERROR_TEXT: Record<CoachErrorCode | "network" | "unknown", string> = {
  no_key: "Der Coach ist noch nicht aktiviert.",
  bad_request: "Das konnte der Coach nicht lesen. Versuch es mit einer kürzeren Frage.",
  too_many_messages: "Das Gespräch ist zu lang geworden. Starte einen neuen Chat.",
  message_too_long: "Die Nachricht ist zu lang. Fass dich bitte kürzer.",
  forbidden_origin: "Der Coach antwortet nur innerhalb von Mattenkarten.",
  rate_limited: "Der Coach braucht eine kurze Pause. Versuch es in ein paar Minuten noch mal.",
  upstream: "Der Coach ist gerade nicht erreichbar. Versuch es gleich noch mal.",
  method_not_allowed: "Der Coach ist gerade nicht erreichbar.",
  unknown_question: "Diese Frage kann der Coach nicht bewerten.",
  answer_too_long: "Die Antwort ist zu lang. Ein Satz reicht.",
  network: "Keine Verbindung. Prüf dein Internet und versuch es noch mal.",
  unknown: "Da ist etwas schiefgelaufen. Versuch es noch mal.",
};

/** Fehler mit Code und anzeigefertiger Meldung (message). */
export class CoachError extends Error {
  constructor(public code: CoachErrorCode | "network" | "unknown" | "aborted") {
    super(code === "aborted" ? "Abgebrochen." : ERROR_TEXT[code]);
    this.name = "CoachError";
  }
}

/** Kürzt die Anfrage auf die Server-Limits (letzte Nachrichten behalten, erste muss vom Nutzer sein). */
function fitLimits(req: CoachRequest): CoachRequest {
  if (!req.messages) return req;
  let msgs = req.messages
    .filter((m) => m.content.trim())
    .map((m) => ({ role: m.role, content: m.content.slice(0, COACH_LIMITS.maxChars) }));
  msgs = msgs.slice(-COACH_LIMITS.maxMessages);
  while (msgs.length && msgs[0].role !== "user") msgs.shift();
  return { ...req, messages: msgs };
}

/**
 * Fragt den Coach. `onText` bekommt den bisher empfangenen Gesamttext (für Live-Anzeige).
 * Wirft CoachError mit anzeigefertiger `message`. Abbruch über `signal` → code "aborted".
 */
export async function askCoach(
  req: CoachRequest,
  onText?: (fullText: string) => void,
  signal?: AbortSignal,
): Promise<string> {
  let res: Response;
  try {
    res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(fitLimits(req)),
      signal,
    });
  } catch (e) {
    throw new CoachError(isAbort(e) ? "aborted" : "network");
  }

  if (!res.ok) {
    let code: string | undefined;
    try {
      code = ((await res.json()) as { error?: string }).error;
    } catch {
      /* kein JSON (z. B. lokaler Vite-Server ohne API) */
    }
    if (code && code in ERROR_TEXT) throw new CoachError(code as CoachErrorCode);
    throw new CoachError(res.status === 404 ? "upstream" : "unknown");
  }

  let text = "";
  if (!res.body) {
    text = await res.text();
    onText?.(text);
    return text;
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      text += decoder.decode(value, { stream: true });
      onText?.(text);
    }
    text += decoder.decode();
  } catch (e) {
    if (isAbort(e)) {
      if (text) return text; // Teilantwort behalten
      throw new CoachError("aborted");
    }
    if (!text) throw new CoachError("network");
  }
  return text;
}

function isAbort(e: unknown): boolean {
  return e instanceof DOMException ? e.name === "AbortError" : (e as { name?: string } | null)?.name === "AbortError";
}

let statusCache: Promise<CoachStatus> | null = null;

/** Ist der Coach aktiv (Funktion erreichbar und API-Key gesetzt)? Ergebnis wird pro Sitzung gemerkt. */
export async function coachAvailable(force = false): Promise<boolean> {
  if (force || !statusCache) {
    statusCache = fetch(ENDPOINT, { method: "GET", headers: { accept: "application/json" } })
      .then(async (r) => (r.ok ? ((await r.json()) as CoachStatus) : { ok: false, hasKey: false }))
      .catch(() => ({ ok: false, hasKey: false }));
  }
  const s = await statusCache;
  if (!s.ok) statusCache = null; // Netzfehler nicht dauerhaft merken
  return Boolean(s.ok && s.hasKey);
}
