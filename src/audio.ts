/* Web Audio API sound system — all sounds generated procedurally */

let ctx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let musicGain: GainNode | null = null;
let musicOsc1: OscillatorNode | null = null;
let musicOsc2: OscillatorNode | null = null;
let musicLfo: OscillatorNode | null = null;
let musicPlaying = false;

function getCtx() {
  if (!ctx) {
    ctx = new AudioContext();
    masterGain = ctx.createGain();
    masterGain.gain.value = 0.3;
    masterGain.connect(ctx.destination);
    musicGain = ctx.createGain();
    musicGain.gain.value = 0.08;
    musicGain.connect(masterGain);
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function disconnectNode(node: AudioNode | null | undefined) {
  try {
    node?.disconnect();
  } catch {
    // Ignore already-disconnected nodes.
  }
}

function playTone(freq: number, dur: number, type: OscillatorType = 'square', vol = 0.15, delay = 0) {
  const c = getCtx();
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  g.gain.setValueAtTime(0, c.currentTime + delay);
  g.gain.linearRampToValueAtTime(vol, c.currentTime + delay + 0.01);
  g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + delay + dur);
  osc.connect(g);
  g.connect(masterGain!);
  osc.onended = () => {
    disconnectNode(osc);
    disconnectNode(g);
  };
  osc.start(c.currentTime + delay);
  osc.stop(c.currentTime + delay + dur + 0.05);
}

function playNoise(dur: number, vol = 0.1, delay = 0) {
  const c = getCtx();
  const bufSize = Math.floor(c.sampleRate * dur);
  const buf = c.createBuffer(1, bufSize, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;
  const src = c.createBufferSource();
  src.buffer = buf;
  const g = c.createGain();
  g.gain.setValueAtTime(vol, c.currentTime + delay);
  g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + delay + dur);
  const filt = c.createBiquadFilter();
  filt.type = 'lowpass';
  filt.frequency.value = 800;
  src.connect(filt);
  filt.connect(g);
  g.connect(masterGain!);
  src.onended = () => {
    disconnectNode(src);
    disconnectNode(filt);
    disconnectNode(g);
  };
  src.start(c.currentTime + delay);
}

export function playHop() {
  playTone(400, 0.08, 'sine', 0.12);
  playTone(520, 0.06, 'sine', 0.08, 0.03);
}

export function playSplash() {
  playNoise(0.4, 0.15);
  playTone(200, 0.3, 'sine', 0.06);
  playTone(150, 0.2, 'sine', 0.04, 0.1);
}

export function playCrash() {
  playNoise(0.25, 0.2);
  playTone(120, 0.2, 'sawtooth', 0.08);
  playTone(80, 0.3, 'sawtooth', 0.06, 0.05);
}

export function playGoalReached() {
  const notes = [523, 659, 784, 1047];
  notes.forEach((n, i) => playTone(n, 0.2, 'sine', 0.12, i * 0.1));
}

export function playLevelComplete() {
  const notes = [523, 659, 784, 1047, 1319, 1568];
  notes.forEach((n, i) => playTone(n, 0.25, 'triangle', 0.1, i * 0.12));
  playTone(1568, 0.6, 'sine', 0.08, 0.72);
}

export function playGameOver() {
  const notes = [400, 350, 300, 250, 200];
  notes.forEach((n, i) => playTone(n, 0.3, 'sawtooth', 0.08, i * 0.2));
}

export function playScore() {
  playTone(880, 0.05, 'sine', 0.06);
}

/* ── Background music — simple ambient melody loop ── */
const MELODY_NOTES = [
  262, 294, 330, 349, 392, 349, 330, 294,
  262, 330, 392, 523, 392, 330, 294, 262,
  349, 392, 440, 523, 440, 392, 349, 330,
  294, 330, 392, 440, 392, 330, 294, 262,
];

let melodyInterval: ReturnType<typeof setInterval> | null = null;
let melodyIdx = 0;
let ambientOsc: OscillatorNode | null = null;

export function startMusic() {
  if (musicPlaying) return;
  musicPlaying = true;
  const c = getCtx();

  // Ambient pad
  ambientOsc = c.createOscillator();
  ambientOsc.type = 'sine';
  ambientOsc.frequency.value = 131;
  const ambG = c.createGain();
  ambG.gain.value = 0.03;
  const ambFilt = c.createBiquadFilter();
  ambFilt.type = 'lowpass';
  ambFilt.frequency.value = 200;
  ambientOsc.connect(ambFilt);
  ambFilt.connect(ambG);
  ambG.connect(masterGain!);
  ambientOsc.start();

  // LFO for ambient wobble
  musicLfo = c.createOscillator();
  musicLfo.type = 'sine';
  musicLfo.frequency.value = 0.3;
  const lfoGain = c.createGain();
  lfoGain.gain.value = 8;
  musicLfo.connect(lfoGain);
  lfoGain.connect(ambientOsc.frequency);
  musicLfo.start();

  // Melody loop
  melodyIdx = 0;
  melodyInterval = setInterval(() => {
    if (!musicPlaying) return;
    const note = MELODY_NOTES[melodyIdx % MELODY_NOTES.length];
    const c2 = getCtx();
    const osc = c2.createOscillator();
    osc.type = 'triangle';
    osc.frequency.value = note * 0.5; // lower octave
    const g = c2.createGain();
    g.gain.setValueAtTime(0.04, c2.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, c2.currentTime + 0.4);
    osc.connect(g);
    g.connect(musicGain!);
    osc.start();
    osc.stop(c2.currentTime + 0.5);

    // harmony
    const osc2 = c2.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.value = note * 0.25;
    const g2 = c2.createGain();
    g2.gain.setValueAtTime(0.02, c2.currentTime);
    g2.gain.exponentialRampToValueAtTime(0.001, c2.currentTime + 0.5);
    osc2.connect(g2);
    g2.connect(musicGain!);
    osc2.start();
    osc2.stop(c2.currentTime + 0.6);

    melodyIdx++;
  }, 500);
}

export function stopMusic() {
  musicPlaying = false;
  if (melodyInterval) { clearInterval(melodyInterval); melodyInterval = null; }
  try { ambientOsc?.stop(); } catch {}
  try { musicLfo?.stop(); } catch {}
  try { musicOsc1?.stop(); } catch {}
  try { musicOsc2?.stop(); } catch {}
  disconnectNode(ambientOsc);
  disconnectNode(musicLfo);
  disconnectNode(musicOsc1);
  disconnectNode(musicOsc2);
  ambientOsc = null; musicLfo = null; musicOsc1 = null; musicOsc2 = null;
}

export function initAudio() {
  getCtx();
}
