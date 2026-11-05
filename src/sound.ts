// Synthetisierte Sounds (WebAudio) – keine Dateien nötig. Startet erst nach einer Interaktion.
import { useGame } from "./store";

let ctx: AudioContext | null = null;
function ac(): AudioContext | null {
  if (!useGame.getState().sound) return null;
  try {
    if (!ctx) ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    if (ctx.state === "suspended") void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function tone(freq: number, dur: number, type: OscillatorType = "sine", gain = 0.12, delay = 0, slide = 0) {
  const a = ac(); if (!a) return;
  const t = a.currentTime + delay;
  const o = a.createOscillator(); const g = a.createGain();
  o.type = type; o.frequency.setValueAtTime(freq, t);
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, freq + slide), t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(a.destination); o.start(t); o.stop(t + dur + 0.02);
}

function noise(dur: number, gain = 0.25, lowpass = 900, delay = 0) {
  const a = ac(); if (!a) return;
  const t = a.currentTime + delay;
  const buf = a.createBuffer(1, Math.floor(a.sampleRate * dur), a.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length) ** 2;
  const src = a.createBufferSource(); src.buffer = buf;
  const f = a.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = lowpass;
  const g = a.createGain(); g.gain.value = gain;
  src.connect(f).connect(g).connect(a.destination); src.start(t);
}

export const sfx = {
  select: () => tone(660, 0.06, "triangle", 0.06),
  flip: () => { noise(0.08, 0.12, 3000); tone(420, 0.08, "triangle", 0.05, 0.02, 200); },
  hit: () => { noise(0.22, 0.4, 700); tone(110, 0.25, "sine", 0.25, 0, -50); },
  counter: () => { tone(880, 0.07, "square", 0.05); tone(1320, 0.1, "square", 0.04, 0.06); },
  points: () => [523, 659, 784].forEach((f, i) => tone(f, 0.14, "triangle", 0.08, i * 0.07)),
  tap: () => { noise(0.05, 0.3, 1600); noise(0.05, 0.3, 1600, 0.12); noise(0.05, 0.3, 1600, 0.24); },
  win: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.22, "triangle", 0.09, i * 0.1)),
  lose: () => [392, 330, 262].forEach((f, i) => tone(f, 0.25, "sine", 0.08, i * 0.12)),
};
