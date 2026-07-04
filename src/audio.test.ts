import { afterEach, describe, expect, it } from 'vitest';
import {
  AUDIO_VOLUME_LEVELS,
  DEFAULT_AUDIO_VOLUME_LEVEL,
  GAME_SOUND_PATHS,
  adjustAudioVolume,
  disposeAudio,
  getAudioSettings,
  isMainMenuMusicRequested,
  playCrash,
  playGameOver,
  playHop,
  playLevelComplete,
  playSplash,
  preloadGameSounds,
  setAudioMuted,
  setAudioVolumeLevel,
  startMainMenuMusic,
  stopAllGameSounds,
  stopMainMenuMusic,
  toggleAudioMuted,
} from './audio';

class FakeAudioParam {
  value = 0;

  cancelScheduledValues() {}

  exponentialRampToValueAtTime(value: number) {
    this.value = value;
  }

  linearRampToValueAtTime(value: number) {
    this.value = value;
  }

  setTargetAtTime(value: number) {
    this.value = value;
  }

  setValueAtTime(value: number) {
    this.value = value;
  }
}

class FakeAudioNode {
  connectedTo: unknown = null;
  disconnected = false;

  connect(target?: unknown) {
    this.connectedTo = target;
    return target ?? this;
  }

  disconnect() {
    this.disconnected = true;
  }
}

class FakeBufferSource extends FakeAudioNode {
  buffer: AudioBuffer | null = null;
  onended: (() => void) | null = null;
  startArgs: number[] | null = null;
  stopArgs: number[] | null = null;

  start(...args: number[]) {
    this.startArgs = args;
  }

  stop(...args: number[]) {
    this.stopArgs = args;
  }
}

class FakeOscillator extends FakeAudioNode {
  frequency = new FakeAudioParam();
  onended: (() => void) | null = null;
  type: OscillatorType = 'sine';

  start() {}

  stop() {
    this.onended?.();
  }
}

class FakeGain extends FakeAudioNode {
  gain = new FakeAudioParam();
}

class FakeBiquadFilter extends FakeAudioNode {
  frequency = new FakeAudioParam();
  type: BiquadFilterType = 'lowpass';
}

function createDecodedBuffer() {
  const samples = new Float32Array(1000);
  samples[499] = 0.5;
  return {
    duration: 1,
    numberOfChannels: 1,
    sampleRate: 1000,
    getChannelData: () => samples,
  } as unknown as AudioBuffer;
}

class FakeAudioContext {
  currentTime = 0;
  destination = new FakeAudioNode();
  sampleRate = 1000;
  state: AudioContextState = 'running';
  readonly sources: FakeBufferSource[] = [];

  close = async () => {
    this.state = 'closed';
  };

  createBiquadFilter() {
    return new FakeBiquadFilter() as unknown as BiquadFilterNode;
  }

  createBufferSource() {
    const source = new FakeBufferSource();
    this.sources.push(source);
    return source as unknown as AudioBufferSourceNode;
  }

  createGain() {
    return new FakeGain() as unknown as GainNode;
  }

  createOscillator() {
    return new FakeOscillator() as unknown as OscillatorNode;
  }

  decodeAudioData = async () => createDecodedBuffer();

  resume = async () => {
    this.state = 'running';
  };
}

afterEach(async () => {
  await disposeAudio();
  setAudioVolumeLevel(DEFAULT_AUDIO_VOLUME_LEVEL);
  setAudioMuted(false);
});

