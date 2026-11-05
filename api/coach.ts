// Mattenkarten – KI-Coach (Vercel Node Function).
// GET  /api/coach  → { ok, hasKey }   (billig, für coachAvailable())
// POST /api/coach  { mode: "chat"|"analysis", messages?, match? } → text/plain, gestreamt
// POST /api/coach  { mode: "grade", id, answer } → JSON { ok, missing, tip } (Ein-Satz-Erklärung bewerten)
// Datenschutz: An Anthropic geht nur der Text (Katalog, Regeln, Frage/Antwort) – keine IP, keine Header des Nutzers.
// Env: ANTHROPIC_API_KEY (Pflicht), COACH_MODEL (optional), COACH_ALLOWED_ORIGINS (optional, kommagetrennt)
import type { VercelRequest, VercelResponse } from "@vercel/node";
import type { CoachMatchSummary, CoachMessage, CoachMode, GradeVerdict } from "../src/coach/types.js";
import { CATALOG, GRADE_ITEMS } from "./_catalog.js";
import { gradeMessage, systemBlocks } from "./_prompt.js";

const MODEL = process.env.COACH_MODEL || "claude-haiku-5-5";
const MAX_TOKENS = 400;
const MAX_MESSAGES = 12;
const MAX_CHARS = 4000;
const MAX_ANSWER_CHARS = 300;
const GRADE_MAX_TOKENS = 200;
const UPSTREAM_TIMEOUT_MS = 25_000;

// ------------------------------------------------------------------
// Validierung
// ------------------------------------------------------------------

class HttpError extends Error {
  constructor(public status: number, public code: string) {
    super(code);
  }
}

const clip = (v: unknown, n: number): string => (typeof v === "string" ? v.slice(0, n) : "");
const clipList = (v: unknown, items: number, n: number): string[] =>
  Array.isArray(v) ? v.slice(0, items).map((x) => clip(x, n)).filter(Boolean) : [];

function parseMessages(raw: unknown): CoachMessage[] {
  if (!Array.isArray(raw) || raw.length === 0) throw new HttpError(400, "bad_request");
  if (raw.length > MAX_MESSAGES) throw new HttpError(400, "too_many_messages");
  const out: CoachMessage[] = [];
  for (const m of raw) {
    if (!m || typeof m !== "object") throw new HttpError(400, "bad_request");
    const { role, content } = m as Record<string, unknown>;
    if ((role !== "user" && role !== "assistant") || typeof content !== "string") throw new HttpError(400, "bad_request");
    if (content.length > MAX_CHARS) throw new HttpError(400, "message_too_long");
    const text = content.trim();
    if (!text) continue;
    // Gleiche Rollen hintereinander zusammenfassen (API verlangt Wechsel)
    const last = out[out.length - 1];
    if (last && last.role === role) last.content += `\n\n${text}`;
    else out.push({ role, content: text });
  }
  while (out.length && out[0].role !== "user") out.shift();
  if (!out.length || out[out.length - 1].role !== "user") throw new HttpError(400, "bad_request");
  return out;
}

function summaryText(raw: unknown): string {
  if (!raw || typeof raw !== "object") throw new HttpError(400, "bad_request");
  const m = raw as Partial<Record<keyof CoachMatchSummary, unknown>>;
  const outcome = m.outcome === "sieg" || m.outcome === "niederlage" || m.outcome === "unentschieden" ? m.outcome : "unentschieden";
  const pts = (m.points && typeof m.points === "object" ? m.points : {}) as Record<string, unknown>;
  const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? Math.round(v) : 0);
  const lines = [
    `Ergebnis: ${outcome} – ${clip(m.how, 200)}`,
    m.opponent ? `Gegner: ${clip(m.opponent, 120)}` : "",
    `Züge: ${num(m.turns)}, Punkte: ich ${num(pts.me)} – Gegner ${num(pts.them)}`,
    "Verlauf:",
    ...clipList(m.moments, 14, 240).map((s) => `- ${s}`),
    "Erkenntnisse aus dem Spiel:",
    ...clipList(m.lessons, 3, 300).map((s) => `- ${s}`),
    m.decisive ? `Entscheidender Moment: ${clip(m.decisive, 400)}` : "",
    `Übungskarten-Kandidaten (ids): ${clipList(m.practice, 5, 40).join(", ") || "keine"}`,
  ].filter(Boolean);
  const text = lines.join("\n");
  if (text.length > MAX_CHARS) return text.slice(0, MAX_CHARS);
  return text;
}

