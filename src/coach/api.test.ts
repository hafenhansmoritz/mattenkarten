// api/coach.ts lokal mit gemocktem fetch (kein echter API-Key, keine echte Anfrage an Anthropic).
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import handler, { verdictFrom } from "../../api/coach";
import { GRADE_ITEMS } from "../../api/_catalog";

type Res = {
  statusCode: number; headers: Record<string, string>; body: unknown; chunks: string[]; ended: boolean;
  status(n: number): Res; setHeader(k: string, v: string): Res; json(b: unknown): Res; write(s: string): void; end(): void;
};

function mkRes(): Res {
  const r: Res = {
    statusCode: 0, headers: {}, body: undefined, chunks: [], ended: false,
    status(n) { r.statusCode = n; return r; },
    setHeader(k, v) { r.headers[k.toLowerCase()] = v; return r; },
    json(b) { r.body = b; r.ended = true; return r; },
    write(s) { r.chunks.push(s); },
    end() { r.ended = true; },
  };
  return r;
}

let ipN = 0;
function mkReq(body: unknown, method = "POST", extra: Record<string, string> = {}) {
  const ip = `203.0.113.${++ipN}`;
  return {
    ip,
    req: {
      method, body,
      headers: { origin: "http://localhost:4185", host: "localhost:4185", "x-forwarded-for": ip, "user-agent": "Test/1.0", cookie: "a=b", ...extra },
      socket: { remoteAddress: ip },
      on: () => undefined,
    },
  };
}

const run = async (body: unknown, method = "POST", extra?: Record<string, string>) => {
  const { req, ip } = mkReq(body, method, extra);
  const res = mkRes();
  await handler(req as never, res as never);
  return { res, ip };
};

function sse(texts: string[]): Response {
  const enc = new TextEncoder();
  const lines = texts.map((t) => `event: content_block_delta\ndata: ${JSON.stringify({ type: "content_block_delta", delta: { type: "text_delta", text: t } })}\n\n`);
  return new Response(new ReadableStream({ start(c) { for (const l of lines) c.enqueue(enc.encode(l)); c.close(); } }), { status: 200 });
}
const jsonMsg = (text: string) => new Response(JSON.stringify({ content: [{ type: "text", text }] }), { status: 200 });

const fetchMock = vi.fn();
const GRADE_ID = Object.keys(GRADE_ITEMS)[0];

