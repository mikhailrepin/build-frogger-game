/* Shared audio adapter for procedural game audio and streamed menu music. */

let ctx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let effectsGain: GainNode | null = null;
let musicGain: GainNode | null = null;
let musicLfo: OscillatorNode | null = null;
let musicLfoGain: GainNode | null = null;
let ambientOsc: OscillatorNode | null = null;
let ambientGain: GainNode | null = null;
let ambientFilter: BiquadFilterNode | null = null;
let musicPlaying = false;
const MASTER_GAIN_MAX = 0.3;
const MAIN_MENU_MUSIC_PATH = '/sounds/main-menu.mp3';
const MAIN_MENU_VOLUME_MAX = 0.45;
const MAX_DEFERRED_SOUND_MS = 250;
const AUDIBLE_SAMPLE_THRESHOLD = 0.004;
const AUDIBLE_TAIL_SECONDS = 0.08;

export type GameSoundId =
  | 'jump'
  | 'carPunch'
  | 'waterSplash'
  | 'goalReached'
  | 'bonusCollected'
  | 'levelComplete'
  | 'gameOver';

export type GameSoundGroup = 'death' | 'reward' | 'terminal';

export const GAME_SOUND_PATHS = {
  jump: '/sounds/jump.mp3',
  carPunch: '/sounds/car-punch.mp3',
  waterSplash: '/sounds/water-splash.mp3',
  goalReached: '/sounds/get-flower.mp3',
  bonusCollected: '/sounds/take-bonus.mp3',
  levelComplete: '/sounds/complete.mp3',
  gameOver: '/sounds/defeat.mp3',
} as const satisfies Record<GameSoundId, string>;

interface GameSoundConfig {
  volume: number;
  maxVoices: number;
  group?: GameSoundGroup;
  replaceGroup?: boolean;
}

const GAME_SOUND_CONFIG: Record<GameSoundId, GameSoundConfig> = {
  jump: { volume: 0.64, maxVoices: 4 },
  carPunch: { volume: 0.72, maxVoices: 1, group: 'death', replaceGroup: true },
  waterSplash: { volume: 0.9, maxVoices: 1, group: 'death', replaceGroup: true },
  goalReached: { volume: 0.82, maxVoices: 1, group: 'reward', replaceGroup: true },
  bonusCollected: { volume: 1, maxVoices: 2 },
  levelComplete: { volume: 0.82, maxVoices: 1, group: 'reward', replaceGroup: true },
  gameOver: { volume: 0.92, maxVoices: 1, group: 'terminal', replaceGroup: true },
};

interface ActiveGameSound {
  id: GameSoundId;
  source: AudioBufferSourceNode;
  gain: GainNode;
  group?: GameSoundConfig['group'];
  stopping: boolean;
}

interface ActiveMusicVoice {
  oscillator: OscillatorNode;
  gain: GainNode;
}

const gameSoundBuffers = new Map<GameSoundId, AudioBuffer>();
const gameSoundDurations = new Map<GameSoundId, number>();
const gameSoundLoadPromises = new Map<GameSoundId, Promise<AudioBuffer | null>>();
const activeGameSounds = new Map<GameSoundId, Set<ActiveGameSound>>();
const activeGameSoundGroups = new Map<GameSoundGroup, Set<ActiveGameSound>>();
const activeMusicVoices = new Set<ActiveMusicVoice>();
const warnedSoundLoads = new Set<GameSoundId>();

export const AUDIO_VOLUME_LEVELS = 4;
export const MIN_AUDIO_VOLUME_LEVEL = 0;
export const DEFAULT_AUDIO_VOLUME_LEVEL = 2;

export interface AudioSettings {
  volumeLevel: number;
  muted: boolean;
}

let audioSettings: AudioSettings = {
  volumeLevel: DEFAULT_AUDIO_VOLUME_LEVEL,
  muted: false,
};
let mainMenuAudio: HTMLAudioElement | null = null;
let mainMenuMusicRequested = false;

function clampVolumeLevel(level: number) {
  return Math.max(MIN_AUDIO_VOLUME_LEVEL, Math.min(AUDIO_VOLUME_LEVELS, Math.round(level)));
}

function getMasterGainValue() {
  return audioSettings.muted
    ? 0
    : MASTER_GAIN_MAX * audioSettings.volumeLevel / AUDIO_VOLUME_LEVELS;
}

function syncMasterGain() {
  if (!ctx || !masterGain) return;
  const now = ctx.currentTime;
  masterGain.gain.cancelScheduledValues(now);
  masterGain.gain.setTargetAtTime(getMasterGainValue(), now, 0.015);
}

