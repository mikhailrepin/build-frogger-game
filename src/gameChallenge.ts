import {
  FLY_COMBO_CHARGES,
  FLY_COMBO_MULTIPLIER,
  GOAL_SCORE,
  applyComboBonusScore,
  getLevelClearBonus,
  getTimeChallengeBonus,
  resolveGoalHit,
  type BonusItem,
  type GameState,
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

export interface GoalLandingResult {
  accepted: boolean;
  allDone: boolean;
  clearBonus: ReturnType<typeof computeLevelClearScore>;
  goalScore: ChallengeScoreResult;
  session: ChallengeSession;
  state: GameState;
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

export function resolveGoalLanding(
  state: GameState,
  session: ChallengeSession,
  goalIdx: number,
  forceLevelComplete = false,
  now = Date.now(),
): GoalLandingResult {
  const emptyClearBonus = {
    score: 0,
    perfectClearBonus: 0,
    timeChallengeBonus: 0,
  };
  const unchangedGoalScore: ChallengeScoreResult = {
    score: 0,
    consumed: false,
    remainingCharges: session.flyComboCharges,
  };

  if (
    state.gameWon
    || goalIdx < 0
    || goalIdx >= state.goalsReached.length
    || state.goalsReached[goalIdx]
  ) {
    return {
      accepted: false,
      allDone: state.gameWon,
      clearBonus: emptyClearBonus,
      goalScore: unchangedGoalScore,
      session,
      state,
    };
  }

  const scoredGoal = scoreWithFlyCombo(session, GOAL_SCORE);
  const willComplete = forceLevelComplete
    || state.goalsReached.every((reached, index) => reached || index === goalIdx);
  const clearBonus = willComplete
    ? computeLevelClearScore(scoredGoal.session, now)
    : emptyClearBonus;
  const resolution = resolveGoalHit(
    state,
    goalIdx,
    forceLevelComplete,
    scoredGoal.result.score + clearBonus.score,
  );

  return {
    accepted: true,
    allDone: resolution.allDone,
    clearBonus,
    goalScore: scoredGoal.result,
    session: scoredGoal.session,
    state: resolution.state,
  };
}
