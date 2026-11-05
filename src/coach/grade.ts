// Ein-Satz-Erklärung vom Coach bewerten lassen (POST /api/coach, mode "grade").
// Nur mit Coach-Zustimmung und wenn der Coach aktiv ist. Jede Störung → null, dann bewertet man sich selbst.
import { coachAvailable } from "./client";
import { hasCoachConsent } from "./consent";
import { COACH_LIMITS, type GradeVerdict } from "./types";

const ENDPOINT = "/api/coach";
const TIMEOUT_MS = 15_000;

export type GradeOutcome =
  | { kind: "coach"; verdict: GradeVerdict }
  /** reason: "consent" = keine Zustimmung (nichts gesendet), "off" = Coach nicht aktiv, "error" = Anfrage ging schief. */
  | { kind: "self"; reason: "consent" | "off" | "error" };

function verdictOf(x: unknown): GradeVerdict | null {
  if (!x || typeof x !== "object") return null;
  const v = x as Record<string, unknown>;
  if (typeof v.ok !== "boolean") return null;
  const s = (y: unknown) => (typeof y === "string" ? y.slice(0, 160) : "");
  return { ok: v.ok, missing: v.ok ? "" : s(v.missing), tip: s(v.tip) };
}

/** Bewertet `answer` zur Frage `id`. Sendet nichts ohne Zustimmung (`consent` überschreibbar für Tests). */
export async function gradeAnswer(
  id: string,
  answer: string,
  opts: { consent?: boolean; signal?: AbortSignal } = {},
): Promise<GradeOutcome> {
  const consent = opts.consent ?? hasCoachConsent();
  if (!consent) return { kind: "self", reason: "consent" };
  const text = answer.replace(/\s+/g, " ").trim().slice(0, COACH_LIMITS.maxAnswerChars);
  if (text.length < 2) return { kind: "self", reason: "error" };
  if (!(await coachAvailable())) return { kind: "self", reason: "off" };

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  const onAbort = () => ctrl.abort();
  opts.signal?.addEventListener("abort", onAbort);
  try {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ mode: "grade", id, answer: text }),
      signal: ctrl.signal,
    });
    if (!res.ok) return { kind: "self", reason: "error" };
    const verdict = verdictOf(await res.json());
    return verdict ? { kind: "coach", verdict } : { kind: "self", reason: "error" };
  } catch {
    return { kind: "self", reason: "error" };
  } finally {
    clearTimeout(timer);
    opts.signal?.removeEventListener("abort", onAbort);
  }
}