function getMainMenuVolume() {
  return MAIN_MENU_VOLUME_MAX * audioSettings.volumeLevel / AUDIO_VOLUME_LEVELS;
}

function syncMainMenuAudio() {
  if (!mainMenuAudio) return;
  mainMenuAudio.muted = audioSettings.muted;
  mainMenuAudio.volume = getMainMenuVolume();
}

function syncAudioOutputs() {
  syncMasterGain();
  syncMainMenuAudio();
}

function getMainMenuAudio() {
  if (mainMenuAudio || typeof Audio === 'undefined') {
    return mainMenuAudio;
  }

  const audio = new Audio(MAIN_MENU_MUSIC_PATH);
  audio.dataset.audioChannel = 'main-menu';
  audio.loop = true;
  audio.preload = 'auto';
  audio.setAttribute('aria-hidden', 'true');
  mainMenuAudio = audio;
  syncMainMenuAudio();

  if (typeof document !== 'undefined') {
    document.body.append(audio);
  }

  return audio;
}

function getCtx() {
  if (!ctx) {
    ctx = new AudioContext();
    masterGain = ctx.createGain();
    masterGain.gain.value = getMasterGainValue();
    masterGain.connect(ctx.destination);
    effectsGain = ctx.createGain();
    effectsGain.gain.value = 1;
    effectsGain.connect(masterGain);
    musicGain = ctx.createGain();
    musicGain.gain.value = 0.08;
    musicGain.connect(masterGain);
  }
  if (ctx.state === 'suspended') {
    void ctx.resume().catch(() => undefined);
  }
  return ctx;
}

export function getAudioSettings(): AudioSettings {
  return { ...audioSettings };
}

export function setAudioVolumeLevel(volumeLevel: number) {
  const nextVolumeLevel = clampVolumeLevel(volumeLevel);
  audioSettings = {
    volumeLevel: nextVolumeLevel,
    muted: nextVolumeLevel === MIN_AUDIO_VOLUME_LEVEL,
  };
  syncAudioOutputs();
  return getAudioSettings();
}

export function setAudioMuted(muted: boolean) {
  audioSettings = {
    volumeLevel: muted
      ? (audioSettings.volumeLevel === 1 ? MIN_AUDIO_VOLUME_LEVEL : audioSettings.volumeLevel)
      : Math.max(1, audioSettings.volumeLevel),
    muted,
  };
  syncAudioOutputs();
  return getAudioSettings();
}

export function adjustAudioVolume(delta: number) {
  return setAudioVolumeLevel(audioSettings.volumeLevel + delta);
}

export function toggleAudioMuted() {
  return setAudioMuted(!audioSettings.muted);
}

export async function startMainMenuMusic() {
  mainMenuMusicRequested = true;
  stopMusic();
  const audio = getMainMenuAudio();
  if (!audio) {
    return false;
  }

  syncMainMenuAudio();
  if (!audio.paused) {
    return true;
  }

  try {
    await audio.play();
    return !audio.paused;
  } catch {
    // Browsers may reject autoplay until the first user interaction.
    return false;
  }
}

export function stopMainMenuMusic() {
  mainMenuMusicRequested = false;
  if (!mainMenuAudio) return;

  mainMenuAudio.pause();
  try {
    mainMenuAudio.currentTime = 0;
  } catch {
    // Ignore media that has not loaded metadata yet.
  }
  mainMenuAudio.remove();
  mainMenuAudio = null;
}

export function isMainMenuMusicRequested() {
  return mainMenuMusicRequested;
}

function disconnectNode(node: AudioNode | null | undefined) {
  try {
    node?.disconnect();
  } catch {
    // Ignore already-disconnected nodes.
  }
}

function getAudibleDuration(buffer: AudioBuffer) {
  let lastAudibleSample = -1;

  for (let channelIndex = 0; channelIndex < buffer.numberOfChannels; channelIndex += 1) {
    const samples = buffer.getChannelData(channelIndex);
    for (let sampleIndex = samples.length - 1; sampleIndex >= 0; sampleIndex -= 1) {
      if (Math.abs(samples[sampleIndex] ?? 0) >= AUDIBLE_SAMPLE_THRESHOLD) {
        lastAudibleSample = Math.max(lastAudibleSample, sampleIndex);
        break;
      }
    }
  }

  if (lastAudibleSample < 0) {
    return Math.min(buffer.duration, AUDIBLE_TAIL_SECONDS);
  }

  return Math.min(
    buffer.duration,
    (lastAudibleSample + 1) / buffer.sampleRate + AUDIBLE_TAIL_SECONDS,
  );
}

