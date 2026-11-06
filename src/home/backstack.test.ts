import { describe, expect, it } from "vitest";
import { createBackStack, type HistoryLike } from "./backstack";

/** Kleine Browser-History: Einträge + Zeiger; go() feuert popstate über `onPop`. */
function fakeHistory() {
  const entries: unknown[] = [null];
  let at = 0;
  const pending: (() => void)[] = [];
  let onPop: (s: unknown) => void = () => {};
  const h: HistoryLike = {
    get state() { return entries[at]; },
    pushState(d) { entries.splice(at + 1); entries.push(d); at++; },
    replaceState(d) { entries[at] = d; },
    go(n) { at = Math.max(0, Math.min(entries.length - 1, at + n)); pending.push(() => onPop(entries[at])); },
  };
  const tasks: (() => void)[] = [];
  return {
    h, entries, get at() { return at; },
    defer: (f: () => void) => { tasks.push(f); },
    setPop(f: (s: unknown) => void) { onPop = f; },
    /** Microtasks, dann popstate-Ereignisse abarbeiten. */
    run() { while (tasks.length || pending.length) { while (tasks.length) tasks.shift()!(); while (pending.length) pending.shift()!(); } },
    back() { h.go(-1); },
  };
}

describe("Zurück-Taste: Ebenen in der History", () => {
  it("Zurück schließt die oberste Ebene, nicht die App", () => {
    const f = fakeHistory();
    const s = createBackStack(f.h, f.defer);
    f.setPop((st) => s.pop(st));
    const closed: string[] = [];
    s.push(() => closed.push("tab"));
    s.push(() => closed.push("tag"));
    expect(f.at).toBe(2);
    f.back(); f.run();
    expect(closed).toEqual(["tag"]);
    f.back(); f.run();
    expect(closed).toEqual(["tag", "tab"]);
    expect(f.at).toBe(0);
  });

  it("Zurück-Knopf in der App entfernt den Eintrag still (kein doppeltes Schließen)", () => {
    const f = fakeHistory();
    const s = createBackStack(f.h, f.defer);
    f.setPop((st) => s.pop(st));
    const closed: string[] = [];
    s.push(() => closed.push("a"));
    const b = s.push(() => closed.push("b"));
    s.drop(b); f.run();
    expect(f.at).toBe(1);
    expect(closed).toEqual([]);
    f.back(); f.run();
    expect(closed).toEqual(["a"]);
  });

  it("Wechsel von einem Unterbildschirm zum nächsten ersetzt den Eintrag", () => {
    const f = fakeHistory();
    const s = createBackStack(f.h, f.defer);
    f.setPop((st) => s.pop(st));
    const a = s.push(() => {});
    s.drop(a);
    s.push(() => {});
    f.run();
    expect(f.at).toBe(1);
    expect(s.depth).toBe(1);
  });

  it("alte Einträge von vor dem Neuladen werden übersprungen", () => {
    const f = fakeHistory();
    f.h.pushState({ mkLayer: 1 }, "");
    f.h.pushState({ mkLayer: 2 }, "");
    const s = createBackStack(f.h, f.defer);
    f.setPop((st) => s.pop(st));
    f.back(); f.run();
    expect(f.at).toBe(0);
  });
});
