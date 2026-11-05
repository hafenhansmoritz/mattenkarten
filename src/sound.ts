// Synthetisierte Sounds (WebAudio) – keine Dateien nötig. Startet erst nach einer Interaktion.
// Jeder sfx-Aufruf löst auch das passende haptische Feedback aus (siehe haptics.ts).
import { useGame } from "./store";
import { haptic } from "./haptics";

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let comp: DynamicsCompressorNode | null = null;
/** Standard: an, aber leise (Lernspiel, oft unterwegs). Stumm über den Schalter in „Mehr“ (Store: sound). */
let volume = 0.55;
const noiseCache = new Map<string, AudioBuffer>();

function soundOn(): boolean {
  try {
    return useGame.getState().sound !== false;
  } catch {
    return true;
  }
}

function ac(): AudioContext | null {
  if (typeof window === "undefined" || !soundOn()) return null;
  try {
    if (!ctx) {
      const Ctor = window.AudioContext || (window as any).webkitAudioContext;
      if (!Ctor) return null;
      ctx = new Ctor() as AudioContext;
      comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -14; comp.knee.value = 12; comp.ratio.value = 4;
      comp.attack.value = 0.003; comp.release.value = 0.15;
      master = ctx.createGain();
      master.gain.value = volume;
      master.connect(comp).connect(ctx.destination);
    }
    if (ctx.state === "suspended") void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function out(): AudioNode {
  return master ?? ctx!.destination;
}

/** Master-Lautstärke 0..1 */
export function setVolume(v: number): void {
  volume = Math.max(0, Math.min(1, v));
  if (master && ctx) master.gain.setTargetAtTime(volume, ctx.currentTime, 0.02);
}
export function getVolume(): number {
  return volume;
}
/** Optional bei erster Interaktion aufrufen, um iOS-Audio zu entsperren. */
export function unlockAudio(): void {
  const a = ac(); if (!a) return;
  const b = a.createBuffer(1, 1, a.sampleRate);
  const s = a.createBufferSource(); s.buffer = b; s.connect(out()); s.start();
}

// ---------- Bausteine ----------

function env(g: GainNode, t: number, peak: number, attack: number, dur: number) {
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
}

function tone(freq: number, dur: number, type: OscillatorType = "sine", gain = 0.12, delay = 0, slide = 0, attack = 0.008) {
  const a = ac(); if (!a) return;
  const t = a.currentTime + delay;
  const o = a.createOscillator(); const g = a.createGain();
  o.type = type; o.frequency.setValueAtTime(freq, t);
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), t + dur);
  env(g, t, gain, attack, dur);
  o.connect(g).connect(out()); o.start(t); o.stop(t + dur + 0.03);
}

function noiseBuf(a: AudioContext, kind: "white" | "pink"): AudioBuffer {
  const key = kind;
  const hit = noiseCache.get(key); if (hit) return hit;
  const len = Math.floor(a.sampleRate * 2);
  const buf = a.createBuffer(1, len, a.sampleRate);
  const d = buf.getChannelData(0);
  if (kind === "white") {
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  } else {
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + w * 0.0555179; b1 = 0.99332 * b1 + w * 0.0750759;
      b2 = 0.969 * b2 + w * 0.153852; b3 = 0.8665 * b3 + w * 0.3104856;
      b4 = 0.55 * b4 + w * 0.5329522; b5 = -0.7616 * b5 - w * 0.016898;
      d[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11;
      b6 = w * 0.115926;
    }
  }
  noiseCache.set(key, buf);
  return buf;
}

interface NoiseOpts {
  dur: number; gain?: number; delay?: number; attack?: number;
  type?: BiquadFilterType; freq?: number; freqTo?: number; q?: number; kind?: "white" | "pink";
}
function noise({ dur, gain = 0.25, delay = 0, attack = 0.004, type = "lowpass", freq = 900, freqTo, q = 0.8, kind = "white" }: NoiseOpts) {
  const a = ac(); if (!a) return;
  const t = a.currentTime + delay;
  const src = a.createBufferSource(); src.buffer = noiseBuf(a, kind);
  const f = a.createBiquadFilter(); f.type = type; f.Q.value = q;
  f.frequency.setValueAtTime(freq, t);
  if (freqTo) f.frequency.exponentialRampToValueAtTime(freqTo, t + dur);
  const g = a.createGain(); env(g, t, gain, attack, dur);
  src.connect(f).connect(g).connect(out());
  src.start(t, Math.random() * 1.5); src.stop(t + dur + 0.03);
}

/** Tiefer "Körper auf Matte"-Kick: Sinus mit schnellem Pitch-Drop. */
function thump(delay = 0, gain = 0.5, from = 150, to = 42, dur = 0.32) {
  const a = ac(); if (!a) return;
  const t = a.currentTime + delay;
  const o = a.createOscillator(); const g = a.createGain();
  o.type = "sine";
  o.frequency.setValueAtTime(from, t);
  o.frequency.exponentialRampToValueAtTime(to, t + dur * 0.6);
  env(g, t, gain, 0.004, dur);
  o.connect(g).connect(out()); o.start(t); o.stop(t + dur + 0.03);
}

// ---------- Öffentliche API ----------