async function loadGameSound(id: GameSoundId) {
  const cached = gameSoundBuffers.get(id);
  if (cached) return cached;

  const pending = gameSoundLoadPromises.get(id);
  if (pending) return pending;

  const loadPromise = (async () => {
    try {
      const response = await fetch(GAME_SOUND_PATHS[id], { cache: 'force-cache' });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const buffer = await getCtx().decodeAudioData(await response.arrayBuffer());
      gameSoundBuffers.set(id, buffer);
      gameSoundDurations.set(id, getAudibleDuration(buffer));
      warnedSoundLoads.delete(id);
      return buffer;
    } catch (error) {
      if (!warnedSoundLoads.has(id)) {
        warnedSoundLoads.add(id);
        console.warn(`Unable to preload game sound: ${GAME_SOUND_PATHS[id]}`, error);
      }
      return null;
    } finally {
      gameSoundLoadPromises.delete(id);
    }
  })();

  gameSoundLoadPromises.set(id, loadPromise);
  return loadPromise;
}

export async function preloadGameSounds() {
  const sounds = await Promise.all(
    (Object.keys(GAME_SOUND_PATHS) as GameSoundId[]).map((id) => loadGameSound(id)),
  );
  return sounds.every(Boolean);
}

function unregisterGameSound(activeSound: ActiveGameSound) {
  const soundsForId = activeGameSounds.get(activeSound.id);
  soundsForId?.delete(activeSound);
  if (soundsForId?.size === 0) {
    activeGameSounds.delete(activeSound.id);
  }

  if (activeSound.group) {
    const soundsForGroup = activeGameSoundGroups.get(activeSound.group);
    soundsForGroup?.delete(activeSound);
    if (soundsForGroup?.size === 0) {
      activeGameSoundGroups.delete(activeSound.group);
    }
  }

  disconnectNode(activeSound.source);
  disconnectNode(activeSound.gain);
}

function stopActiveGameSound(activeSound: ActiveGameSound, fadeSeconds = 0.02) {
  if (activeSound.stopping) return;
  activeSound.stopping = true;
  const context = ctx;
  try {
    if (context && context.state !== 'closed' && fadeSeconds > 0) {
      const now = context.currentTime;
      activeSound.gain.gain.cancelScheduledValues(now);
      activeSound.gain.gain.setValueAtTime(activeSound.gain.gain.value, now);
      activeSound.gain.gain.linearRampToValueAtTime(0, now + fadeSeconds);
      activeSound.source.stop(now + fadeSeconds);
    } else {
      activeSound.source.stop();
    }
  } catch {
    unregisterGameSound(activeSound);
  }
}

export function stopGameSoundGroup(group: GameSoundGroup) {
  const activeSounds = activeGameSoundGroups.get(group);
  if (!activeSounds) return;

  [...activeSounds].forEach((activeSound) => stopActiveGameSound(activeSound));
}

export function stopAllGameSounds() {
  const activeSounds = [...activeGameSounds.values()].flatMap((sounds) => [...sounds]);
  activeSounds.forEach((activeSound) => stopActiveGameSound(activeSound));
}