beforeEach(() => {
  vi.stubEnv("ANTHROPIC_API_KEY", "test-key-not-real");
  vi.stubGlobal("fetch", fetchMock);
  fetchMock.mockReset();
  vi.spyOn(console, "error").mockImplementation(() => undefined);
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("api/coach – ohne Key (Produktion noch nicht eingerichtet)", () => {
  it("GET meldet hasKey:false, POST 503 no_key, ohne Anfrage an Anthropic", async () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "");
    const g = await run(undefined, "GET");
    expect(g.res.body).toEqual({ ok: true, hasKey: false });
    const p = await run({ mode: "grade", id: GRADE_ID, answer: "Weil der Rahmen schützt." });
    expect(p.res.statusCode).toBe(503);
    expect(p.res.body).toEqual({ error: "no_key" });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("api/coach – chat (Streaming)", () => {
  it("streamt Text und leitet keine Nutzer-IP oder -Header weiter", async () => {
    fetchMock.mockResolvedValueOnce(sse(["Hallo ", "Weißgurt!"]));
    const { res, ip } = await run({ mode: "chat", messages: [{ role: "user", content: "Was ist ein Sprawl?" }] });
    expect(res.statusCode).toBe(200);
    expect(res.chunks.join("")).toBe("Hallo Weißgurt!");
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.anthropic.com/v1/messages");
    expect(Object.keys(init.headers).sort()).toEqual(["anthropic-version", "content-type", "x-api-key"]);
    expect(init.body).not.toContain(ip);
    expect(init.body).not.toContain("Test/1.0");
    const body = JSON.parse(init.body);
    expect(body.model).toBe("claude-haiku-5-5");
    expect(body.stream).toBe(true);
    expect(body.system[0].text).toContain("IBJJF Weißgurt");
    expect(body.system[0].text).toContain("[nd_sprawl]");
  });

  it("Größenlimits bleiben: zu viele / zu lange Nachrichten → 400, nichts gesendet", async () => {
    const many = Array.from({ length: 13 }, (_, i) => ({ role: i % 2 ? "assistant" : "user", content: "x" }));
    expect((await run({ mode: "chat", messages: many })).res.body).toEqual({ error: "too_many_messages" });
    expect((await run({ mode: "chat", messages: [{ role: "user", content: "x".repeat(4001) }] })).res.body).toEqual({ error: "message_too_long" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("fremde Herkunft → 403", async () => {
    const { res } = await run({ mode: "chat", messages: [{ role: "user", content: "hi" }] }, "POST", { origin: "https://evil.example" });
    expect(res.statusCode).toBe(403);
  });
});

describe("api/coach – grade (Ein-Satz-Erklärung)", () => {
  it("gibt JSON {ok, missing, tip} zurück, nicht gestreamt, mit Frage und Kernpunkten im Prompt", async () => {
    fetchMock.mockResolvedValueOnce(jsonMsg('Hier: {"ok": false, "missing": "Der Rahmen schützt vor Armhebeln.", "tip": "Denk an die Arme."}'));
    const { res, ip } = await run({ mode: "grade", id: GRADE_ID, answer: "  Damit ich\nrauskomme. " });
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ ok: false, missing: "Der Rahmen schützt vor Armhebeln.", tip: "Denk an die Arme." });
    const init = fetchMock.mock.calls[0][1];
    const body = JSON.parse(init.body);
    expect(body.stream).toBeUndefined();
    expect(body.max_tokens).toBeLessThanOrEqual(200);
    expect(body.system.at(-1).text).toContain("JSON");
    const msg = body.messages[0].content as string;
    expect(msg).toContain(GRADE_ITEMS[GRADE_ID].q);
    for (const p of GRADE_ITEMS[GRADE_ID].points) expect(msg).toContain(p);
    expect(msg).toContain('"""Damit ich rauskomme."""');
    expect(init.body).not.toContain(ip);
  });

  it("nur bekannte Fragen, Antwort ≤ 300 Zeichen", async () => {
    expect((await run({ mode: "grade", id: "q-pos-best", answer: "irgendwas" })).res.body).toEqual({ error: "unknown_question" });
    expect((await run({ mode: "grade", id: "__proto__", answer: "irgendwas" })).res.body).toEqual({ error: "unknown_question" });
    expect((await run({ mode: "grade", id: GRADE_ID, answer: "x".repeat(301) })).res.body).toEqual({ error: "answer_too_long" });
    expect((await run({ mode: "grade", id: GRADE_ID, answer: 42 })).res.body).toEqual({ error: "bad_request" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("unbrauchbare Modellantwort oder Upstream-Fehler → 502 (Client bewertet dann selbst)", async () => {
    fetchMock.mockResolvedValueOnce(jsonMsg("Das war gut!"));
    expect((await run({ mode: "grade", id: GRADE_ID, answer: "Weil es schützt." })).res).toMatchObject({ statusCode: 502, body: { error: "upstream" } });
    fetchMock.mockResolvedValueOnce(new Response("overloaded", { status: 529 }));
    expect((await run({ mode: "grade", id: GRADE_ID, answer: "Weil es schützt." })).res.statusCode).toBe(502);
    fetchMock.mockRejectedValueOnce(new Error("netz"));
    expect((await run({ mode: "grade", id: GRADE_ID, answer: "Weil es schützt." })).res.statusCode).toBe(502);
  });
});

describe("verdictFrom", () => {
  it("liest JSON robust, kürzt Felder, leert missing bei ok", () => {
    expect(verdictFrom('{"ok":true,"missing":"egal","tip":"Super"}')).toEqual({ ok: true, missing: "", tip: "Super" });
    expect(verdictFrom('```json\n{"ok":false,"missing":"' + "a".repeat(400) + '","tip":1}\n```')?.missing.length).toBe(160);
    expect(verdictFrom('{"ok":"ja"}')).toBeNull();
    expect(verdictFrom("kein json")).toBeNull();
  });
});