export const sfx = {
  select: () => {
    haptic.select();
    tone(660, 0.06, "triangle", 0.06);
    tone(1320, 0.04, "sine", 0.02, 0.005);
  },
  /** Karten-Flip: Luftzug (Bandpass-Sweep) + leichter Klick. */
  flip: () => {
    haptic.tap();
    noise({ dur: 0.16, gain: 0.16, type: "bandpass", freq: 600, freqTo: 4200, q: 1.2, attack: 0.03 });
    noise({ dur: 0.025, gain: 0.08, type: "highpass", freq: 3500, delay: 0.13 });
    tone(380, 0.09, "triangle", 0.035, 0.02, 260);
  },
  /** Takedown/Treffer: geschichteter Matten-Thump – Sub + Body + Klatsch + Nachrumpeln. */
  hit: () => {
    haptic.hit();
    thump(0, 0.55, 140, 40, 0.38);              // Sub
    thump(0, 0.22, 260, 90, 0.14);              // Body-Punch
    noise({ dur: 0.07, gain: 0.35, type: "bandpass", freq: 1800, q: 0.7 }); // Klatsch
    noise({ dur: 0.35, gain: 0.22, type: "lowpass", freq: 520, freqTo: 120, kind: "pink", delay: 0.01 }); // Matte
    thump(0.09, 0.12, 90, 45, 0.18);            // Nachfedern
  },
  counter: () => {
    haptic.select();
    noise({ dur: 0.05, gain: 0.12, type: "highpass", freq: 2500 });
    tone(880, 0.07, "square", 0.045);
    tone(1320, 0.11, "square", 0.04, 0.06);
    tone(1760, 0.08, "sine", 0.03, 0.1);
  },
  points: () => {
    haptic.tap();
    [523, 659, 784].forEach((f, i) => {
      tone(f, 0.16, "triangle", 0.08, i * 0.07);
      tone(f * 2, 0.1, "sine", 0.025, i * 0.07 + 0.01);
    });
  },
  /** Abklopfen: drei schnelle Klapse mit der flachen Hand (Matte/Körper). */
  tap: () => {
    haptic.error();
    [0, 0.11, 0.22].forEach((d, i) => {
      noise({ dur: 0.055, gain: 0.3 - i * 0.03, type: "bandpass", freq: 1500 - i * 80, q: 0.9, delay: d });
      thump(d, 0.12, 190, 80, 0.07);
    });
  },
  /** Leiser, weicher Klick (Karte wählen). */
  click: () => {
    haptic.tap();
    noise({ dur: 0.018, gain: 0.07, type: "bandpass", freq: 2600, q: 2.5 });
    tone(520, 0.045, "sine", 0.035, 0.002, -80, 0.003);
  },
  /** Positionswechsel: dumpfer Körper auf der Matte, ohne Klatschen. */
  mat: () => {
    haptic.hit();
    thump(0, 0.42, 120, 38, 0.42);
    noise({ dur: 0.28, gain: 0.2, type: "lowpass", freq: 420, freqTo: 90, kind: "pink", attack: 0.008 });
    noise({ dur: 0.05, gain: 0.06, type: "bandpass", freq: 900, q: 0.6, delay: 0.005 });
    thump(0.1, 0.08, 80, 40, 0.16);
  },
  /** Atem ausgeben: hörbares Ausatmen (gefiltertes Rauschen, fällt ab). */
  breath: () => {
    noise({ dur: 0.55, gain: 0.09, type: "bandpass", freq: 1300, freqTo: 520, q: 0.7, kind: "pink", attack: 0.12 });
    noise({ dur: 0.45, gain: 0.04, type: "highpass", freq: 3200, attack: 0.1, delay: 0.03 });
  },
  /** Gong zu Kampfbeginn und -ende: unharmonische Teiltöne, langer Ausklang. */
  gong: () => {
    const f = 98;
    [[1, 0.09, 2.6], [2.02, 0.05, 2.0], [2.76, 0.04, 1.7], [4.07, 0.025, 1.2], [5.4, 0.015, 0.9]].forEach(([m, g, d]) =>
      tone(f * m, d, "sine", g, 0, -f * m * 0.012, 0.006));
    noise({ dur: 0.08, gain: 0.05, type: "bandpass", freq: 700, q: 1.2 });
  },
  /** Sieg: Fanfare + Publikums-Anschwellen aus gefiltertem Rauschen. */
  win: () => {
    haptic.win();
    // Crowd-Swell: Pink-Noise durch zwei Bandpässe ("Stimmen"-Formanten), langsam an/ab
    noise({ dur: 1.9, gain: 0.16, type: "bandpass", freq: 500, freqTo: 900, q: 0.9, kind: "pink", attack: 0.6 });
    noise({ dur: 1.7, gain: 0.08, type: "bandpass", freq: 1600, freqTo: 2400, q: 1.4, kind: "pink", attack: 0.5, delay: 0.1 });
    // Klatschen
    for (let i = 0; i < 9; i++) {
      noise({ dur: 0.03, gain: 0.05 + Math.random() * 0.04, type: "bandpass", freq: 1200 + Math.random() * 1400, q: 1.5, delay: 0.35 + i * 0.11 + Math.random() * 0.05 });
    }
    [523, 659, 784, 1047].forEach((f, i) => {
      tone(f, 0.24, "triangle", 0.09, i * 0.1);
      tone(f / 2, 0.24, "sine", 0.04, i * 0.1);
    });
    tone(1047, 0.7, "triangle", 0.07, 0.42);
    tone(1319, 0.7, "sine", 0.04, 0.42);
  },
  lose: () => {
    haptic.error();
    [392, 330, 262].forEach((f, i) => tone(f, 0.28, "sine", 0.08, i * 0.13, -12));
    tone(196, 0.6, "triangle", 0.05, 0.39, -40);
    noise({ dur: 0.9, gain: 0.05, type: "lowpass", freq: 400, freqTo: 150, kind: "pink", attack: 0.2, delay: 0.1 });
  },
};