function parseGrade(body: Record<string, unknown>): { id: string; answer: string } {
  const id = typeof body.id === "string" ? body.id : "";
  if (!Object.prototype.hasOwnProperty.call(GRADE_ITEMS, id)) throw new HttpError(400, "unknown_question");
  if (typeof body.answer !== "string") throw new HttpError(400, "bad_request");
  if (body.answer.length > MAX_ANSWER_CHARS) throw new HttpError(400, "answer_too_long");
  const answer = body.answer.replace(/\s+/g, " ").trim();
  if (answer.length < 2) throw new HttpError(400, "bad_request");
  return { id, answer };
}

/** Holt das erste JSON-Objekt aus der Modellantwort und prüft die Felder. null = unbrauchbar. */
export function verdictFrom(text: string): GradeVerdict | null {
  const a = text.indexOf("{");
  const b = text.lastIndexOf("}");
  if (a < 0 || b <= a) return null;
  try {
    const v = JSON.parse(text.slice(a, b + 1)) as Record<string, unknown>;
    if (typeof v.ok !== "boolean") return null;
    const str = (x: unknown) => (typeof x === "string" ? x.trim().slice(0, 160) : "");
    return { ok: v.ok, missing: v.ok ? "" : str(v.missing), tip: str(v.tip) };
  } catch {
    return null;
  }
}

// ------------------------------------------------------------------
// Herkunft & Missbrauchsschutz
// ------------------------------------------------------------------

function hostOf(url: string | undefined): string | null {
  if (!url) return null;
  try {
    return new URL(url).host.toLowerCase();
  } catch {
    return null;
  }
}

function originAllowed(req: VercelRequest): boolean {
  const origin = hostOf(header(req, "origin")) ?? hostOf(header(req, "referer"));
  if (!origin) return false; // Browser senden bei POST immer Origin
  const self = (header(req, "x-forwarded-host") ?? header(req, "host") ?? "").toLowerCase();
  if (origin === self) return true;
  const name = origin.split(":")[0];
  if (name.endsWith(".vercel.app")) return true;
  if (name === "localhost" || name === "127.0.0.1") return true;
  const extra = (process.env.COACH_ALLOWED_ORIGINS ?? "").split(",").map((s) => hostOf(s.trim()) ?? s.trim().toLowerCase());
  return extra.includes(origin);
}

function header(req: VercelRequest, name: string): string | undefined {
  const v = req.headers[name];
  return Array.isArray(v) ? v[0] : v;
}

// Best-Effort pro Instanz (Serverless: kein globaler Zustand). 20 Anfragen / 10 min / IP.
const WINDOW_MS = 10 * 60_000;
const MAX_PER_WINDOW = 20;
const hits = new Map<string, number[]>();

function rateLimited(req: VercelRequest): boolean {
  const ip = (header(req, "x-forwarded-for") ?? req.socket?.remoteAddress ?? "?").split(",")[0].trim();
  const now = Date.now();
  const list = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  list.push(now);
  hits.set(ip, list);
  if (hits.size > 5000) hits.clear();
  return list.length > MAX_PER_WINDOW;
}

// ------------------------------------------------------------------
// Handler
// ------------------------------------------------------------------

