import { drainGameEvents, type GameEvent, type GameEventType } from './gameMetrics';
import { getBrowserStorage, type StorageLike } from './highScoreStorage';

export const GAME_METRICS_KEY = 'frogger.metrics.v1';

const EVENT_TYPES: GameEventType[] = [
  'start',
  'first_move',
  'death',
  'restart',
  'goal',
  'level_complete',
  'game_over',
  'ability_used',
];

export interface GameMetricsSnapshot {
  version: 1;
  updatedAt: number;
  totalEvents: number;
  flushCount: number;
  eventCounts: Record<GameEventType, number>;
  recentEvents: GameEvent[];
  lastEvent: GameEvent | null;
}

function createEmptyEventCounts() {
  return EVENT_TYPES.reduce((counts, type) => {
    counts[type] = 0;
    return counts;
  }, {} as Record<GameEventType, number>);
}

export function createEmptyGameMetricsSnapshot(): GameMetricsSnapshot {
  return {
    version: 1,
    updatedAt: Date.now(),
    totalEvents: 0,
    flushCount: 0,
    eventCounts: createEmptyEventCounts(),
    recentEvents: [],
    lastEvent: null,
  };
}

function isGameMetricsSnapshot(value: unknown): value is GameMetricsSnapshot {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<GameMetricsSnapshot>;

  return candidate.version === 1
    && typeof candidate.updatedAt === 'number'
    && typeof candidate.totalEvents === 'number'
    && typeof candidate.flushCount === 'number'
    && !!candidate.eventCounts
    && Array.isArray(candidate.recentEvents);
}

export function loadGameMetricsSnapshot(
  storage: StorageLike | null = getBrowserStorage(),
  key = GAME_METRICS_KEY,
): GameMetricsSnapshot | null {
  if (!storage) return null;

  const raw = storage.getItem(key);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!isGameMetricsSnapshot(parsed)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveGameMetricsSnapshot(
  snapshot: GameMetricsSnapshot,
  storage: StorageLike | null = getBrowserStorage(),
  key = GAME_METRICS_KEY,
) {
  if (!storage) return;
  storage.setItem(key, JSON.stringify(snapshot));
}

export function flushGameMetrics(
  storage: StorageLike | null = getBrowserStorage(),
  key = GAME_METRICS_KEY,
  maxRecentEvents = 100,
): GameMetricsSnapshot | null {
  const events = drainGameEvents();
  if (events.length === 0) return loadGameMetricsSnapshot(storage, key);

  const snapshot = loadGameMetricsSnapshot(storage, key) ?? createEmptyGameMetricsSnapshot();
  const nextCounts = { ...snapshot.eventCounts };

  for (const event of events) {
    nextCounts[event.type] = (nextCounts[event.type] ?? 0) + 1;
  }

  const recentEvents = [...snapshot.recentEvents, ...events].slice(-maxRecentEvents);
  const nextSnapshot: GameMetricsSnapshot = {
    version: 1,
    updatedAt: Date.now(),
    totalEvents: snapshot.totalEvents + events.length,
    flushCount: snapshot.flushCount + 1,
    eventCounts: nextCounts,
    recentEvents,
    lastEvent: events[events.length - 1] ?? snapshot.lastEvent,
  };

  saveGameMetricsSnapshot(nextSnapshot, storage, key);
  return nextSnapshot;
}

