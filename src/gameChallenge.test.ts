import { describe, expect, it } from 'vitest';
import {
  activateFlyCombo,
  clearFlyCombo,
  computeLevelClearScore,
  createChallengeSession,
  registerLevelDeath,
  replaceActiveTimedBonus,
  resetChallengeSession,
  scoreWithFlyCombo,
} from './gameChallenge';

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
});