function fail(res: VercelResponse, status: number, error: string) {
  res.status(status).setHeader("Cache-Control", "no-store");
  res.json({ error });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const key = process.env.ANTHROPIC_API_KEY;

  if (req.method === "GET") {
    res.setHeader("Cache-Control", "no-store");
    res.status(200).json({ ok: true, hasKey: Boolean(key) });
    return;
  }
  if (req.method !== "POST") {
    res.setHeader("Allow", "GET, POST");
    fail(res, 405, "method_not_allowed");
    return;
  }
  if (!key) return fail(res, 503, "no_key");
  if (!originAllowed(req)) return fail(res, 403, "forbidden_origin");
  if (rateLimited(req)) return fail(res, 429, "rate_limited");

  let mode: CoachMode;
  let messages: CoachMessage[];
  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    if (!body || typeof body !== "object") throw new HttpError(400, "bad_request");
    if (body.mode === "analysis") {
      mode = "analysis";
      messages = [{ role: "user", content: `Hier ist mein Match:\n${summaryText(body.match)}` }];
    } else if (body.mode === "chat") {
      mode = "chat";
      messages = parseMessages(body.messages);
    } else if (body.mode === "grade") {
      mode = "grade";
      const g = parseGrade(body);
      messages = [{ role: "user", content: gradeMessage(GRADE_ITEMS[g.id], g.answer) }];
    } else {
      throw new HttpError(400, "bad_request");
    }
  } catch (e) {
    return fail(res, e instanceof HttpError ? e.status : 400, e instanceof HttpError ? e.code : "bad_request");
  }

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), UPSTREAM_TIMEOUT_MS);
  req.on("close", () => ctrl.abort()); // Client hat "Stopp" gedrückt
  const stream = mode !== "grade";

  let upstream: Response;
  try {
    // Nur diese drei Header – nichts vom Nutzer (keine IP, kein User-Agent, keine Cookies) wird weitergereicht.
    upstream = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      signal: ctrl.signal,
      headers: {
        "content-type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: stream ? MAX_TOKENS : GRADE_MAX_TOKENS,
        system: systemBlocks(mode, CATALOG),
        messages,
        ...(stream ? { stream: true } : {}),
      }),
    });
  } catch {
    clearTimeout(timer);
    return fail(res, 502, "upstream");
  }

  if (!upstream.ok || (stream && !upstream.body)) {
    clearTimeout(timer);
    const detail = await upstream.text().catch(() => "");
    console.error("coach upstream", upstream.status, detail.slice(0, 500));
    return fail(res, upstream.status === 429 ? 429 : 502, upstream.status === 429 ? "rate_limited" : "upstream");
  }

  if (!stream) {
    let verdict: GradeVerdict | null = null;
    try {
      const data = (await upstream.json()) as { content?: { type?: string; text?: string }[] };
      verdict = verdictFrom((data.content ?? []).filter((c) => c.type === "text").map((c) => c.text ?? "").join(""));
    } catch {
      verdict = null;
    } finally {
      clearTimeout(timer);
    }
    if (!verdict) return fail(res, 502, "upstream");
    res.status(200).setHeader("Cache-Control", "no-store");
    res.json(verdict);
    return;
  }

  // SSE der Anthropic-API → reiner Text-Stream an den Client
  res.status(200);
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Accel-Buffering", "no");

  const reader = upstream.body!.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      let nl: number;
      while ((nl = buf.indexOf("\n")) >= 0) {
        const line = buf.slice(0, nl).trim();
        buf = buf.slice(nl + 1);
        if (!line.startsWith("data:")) continue;
        const data = line.slice(5).trim();
        if (!data) continue;
        let ev: { type?: string; delta?: { type?: string; text?: string }; error?: { type?: string } };
        try {
          ev = JSON.parse(data);
        } catch {
          continue;
        }
        if (ev.type === "content_block_delta" && ev.delta?.type === "text_delta" && ev.delta.text) {
          res.write(ev.delta.text);
        } else if (ev.type === "error") {
          console.error("coach stream error", ev.error?.type);
          res.write("\n\n[Der Coach wurde unterbrochen. Versuch es gleich noch mal.]");
        }
      }
    }
  } catch {
    // Abbruch durch Client oder Timeout – einfach beenden
  } finally {
    clearTimeout(timer);
    res.end();
  }
}
