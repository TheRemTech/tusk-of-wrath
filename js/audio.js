/** Lightweight procedural audio — no asset files */

let ctx = null;
let master = null;
let musicNodes = [];
let musicOn = false;

export function unlockAudio() {
  if (!ctx) {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createGain();
    master.gain.value = 0.28;
    master.connect(ctx.destination);
  }
  if (ctx.state === "suspended") ctx.resume();
}

function beep(freq, dur, type = "square", gain = 0.08, slide = 0) {
  if (!ctx) return;
  const t = ctx.currentTime;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, freq + slide), t + dur);
  g.gain.setValueAtTime(gain, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  o.connect(g);
  g.connect(master);
  o.start(t);
  o.stop(t + dur + 0.02);
}

function noise(dur, gain = 0.05) {
  if (!ctx) return;
  const t = ctx.currentTime;
  const buffer = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  const g = ctx.createGain();
  const f = ctx.createBiquadFilter();
  f.type = "lowpass";
  f.frequency.value = 900;
  g.gain.setValueAtTime(gain, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  src.connect(f);
  f.connect(g);
  g.connect(master);
  src.start(t);
  src.stop(t + dur);
}

export const sfx = {
  jump: () => beep(180, 0.08, "triangle", 0.05, 120),
  slam: () => {
    noise(0.12, 0.07);
    beep(90, 0.1, "sawtooth", 0.06, -40);
  },
  shoot: () => beep(520, 0.05, "square", 0.04, -200),
  knife: () => beep(880, 0.06, "triangle", 0.045, -300),
  fire: () => {
    noise(0.25, 0.06);
    beep(140, 0.2, "sawtooth", 0.05, -80);
  },
  hit: () => beep(120, 0.07, "square", 0.05, -60),
  hurt: () => beep(220, 0.15, "sawtooth", 0.06, -150),
  pickup: () => {
    beep(523, 0.07, "triangle", 0.05);
    setTimeout(() => beep(659, 0.08, "triangle", 0.05), 60);
    setTimeout(() => beep(784, 0.1, "triangle", 0.05), 120);
  },
  starUp: () => {
    beep(400, 0.06, "square", 0.05);
    setTimeout(() => beep(600, 0.08, "square", 0.05), 70);
  },
  mission: () => {
    beep(330, 0.1, "triangle", 0.06);
    setTimeout(() => beep(440, 0.1, "triangle", 0.06), 100);
    setTimeout(() => beep(554, 0.18, "triangle", 0.07), 200);
  },
  charge: () => beep(70, 0.25, "sawtooth", 0.07, 40),
  boom: () => {
    noise(0.35, 0.1);
    beep(60, 0.3, "sine", 0.08, -30);
  },
};

export function startMusic() {
  unlockAudio();
  if (musicOn || !ctx) return;
  musicOn = true;
  const t0 = ctx.currentTime + 0.05;
  const bass = ctx.createOscillator();
  const bassGain = ctx.createGain();
  bass.type = "triangle";
  bass.frequency.value = 55;
  bassGain.gain.value = 0.035;
  bass.connect(bassGain);
  bassGain.connect(master);
  bass.start(t0);

  const pulse = ctx.createOscillator();
  const pulseGain = ctx.createGain();
  pulse.type = "square";
  pulse.frequency.value = 110;
  pulseGain.gain.value = 0.012;
  pulse.connect(pulseGain);
  pulseGain.connect(master);
  pulse.start(t0);

  // Simple LFO-ish volume pulse via scheduled automation
  const loop = () => {
    if (!musicOn || !ctx) return;
    const t = ctx.currentTime;
    pulseGain.gain.cancelScheduledValues(t);
    pulseGain.gain.setValueAtTime(0.004, t);
    pulseGain.gain.linearRampToValueAtTime(0.018, t + 0.18);
    pulseGain.gain.linearRampToValueAtTime(0.004, t + 0.36);
    bass.frequency.setValueAtTime(55, t);
    bass.frequency.setValueAtTime(73, t + 0.72);
    bass.frequency.setValueAtTime(65, t + 1.44);
    bass.frequency.setValueAtTime(55, t + 2.16);
    setTimeout(loop, 2880);
  };
  loop();
  musicNodes = [bass, pulse, bassGain, pulseGain];
}

export function stopMusic() {
  musicOn = false;
  for (const n of musicNodes) {
    try {
      n.stop?.();
      n.disconnect?.();
    } catch {
      /* ignore */
    }
  }
  musicNodes = [];
}
