import { describe, expect, it } from 'vitest';
import { buildLaneItems } from './gameCore';
import type { LaneConfig } from './gameConstants';
import { advanceLaneItemsInPlace } from './gameRuntime';

describe('game runtime', () => {
  it('advances and wraps lane items without replacing arrays or objects', () => {
    const lanes: LaneConfig[] = [
      { type: 'safe', speed: 0, items: [] },
      { type: 'road', speed: 1, items: [{ width: 2, startX: 650, variant: 'sedan' }] },
    ];
    const items = buildLaneItems(lanes, lanes.length);
    const outerReference = items;
    const rowReference = items[1];
    const itemReference = items[1]?.[0];

    for (let step = 0; step < 1_000; step += 1) {
      expect(advanceLaneItemsInPlace(items, lanes, 1)).toBe(outerReference);
    }

    expect(items[1]).toBe(rowReference);
    expect(items[1]?.[0]).toBe(itemReference);
    expect(Number.isFinite(items[1]?.[0]?.x)).toBe(true);
  });

  it('keeps stationary lanes untouched', () => {
    const lanes: LaneConfig[] = [
      { type: 'safe', speed: 0, items: [{ width: 1, startX: 2 }] },
    ];
    const items = buildLaneItems(lanes, lanes.length);
    const initialX = items[0]?.[0]?.x;

    advanceLaneItemsInPlace(items, lanes, 5);

    expect(items[0]?.[0]?.x).toBe(initialX);
  });
});