async function playGameSound(id: GameSoundId) {
  if (audioSettings.muted || audioSettings.volumeLevel === MIN_AUDIO_VOLUME_LEVEL) {
    return false;
  }

  const buffer = gameSoundBuffers.get(id);
  if (!buffer) {
    void loadGameSound(id);
    return false;
  }

  const context = getCtx();
  const requestedAt = Date.now();
  const contextIsRunning = () => context.state === 'running';
  if (!contextIsRunning()) {
    try {
      await context.resume();
    } catch {
      return false;
    }

    if (!contextIsRunning() || Date.now() - requestedAt > MAX_DEFERRED_SOUND_MS) {
      return false;
    }
  }

  const config = GAME_SOUND_CONFIG[id];
  if (config.group && config.replaceGroup) {
    stopGameSoundGroup(config.group);
  }

  const soundsForId = activeGameSounds.get(id) ?? new Set<ActiveGameSound>();
  if (soundsForId.size >= config.maxVoices) {
    return false;
  }

  const source = context.createBufferSource();
  const gain = context.createGain();
  const activeSound: ActiveGameSound = {
    id,
    source,
    gain,
    group: config.group,
    stopping: false,
  };

  source.buffer = buffer;
  gain.gain.value = config.volume;
  source.connect(gain);
  gain.connect(effectsGain!);
  source.onended = () => unregisterGameSound(activeSound);

  soundsForId.add(activeSound);
  activeGameSounds.set(id, soundsForId);
  if (config.group) {
    const soundsForGroup = activeGameSoundGroups.get(config.group) ?? new Set<ActiveGameSound>();
    soundsForGroup.add(activeSound);
    activeGameSoundGroups.set(config.group, soundsForGroup);
  }

  try {
    source.start(0, 0, gameSoundDurations.get(id) ?? buffer.duration);
    return true;
  } catch {
    unregisterGameSound(activeSound);
    return false;
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

export function playHop() {
  return playGameSound('jump');
}

export function playSplash() {
  return playGameSound('waterSplash');
}

export function playCrash() {
  return playGameSound('carPunch');
}

export function playGoalReached() {
  return playGameSound('goalReached');
}

export function playLevelComplete() {
  return playGameSound('levelComplete');
}

export function playGameOver() {
  return playGameSound('gameOver');
}

export function playBonusCollected() {
  return playGameSound('bonusCollected');
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

function playMusicVoice(
  context: AudioContext,
  frequency: number,
  type: OscillatorType,
  volume: number,
  duration: number,
) {
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  const voice: ActiveMusicVoice = { oscillator, gain };

  oscillator.type = type;
  oscillator.frequency.value = frequency;
  gain.gain.setValueAtTime(volume, context.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + Math.max(0.01, duration - 0.1));
  oscillator.connect(gain);
  gain.connect(musicGain!);
  oscillator.onended = () => {
    activeMusicVoices.delete(voice);
    disconnectNode(oscillator);
    disconnectNode(gain);
  };
  activeMusicVoices.add(voice);
  oscillator.start();
  oscillator.stop(context.currentTime + duration);
}

export function startMusic() {
  stopMainMenuMusic();
  if (musicPlaying) return;
  musicPlaying = true;
  const c = getCtx();

  // Ambient pad
  ambientOsc = c.createOscillator();
  ambientOsc.type = 'sine';
  ambientOsc.frequency.value = 131;
  ambientGain = c.createGain();
  ambientGain.gain.value = 0.03;
  ambientFilter = c.createBiquadFilter();
  ambientFilter.type = 'lowpass';
  ambientFilter.frequency.value = 200;
  ambientOsc.connect(ambientFilter);
  ambientFilter.connect(ambientGain);
  ambientGain.connect(masterGain!);
  ambientOsc.start();

  // LFO for ambient wobble
  musicLfo = c.createOscillator();
  musicLfo.type = 'sine';
  musicLfo.frequency.value = 0.3;
  musicLfoGain = c.createGain();
  musicLfoGain.gain.value = 8;
  musicLfo.connect(musicLfoGain);
  musicLfoGain.connect(ambientOsc.frequency);
  musicLfo.start();

  // Melody loop
  melodyIdx = 0;
  melodyInterval = setInterval(() => {
    if (!musicPlaying) return;
    const note = MELODY_NOTES[melodyIdx % MELODY_NOTES.length];
    const c2 = getCtx();
    playMusicVoice(c2, note * 0.5, 'triangle', 0.04, 0.5);
    playMusicVoice(c2, note * 0.25, 'sine', 0.02, 0.6);

    melodyIdx++;
  }, 500);
}

export function stopMusic() {
  musicPlaying = false;
  if (melodyInterval) { clearInterval(melodyInterval); melodyInterval = null; }
  try { ambientOsc?.stop(); } catch {}
  try { musicLfo?.stop(); } catch {}
  activeMusicVoices.forEach(({ oscillator, gain }) => {
    try { oscillator.stop(); } catch {}
    disconnectNode(oscillator);
    disconnectNode(gain);
  });
  activeMusicVoices.clear();
  disconnectNode(ambientOsc);
  disconnectNode(ambientFilter);
  disconnectNode(ambientGain);
  disconnectNode(musicLfo);
  disconnectNode(musicLfoGain);
  ambientOsc = null;
  ambientFilter = null;
  ambientGain = null;
  musicLfo = null;
  musicLfoGain = null;
}

export function initAudio() {
  void preloadGameSounds();
}

export async function disposeAudio() {
  stopMainMenuMusic();
  stopAllGameSounds();
  stopMusic();
  activeGameSounds.clear();
  activeGameSoundGroups.clear();
  gameSoundBuffers.clear();
  gameSoundDurations.clear();
  gameSoundLoadPromises.clear();
  warnedSoundLoads.clear();

  const context = ctx;
  ctx = null;
  if (context && context.state !== 'closed') {
    try {
      await context.close();
    } catch {
      // Ignore an already-closing context.
    }
  }

  disconnectNode(effectsGain);
  disconnectNode(musicGain);
  disconnectNode(masterGain);
  effectsGain = null;
  musicGain = null;
  masterGain = null;
}