describe('audio settings', () => {
  it('clamps the volume to zero and the supported HUD maximum', () => {
    expect(setAudioVolumeLevel(-99)).toEqual({
      volumeLevel: 0,
      muted: true,
    });
    expect(setAudioVolumeLevel(99)).toEqual({
      volumeLevel: AUDIO_VOLUME_LEVELS,
      muted: false,
    });
  });

  it('mutes independently without discarding the selected volume', () => {
    setAudioVolumeLevel(3);
    setAudioMuted(true);

    expect(getAudioSettings()).toEqual({
      volumeLevel: 3,
      muted: true,
    });

    expect(setAudioMuted(false)).toEqual({
      volumeLevel: 3,
      muted: false,
    });
  });

  it('automatically mutes at zero and restores one level when sound is toggled on', () => {
    setAudioVolumeLevel(1);

    expect(adjustAudioVolume(-1)).toEqual({
      volumeLevel: 0,
      muted: true,
    });
    expect(toggleAudioMuted()).toEqual({
      volumeLevel: 1,
      muted: false,
    });
  });

  it('collapses level one when muted and restores it when sound is enabled', () => {
    setAudioVolumeLevel(1);

    expect(toggleAudioMuted()).toEqual({
      volumeLevel: 0,
      muted: true,
    });
    expect(toggleAudioMuted()).toEqual({
      volumeLevel: 1,
      muted: false,
    });
  });

  it.each([-1, 1])('unmutes when volume is adjusted by %i', (delta) => {
    setAudioVolumeLevel(2);
    setAudioMuted(true);

    expect(adjustAudioVolume(delta)).toEqual({
      volumeLevel: 2 + delta,
      muted: false,
    });
  });

  it('loops main-menu music and synchronizes mute and volume settings', async () => {
    let createdAudio: FakeAudio | null = null;

    class FakeAudio {
      dataset: Record<string, string> = {};
      loop = false;
      muted = false;
      paused = true;
      preload = '';
      currentTime = 12;
      volume = 1;
      readonly src: string;

      constructor(src: string) {
        this.src = src;
        createdAudio = this;
      }

      setAttribute() {}

      async play() {
        this.paused = false;
      }

      pause() {
        this.paused = true;
      }

      remove() {}
    }

    const originalAudio = globalThis.Audio;
    globalThis.Audio = FakeAudio as unknown as typeof Audio;

    try {
      await expect(startMainMenuMusic()).resolves.toBe(true);
      expect(isMainMenuMusicRequested()).toBe(true);
      expect(createdAudio).toMatchObject({
        src: '/sounds/main-menu.mp3',
        loop: true,
        muted: false,
        paused: false,
        preload: 'auto',
        volume: 0.225,
      });

      setAudioMuted(true);
      expect(createdAudio).toMatchObject({
        muted: true,
        paused: false,
      });

      setAudioMuted(false);
      setAudioVolumeLevel(4);
      expect(createdAudio).toMatchObject({
        muted: false,
        volume: 0.45,
      });

      stopMainMenuMusic();
      expect(isMainMenuMusicRequested()).toBe(false);
      expect(createdAudio).toMatchObject({
        paused: true,
        currentTime: 0,
      });
    } finally {
      globalThis.Audio = originalAudio;
    }
  });

  it('maps every named gameplay event to its matching sound asset', () => {
    expect(GAME_SOUND_PATHS).toEqual({
      jump: '/sounds/jump.mp3',
      carPunch: '/sounds/car-punch.mp3',
      waterSplash: '/sounds/water-splash.mp3',
      goalReached: '/sounds/get-flower.mp3',
      bonusCollected: '/sounds/take-bonus.mp3',
      levelComplete: '/sounds/complete.mp3',
      gameOver: '/sounds/defeat.mp3',
    });
  });

  it('preloads each sound once and bounds overlapping jump voices', async () => {
    const originalAudioContext = globalThis.AudioContext;
    const originalFetch = globalThis.fetch;
    const fakeContext = new FakeAudioContext();
    const fetchedPaths: string[] = [];

    globalThis.AudioContext = class {
      constructor() {
        return fakeContext;
      }
    } as unknown as typeof AudioContext;
    globalThis.fetch = (async (input: string | URL | Request) => {
      fetchedPaths.push(String(input));
      return {
        ok: true,
        status: 200,
        arrayBuffer: async () => new ArrayBuffer(8),
      } as Response;
    }) as typeof fetch;

    try {
      await expect(preloadGameSounds()).resolves.toBe(true);
      await expect(preloadGameSounds()).resolves.toBe(true);
      expect(fetchedPaths).toEqual(Object.values(GAME_SOUND_PATHS));

      const results = await Promise.all([
        playHop(),
        playHop(),
        playHop(),
        playHop(),
        playHop(),
      ]);

      expect(results).toEqual([true, true, true, true, false]);
      expect(fakeContext.sources).toHaveLength(4);
      expect(fakeContext.sources[0]?.startArgs?.[2]).toBeCloseTo(0.58, 5);
      expect((fakeContext.sources[0]?.connectedTo as FakeGain).gain.value).toBe(0.64);

      stopAllGameSounds();
      expect(fakeContext.sources.every((source) => source.stopArgs !== null)).toBe(true);
    } finally {
      globalThis.AudioContext = originalAudioContext;
      globalThis.fetch = originalFetch;
    }
  });

  it('replaces mutually exclusive death sounds and suppresses effects while muted', async () => {
    const originalAudioContext = globalThis.AudioContext;
    const originalFetch = globalThis.fetch;
    const fakeContext = new FakeAudioContext();

    globalThis.AudioContext = class {
      constructor() {
        return fakeContext;
      }
    } as unknown as typeof AudioContext;
    globalThis.fetch = (async () => ({
      ok: true,
      status: 200,
      arrayBuffer: async () => new ArrayBuffer(8),
    } as Response)) as typeof fetch;

    try {
      await preloadGameSounds();
      await expect(playCrash()).resolves.toBe(true);
      const crashSource = fakeContext.sources[0];
      await expect(playSplash()).resolves.toBe(true);

      expect(crashSource?.stopArgs).not.toBeNull();
      expect(fakeContext.sources).toHaveLength(2);

      await expect(playLevelComplete()).resolves.toBe(true);
      await expect(playGameOver()).resolves.toBe(true);
      expect(fakeContext.sources).toHaveLength(4);

      setAudioMuted(true);
      await expect(playHop()).resolves.toBe(false);
      expect(fakeContext.sources).toHaveLength(4);
    } finally {
      globalThis.AudioContext = originalAudioContext;
      globalThis.fetch = originalFetch;
    }
  });
});
