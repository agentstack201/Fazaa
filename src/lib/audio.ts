// Synthesized UI sounds via the Web Audio API — no audio files shipped.
let ctx: AudioContext | null = null;
let muted = false;

export const setMuted = (m: boolean) => { muted = m; };

function ac(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    const C = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!C) return null;
    ctx = new C();
  }
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

function tone(freq: number, start: number, dur: number, type: OscillatorType, gain: number, endFreq?: number) {
  const a = ac();
  if (!a || muted) return;
  const t0 = a.currentTime + start;
  const o = a.createOscillator();
  const g = a.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t0);
  if (endFreq) o.frequency.exponentialRampToValueAtTime(endFreq, t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g).connect(a.destination);
  o.start(t0);
  o.stop(t0 + dur + 0.02);
}

export const sfx = {
  click: () => tone(720, 0, 0.06, 'triangle', 0.18, 480),
  sos: () => {
    for (let i = 0; i < 3; i++) {
      tone(660, i * 0.32, 0.26, 'sine', 0.25, 990);
      tone(1320, i * 0.32 + 0.05, 0.18, 'sine', 0.06);
    }
  },
  step: () => {
    tone(523.25, 0, 0.16, 'sine', 0.22);
    tone(659.25, 0.1, 0.16, 'sine', 0.22);
    tone(783.99, 0.2, 0.3, 'sine', 0.22);
  },
};
