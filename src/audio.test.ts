import { afterEach, describe, expect, it } from 'vitest';
import {
  AUDIO_VOLUME_LEVELS,
  DEFAULT_AUDIO_VOLUME_LEVEL,
  getAudioSettings,
  setAudioMuted,
  setAudioVolumeLevel,
} from './audio';

afterEach(() => {
  setAudioVolumeLevel(DEFAULT_AUDIO_VOLUME_LEVEL);
  setAudioMuted(false);
});

describe('audio settings', () => {
  it('clamps the volume to the supported HUD levels', () => {
    expect(setAudioVolumeLevel(0).volumeLevel).toBe(1);
    expect(setAudioVolumeLevel(99).volumeLevel).toBe(AUDIO_VOLUME_LEVELS);
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
});
