import type { Direction } from './gameConstants';
import type { FrogState, GameState } from './gameCore';
import { getBrowserStorage, type StorageLike } from './highScoreStorage';

export const GAME_REPLAY_KEY = 'frogger.replay.v1';
export const GAME_REPLAY_LATEST_KEY = 'frogger.replay.latest';

export type ReplayActionType = 'move' | 'restart';
export type ReplayInputSource = 'keyboard' | 'touch' | 'replay';

export interface ReplayAction {
  at: number;
  type: ReplayActionType;
  direction?: Direction;
  source?: ReplayInputSource;
}

export interface ReplayFrogSummary {
  x: number;
  y: number;
  direction: Direction;
  alive: boolean;
  riding: boolean;
}

export interface ReplayStateSummary {
  score: number;
  lives: number;
  level: number;
  gameOver: boolean;
  gameWon: boolean;
  paused: boolean;
  goalsReached: boolean[];
  frog: ReplayFrogSummary;
}

export interface ReplaySnapshot {
  version: 1;
  createdAt: number;
  level: number;
  seed: number;
  initialState: ReplayStateSummary;
  finalState: ReplayStateSummary;
  actions: ReplayAction[];
}

export interface ReplayRecorder {
  recordMove(direction: Direction, source?: ReplayInputSource): void;
  recordRestart(source?: ReplayInputSource): void;
  finish(finalState: ReplayStateSummary): ReplaySnapshot;
  snapshot(): ReplaySnapshot;
}

export interface ReplayRecorderOptions {
  level: number;
  seed: number;
  initialState: ReplayStateSummary;
  now?: () => number;
}

function cloneSummary(summary: ReplayStateSummary): ReplayStateSummary {
  return {
    ...summary,
    goalsReached: [...summary.goalsReached],
    frog: { ...summary.frog },
  };
}

export function summarizeReplayState(gameState: GameState, frog: FrogState): ReplayStateSummary {
  return {
    score: gameState.score,
    lives: gameState.lives,
    level: gameState.level,
    gameOver: gameState.gameOver,
    gameWon: gameState.gameWon,
    paused: gameState.paused,
    goalsReached: [...gameState.goalsReached],
    frog: {
      x: frog.pos.x,
      y: frog.pos.y,
      direction: frog.direction,
      alive: frog.alive,
      riding: frog.riding,
    },
  };
}

function isReplayInputSource(value: unknown): value is ReplayInputSource {
  return value === 'keyboard' || value === 'touch' || value === 'replay';
}

export function createReplayRecorder(options: ReplayRecorderOptions): ReplayRecorder {
  const startedAt = options.now?.() ?? performance.now();
  const actions: ReplayAction[] = [];
  let lastFinalState = cloneSummary(options.initialState);

  const record = (type: ReplayActionType, payload: Partial<ReplayAction>) => {
    const at = Math.max(0, Math.round((options.now?.() ?? performance.now()) - startedAt));
    const action: ReplayAction = {
      at,
      type,
      ...payload,
    };
    actions.push(action);
  };

  return {
    recordMove(direction, source = 'keyboard') {
      record('move', { direction, source });
    },
    recordRestart(source = 'keyboard') {
      record('restart', { source });
    },
    finish(finalState) {
      lastFinalState = cloneSummary(finalState);
      return this.snapshot();
    },
    snapshot() {
      return {
        version: 1,
        createdAt: Date.now(),
        level: options.level,
        seed: options.seed,
        initialState: cloneSummary(options.initialState),
        finalState: cloneSummary(lastFinalState),
        actions: actions.map((action) => ({ ...action })),
      };
    },
  };
}

export function encodeReplaySnapshot(snapshot: ReplaySnapshot) {
  return encodeURIComponent(JSON.stringify(snapshot));
}

export function decodeReplaySnapshot(raw: string): ReplaySnapshot | null {
  try {
    const decoded = raw.includes('%') ? decodeURIComponent(raw) : raw;
    const parsed = JSON.parse(decoded) as unknown;
    if (!parsed || typeof parsed !== 'object') return null;
    const candidate = parsed as Partial<ReplaySnapshot>;
    if (candidate.version !== 1
      || typeof candidate.createdAt !== 'number'
      || typeof candidate.level !== 'number'
      || typeof candidate.seed !== 'number'
      || !candidate.initialState
      || !candidate.finalState
      || !Array.isArray(candidate.actions)) {
      return null;
    }
    if (!Array.isArray(candidate.initialState.goalsReached) || !Array.isArray(candidate.finalState.goalsReached)) return null;
    if (!candidate.actions.every((action) => typeof action.at === 'number' && (action.type === 'move' || action.type === 'restart') && (!action.source || isReplayInputSource(action.source)))) return null;
    return candidate as ReplaySnapshot;
  } catch {
    return null;
  }
}

export function loadReplaySnapshot(
  storage: StorageLike | null = getBrowserStorage(),
  key = GAME_REPLAY_KEY,
): ReplaySnapshot | null {
  if (!storage) return null;
  const raw = storage.getItem(key);
  if (!raw) return null;
  return decodeReplaySnapshot(raw);
}

export function resolveReplaySnapshotFromSearch(
  search: string,
  storage: StorageLike | null = getBrowserStorage(),
) {
  const params = new URLSearchParams(search);
  const token = params.get('replay');
  if (!token) return null;
  if (token === 'latest') {
    return loadReplaySnapshot(storage, GAME_REPLAY_LATEST_KEY);
  }
  return decodeReplaySnapshot(token);
}

export function shouldRecordReplayFromSearch(search: string) {
  const params = new URLSearchParams(search);
  return params.get('recordReplay') === '1' || params.get('recordReplay') === 'true';
}

export function saveReplaySnapshot(
  snapshot: ReplaySnapshot,
  storage: StorageLike | null = getBrowserStorage(),
  key = GAME_REPLAY_KEY,
) {
  if (!storage) return;
  storage.setItem(key, encodeReplaySnapshot(snapshot));
  storage.setItem(GAME_REPLAY_LATEST_KEY, encodeReplaySnapshot(snapshot));
}

export function clearReplaySnapshot(
  storage: StorageLike | null = getBrowserStorage(),
  key = GAME_REPLAY_KEY,
) {
  if (!storage) return;
  storage.setItem(key, '');
}

export function compareReplaySummaries(expected: ReplayStateSummary, actual: ReplayStateSummary) {
  return expected.score === actual.score
    && expected.lives === actual.lives
    && expected.level === actual.level
    && expected.gameOver === actual.gameOver
    && expected.gameWon === actual.gameWon
    && expected.paused === actual.paused
    && expected.frog.x === actual.frog.x
    && expected.frog.y === actual.frog.y
    && expected.frog.direction === actual.frog.direction
    && expected.frog.alive === actual.frog.alive
    && expected.frog.riding === actual.frog.riding
    && expected.goalsReached.length === actual.goalsReached.length
    && expected.goalsReached.every((value, index) => value === actual.goalsReached[index]);
}
