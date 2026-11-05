// Client-Seite der Ein-Satz-Bewertung: ohne Zustimmung nichts senden, bei jeder Störung selbst bewerten.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const fetchMock = vi.fn();
beforeEach(() => {
  vi.resetModules(); // coachAvailable() merkt sich den Status pro Sitzung
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});
afterEach(() => vi.unstubAllGlobals());

const status = (hasKey: boolean) => new Response(JSON.stringify({ ok: true, hasKey }), { status: 200 });
const load = async () => (await import("./grade")).gradeAnswer;

describe("gradeAnswer", () => {
  it("ohne Zustimmung: nichts senden, selbst bewerten", async () => {
    const grade = await load();
    expect(await grade("qe-mount-elbows", "Weil der Rahmen schützt.", { consent: false })).toEqual({ kind: "self", reason: "consent" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("ohne gespeicherte Zustimmung (kein localStorage) gilt: keine Zustimmung", async () => {
    const grade = await load();
    expect((await grade("qe-mount-elbows", "Weil der Rahmen schützt.")).kind).toBe("self");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("Coach nicht aktiv (kein API-Key in Produktion) → selbst bewerten, Antwort wird nicht gesendet", async () => {
    fetchMock.mockResolvedValueOnce(status(false));
    const grade = await load();
    expect(await grade("qe-mount-elbows", "Weil der Rahmen schützt.", { consent: true })).toEqual({ kind: "self", reason: "off" });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][1].method).toBe("GET");
  });

  it("Coach aktiv → Urteil vom Coach", async () => {
    fetchMock.mockResolvedValueOnce(status(true));
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ ok: true, missing: "", tip: "Genau so." }), { status: 200 }));
    const grade = await load();
    const out = await grade("qe-mount-elbows", "  Weil der   Rahmen schützt. ", { consent: true });
    expect(out).toEqual({ kind: "coach", verdict: { ok: true, missing: "", tip: "Genau so." } });
    const sent = JSON.parse(fetchMock.mock.calls[1][1].body);
    expect(sent).toEqual({ mode: "grade", id: "qe-mount-elbows", answer: "Weil der Rahmen schützt." });
  });

  it("Server-Fehler oder kaputte Antwort → selbst bewerten", async () => {
    fetchMock.mockResolvedValueOnce(status(true));
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ error: "upstream" }), { status: 502 }));
    fetchMock.mockResolvedValueOnce(new Response("{}", { status: 200 }));
    fetchMock.mockRejectedValueOnce(new TypeError("offline"));
    const grade = await load();
    for (let i = 0; i < 3; i++) expect(await grade("qe-mount-elbows", "Weil der Rahmen schützt.", { consent: true })).toEqual({ kind: "self", reason: "error" });
  });
});
