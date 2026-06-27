import {
  FLY_COMBO_CHARGES,
  FLY_COMBO_MULTIPLIER,
  applyComboBonusScore,
  getLevelClearBonus,
  getTimeChallengeBonus,
  type BonusItem,
} from './gameCore';

export interface ChallengeSession {
  levelStartedAt: number;
  deathsThisLevel: number;
  flyComboCharges: number;
}

export interface ChallengeScoreResult {
  score: number;
  consumed: boolean;
  remainingCharges: number;
}

export interface ActiveTimedBonus {
  kind: BonusItem['kind'];
  expiresAt: number;
}

export function replaceActiveTimedBonus(
  _current: ActiveTimedBonus | null,
  kind: BonusItem['kind'],
  durationMs: number,
  now = Date.now(),
): ActiveTimedBonus {
  return {
    kind,
    expiresAt: now + durationMs,
  };
}

export function createChallengeSession(now = Date.now()): ChallengeSession {
  return {
    levelStartedAt: now,
    deathsThisLevel: 0,
    flyComboCharges: 0,
  };
}

export function resetChallengeSession(now = Date.now()): ChallengeSession {
  return createChallengeSession(now);
}

export function registerLevelDeath(session: ChallengeSession): ChallengeSession {
  return {
    ...session,
    deathsThisLevel: session.deathsThisLevel + 1,
  };
}

export function activateFlyCombo(session: ChallengeSession): ChallengeSession {
  return {
    ...session,
    flyComboCharges: FLY_COMBO_CHARGES,
  };
}

export function clearFlyCombo(session: ChallengeSession): ChallengeSession {
  if (session.flyComboCharges === 0) return session;
  return {
    ...session,
    flyComboCharges: 0,
  };
}

export function scoreWithFlyCombo(session: ChallengeSession, baseScore: number): { session: ChallengeSession; result: ChallengeScoreResult } {
  const combo = applyComboBonusScore(baseScore, session.flyComboCharges, FLY_COMBO_MULTIPLIER);
  const nextSession = combo.consumed
    ? { ...session, flyComboCharges: combo.remainingCharges }
    : session;

  return {
    session: nextSession,
    result: combo,
  };
}

export function computeLevelClearScore(session: ChallengeSession, now = Date.now()) {
  const perfectClearBonus = getLevelClearBonus(session.deathsThisLevel);
  const timeChallengeBonus = getTimeChallengeBonus(now - session.levelStartedAt);
  return {
    score: perfectClearBonus + timeChallengeBonus,
    perfectClearBonus,
    timeChallengeBonus,
  };
}
