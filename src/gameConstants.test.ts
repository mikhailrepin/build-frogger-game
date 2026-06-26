import { describe, expect, it } from 'vitest';
import { generateLevel, validateLevelData, type LevelData } from './gameConstants';

describe('game constants level validation', () => {
  it('accepts generated levels across the current difficulty range', () => {
    for (const level of [1, 2, 4, 8]) {
      const levelData = generateLevel(level);
      const result = validateLevelData(levelData, level);

      expect(result.valid).toBe(true);
      expect(result.issues).toEqual([]);
    }
  });

  it('flags modifier and layout combinations that break the fair level contract', () => {
    const invalidLevel: LevelData = {
      rows: 6,
      modifiers: ['nightTraffic', 'nightTraffic', 'fastCurrent'],
      lanes: [
        { type: 'safe', speed: 0, items: [] },
        { type: 'road', speed: 1.2, items: [{ width: 2, startX: 0 }] },
        { type: 'safe', speed: 0, items: [] },
        { type: 'goal', speed: 0, items: [] },
        { type: 'decoration', speed: 0, items: [] },
        { type: 'safe', speed: 0, items: [] },
      ],
    };

    const result = validateLevelData(invalidLevel, 2);

    expect(result.valid).toBe(false);
    expect(result.issues.map((issue) => issue.code)).toEqual(
      expect.arrayContaining(['duplicate_modifiers', 'modifier_count', 'lane_mix', 'goal_lane', 'end_lane']),
    );
  });

  it('detects river modifier misuse when platforms are too wide to reflect narrowing', () => {
    const levelData: LevelData = {
      rows: 6,
      modifiers: ['narrowPlatforms'],
      lanes: [
        { type: 'safe', speed: 0, items: [] },
        { type: 'river', speed: -1.1, items: [{ width: 5, startX: 0, variant: 'turtle' }] },
        { type: 'safe', speed: 0, items: [] },
        { type: 'goal', speed: 0, items: [] },
        { type: 'decoration', speed: 0, items: [] },
        { type: 'safe', speed: 0, items: [] },
      ],
    };

    const result = validateLevelData(levelData, 4);

    expect(result.valid).toBe(false);
    expect(result.issues.map((issue) => issue.code)).toContain('narrow_platforms');
  });
});
