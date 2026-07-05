import { describe, expect, it } from 'vitest';
import {
  activateFlyCombo,
  clearFlyCombo,
  computeLevelClearScore,
  createChallengeSession,
  registerLevelDeath,
  replaceActiveTimedBonus,
  resetChallengeSession,
  resolveGoalLanding,
  scoreWithFlyCombo,
} from './gameChallenge';
import { createInitialGameState } from './gameCore';

describe('game challenge', () => {
  it('tracks level deaths and combo charges', () => {
    const session = createChallengeSession(1000);
    const next = registerLevelDeath(session);
    const combo = activateFlyCombo(next);

    expect(next.deathsThisLevel).toBe(1);
    expect(combo.flyComboCharges).toBeGreaterThan(0);
    expect(clearFlyCombo(combo).flyComboCharges).toBe(0);
  });

  it('applies fly combo scoring and computes level clear bonuses', () => {
    const session = activateFlyCombo(resetChallengeSession(0));
    const scored = scoreWithFlyCombo(session, 50);

    expect(scored.result.score).toBe(100);
    expect(scored.result.consumed).toBe(true);
    expect(scored.session.flyComboCharges).toBeGreaterThanOrEqual(0);

    const cleanClear = computeLevelClearScore(resetChallengeSession(0), 1);
    expect(cleanClear.score).toBeGreaterThan(0);
    expect(cleanClear.perfectClearBonus).toBeGreaterThan(0);
    expect(cleanClear.timeChallengeBonus).toBeGreaterThan(0);
  });

  it('replaces the active bonus and resets its full duration', () => {
    const shield = replaceActiveTimedBonus(null, 'shield', 5_000, 1_000);
    const slowTime = replaceActiveTimedBonus(shield, 'slowTime', 8_000, 2_000);
    const refreshedSlowTime = replaceActiveTimedBonus(slowTime, 'slowTime', 8_000, 4_000);

    expect(slowTime).toEqual({
      kind: 'slowTime',
      expiresAt: 10_000,
    });
    expect(refreshedSlowTime).toEqual({
      kind: 'slowTime',
      expiresAt: 12_000,
    });
  });

  it('resolves regular and final goal landings atomically', () => {
    const session = resetChallengeSession(1_000);
    const initial = createInitialGameState();
    const regular = resolveGoalLanding(initial, session, 0, false, 2_000);

    expect(regular.accepted).toBe(true);
    expect(regular.allDone).toBe(false);
    expect(regular.clearBonus.score).toBe(0);
    expect(regular.state.gameWon).toBe(false);
    expect(regular.state.level).toBe(1);
    expect(regular.state.goalsReached[0]).toBe(true);

    const almostComplete = {
      ...regular.state,
      goalsReached: [true, true, true, true, false],
    };
    const final = resolveGoalLanding(almostComplete, regular.session, 4, false, 2_500);

    expect(final.accepted).toBe(true);
    expect(final.allDone).toBe(true);
    expect(final.clearBonus.score).toBeGreaterThan(0);
    expect(final.state.gameWon).toBe(true);
    expect(final.state.level).toBe(2);
  });

  it('ignores repeated goal landings without scoring twice', () => {
    const session = activateFlyCombo(resetChallengeSession(1_000));
    const state = {
      ...createInitialGameState(),
      goalsReached: [true, false, false, false, false],
      score: 50,
    };
    const repeated = resolveGoalLanding(state, session, 0, false, 2_000);

    expect(repeated.accepted).toBe(false);
    expect(repeated.state).toBe(state);
    expect(repeated.session).toBe(session);
    expect(repeated.goalScore.score).toBe(0);
    expect(repeated.clearBonus.score).toBe(0);
  });
});
