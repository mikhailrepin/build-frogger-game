import { describe, expect, it } from 'vitest';
import { createInitialFrog, createInitialGameState } from './gameCore';
import {
  compareReplaySummaries,
  createReplayRecorder,
  decodeReplaySnapshot,
  encodeReplaySnapshot,
  summarizeReplayState,
} from './gameReplay';

describe('game replay', () => {
  it('records deterministic action sequences with expected state snapshots', () => {
    let now = 1000;
    const recorder = createReplayRecorder({
      level: 4,
      seed: 31618,
      initialState: summarizeReplayState(createInitialGameState(), createInitialFrog(15)),
      now: () => now,
    });

    now += 50;
    recorder.recordMove('up', 'keyboard');
    now += 120;
    recorder.recordRestart('touch');

    const snapshot = recorder.finish(summarizeReplayState(createInitialGameState(), createInitialFrog(15)));
    const encoded = encodeReplaySnapshot(snapshot);
    const decoded = decodeReplaySnapshot(encoded);

    expect(snapshot.level).toBe(4);
    expect(snapshot.seed).toBe(31618);
    expect(snapshot.actions).toHaveLength(2);
    expect(snapshot.actions[0]).toMatchObject({ type: 'move', direction: 'up', source: 'keyboard', at: 50 });
    expect(snapshot.actions[1]).toMatchObject({ type: 'restart', source: 'touch', at: 170 });
    expect(decoded).toEqual(snapshot);
  });

  it('compares replay summaries by gameplay state and frog pose', () => {
    const summary = summarizeReplayState(createInitialGameState(), createInitialFrog(15));
    const match = summarizeReplayState(createInitialGameState(), createInitialFrog(15));
    const mismatch = summarizeReplayState(createInitialGameState(), createInitialFrog(15));
    mismatch.frog.x += 50;

    expect(compareReplaySummaries(summary, match)).toBe(true);
    expect(compareReplaySummaries(summary, mismatch)).toBe(false);
  });
});

