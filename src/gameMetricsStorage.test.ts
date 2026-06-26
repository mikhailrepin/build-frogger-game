import { beforeEach, describe, expect, it } from 'vitest';
import { recordGameEvent, resetGameEvents } from './gameMetrics';
import {
  createEmptyGameMetricsSnapshot,
  flushGameMetrics,
  loadGameMetricsSnapshot,
  type GameMetricsSnapshot,
  GAME_METRICS_KEY,
} from './gameMetricsStorage';
import type { StorageLike } from './highScoreStorage';

function createMemoryStorage(initial: Record<string, string> = {}): StorageLike {
  const state = new Map(Object.entries(initial));
  return {
    getItem: (key) => state.get(key) ?? null,
    setItem: (key, value) => {
      state.set(key, value);
    },
  };
}

describe('game metrics storage', () => {
  beforeEach(() => {
    resetGameEvents();
  });

  it('flushes in-memory events into a persistent snapshot', () => {
    const storage = createMemoryStorage();
    recordGameEvent('start', { level: 1 });
    recordGameEvent('death', { level: 1 });

    const snapshot = flushGameMetrics(storage);

    expect(snapshot).not.toBeNull();
    expect(snapshot?.totalEvents).toBe(2);
    expect(snapshot?.flushCount).toBe(1);
    expect(snapshot?.eventCounts.start).toBe(1);
    expect(snapshot?.eventCounts.death).toBe(1);
    expect(snapshot?.recentEvents).toHaveLength(2);
    expect(loadGameMetricsSnapshot(storage)?.totalEvents).toBe(2);
  });

  it('keeps existing snapshots stable when no new events exist', () => {
    const storage = createMemoryStorage();
    const seed: GameMetricsSnapshot = {
      ...createEmptyGameMetricsSnapshot(),
      totalEvents: 3,
      flushCount: 2,
      eventCounts: {
        start: 1,
        first_move: 0,
        death: 1,
        restart: 0,
        goal: 0,
        level_complete: 1,
        game_over: 0,
        ability_used: 0,
      },
      recentEvents: [],
      lastEvent: null,
    };
    storage.setItem(GAME_METRICS_KEY, JSON.stringify(seed));

    expect(flushGameMetrics(storage)).toEqual(seed);
  });
});
