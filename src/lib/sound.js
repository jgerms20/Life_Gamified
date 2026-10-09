// Tiny synthesised sound effects — no audio files to download.
let ctx = null;
let enabled = true;

export const setSoundEnabled = (v) => { enabled = v; };

function ac() {
  if (!ctx) {
    const C = window.AudioContext || window.webkitAudioContext;
    if (!C) return null;
    ctx = new C();
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function tone(freq, at, dur, { type = 'sine', gain = 0.07, slide = 0 } = {}) {
  const a = ac();
  if (!a) return;
  const t = a.currentTime + at;
  const osc = a.createOscillator();
  const g = a.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  if (slide) osc.frequency.exponentialRampToValueAtTime(freq * slide, t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(g).connect(a.destination);
  osc.start(t);
  osc.stop(t + dur + 0.05);
}

const play = (fn) => () => { if (enabled) { try { fn(); } catch { /* audio unavailable */ } } };

export const sfx = {
  tap: play(() => tone(880, 0, 0.05, { type: 'triangle', gain: 0.025 })),
  complete: play(() => [523.25, 659.25, 783.99].forEach((f, i) => tone(f, i * 0.07, 0.35, { type: 'triangle', gain: 0.06 }))),
  coin: play(() => { tone(1318, 0, 0.12, { type: 'square', gain: 0.025 }); tone(1760, 0.08, 0.25, { type: 'square', gain: 0.02 }); }),
  chest: play(() => [392, 523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(f, i * 0.06, 0.6, { gain: 0.05 }))),
  levelUp: play(() => {
    [[523.25, 0], [659.25, 0.12], [783.99, 0.24], [1046.5, 0.36]].forEach(([f, t]) => tone(f, t, 0.5, { type: 'sawtooth', gain: 0.035 }));
    [1046.5, 1318.5, 1568].forEach(f => tone(f, 0.55, 1.2, { type: 'triangle', gain: 0.04 }));
  }),
  fail: play(() => tone(196, 0, 0.5, { type: 'sawtooth', gain: 0.04, slide: 0.6 })),
  trophy: play(() => [783.99, 987.77, 1174.66].forEach((f, i) => tone(f, i * 0.09, 0.7, { type: 'triangle', gain: 0.05 }))),
};
