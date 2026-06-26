import { afterEach, describe, expect, it } from 'vitest';
import {
  AUDIO_VOLUME_LEVELS,
  DEFAULT_AUDIO_VOLUME_LEVEL,
  adjustAudioVolume,
  getAudioSettings,
  setAudioMuted,
  setAudioVolumeLevel,
  toggleAudioMuted,
} from './audio';

afterEach(() => {
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
});
