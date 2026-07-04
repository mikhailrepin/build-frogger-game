import { afterEach, describe, expect, it } from 'vitest';
import {
  AUDIO_VOLUME_LEVELS,
  DEFAULT_AUDIO_VOLUME_LEVEL,
  adjustAudioVolume,
  getAudioSettings,
  isMainMenuMusicRequested,
  setAudioMuted,
  setAudioVolumeLevel,
  startMainMenuMusic,
  stopMainMenuMusic,
  toggleAudioMuted,
} from './audio';

afterEach(() => {
  stopMainMenuMusic();
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
});
