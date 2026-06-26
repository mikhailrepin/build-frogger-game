import { describe, expect, it } from 'vitest';
import { generateLevel, LILY_PAD_POSITIONS, CELL_SIZE, type LaneConfig } from './gameConstants';
import {
  applyLifeLoss,
  advanceLaneItems,
  buildLaneItems,
  buildBonusItems,
  applyComboBonusScore,
  NO_DEATH_BONUS_SCORE,
  TIME_CHALLENGE_BONUS_SCORE,
  TIME_CHALLENGE_LIMIT_MS,
  getLevelClearBonus,
  getTimeChallengeBonus,
  checkCollision,
  checkBonusCollision,
  createInitialFrog,
  createInitialGameState,
  createPostWinState,
  createRoundGameState,
  findPlatformHit,
  getLaneAtRow,
  getMoveProposal,
  getRowFromY,
  isGoalColumn,
  isGoalLane,
  parseDevFlags,
  isRiverLane,
  isRoadLane,
  resolveGoalHit,
} from './gameCore';

describe('game core', () => {
  it('creates deterministic levels with the expected terminal rows', () => {
    const levelA = generateLevel(1);
    const levelB = generateLevel(1);
    const levelC = generateLevel(4);

    expect(levelA).toEqual(levelB);
    expect(levelA.modifiers).toEqual([]);
    expect(levelC.modifiers).toEqual(generateLevel(4).modifiers);
    expect(levelC.modifiers.length).toBeGreaterThan(0);
    expect(levelA.lanes[0]?.type).toBe('safe');
    expect(levelA.lanes[levelA.lanes.length - 1]?.type).toBe('decoration');
    expect(levelA.lanes.some((lane) => lane.type === 'goal')).toBe(true);
    expect(levelA.rows).toBeGreaterThanOrEqual(13);
    expect(levelA.rows).toBeLessThanOrEqual(25);
  });

  it('maps coordinates and snaps movement to the grid', () => {
    const frog = createInitialFrog(15);
    const move = getMoveProposal(frog.pos, 'up', 15);
    const doubleMove = getMoveProposal(frog.pos, 'up', 15, 2);

    expect(getRowFromY(15, frog.pos.y)).toBe(0);
    expect(move?.startPos).toEqual({ x: 300, y: 700 });
    expect(move?.targetPos).toEqual({ x: 300, y: 650 });
    expect(doubleMove?.targetPos).toEqual({ x: 300, y: 600 });
    expect(getMoveProposal({ x: 0, y: 700 }, 'left', 15)).toBeNull();
  });

  it('detects collision and platform support on river lanes', () => {
    const lanes: LaneConfig[] = [
      { type: 'safe', speed: 0, items: [] },
      { type: 'river', speed: 0.75, items: [{ width: 2, startX: 4, variant: 'turtle' }] },
      { type: 'goal', speed: 0, items: [] },
    ];
    const items = buildLaneItems(lanes, lanes.length);
    const frogY = CELL_SIZE;
    const frogX = 20;

    expect(checkCollision(frogX, frogY, items[1][0]!)).toBe(true);
    expect(findPlatformHit(frogX, frogY, lanes.length, lanes, items)).toMatchObject({
      row: 1,
      speed: 0.75,
    });
  });

  it('builds deterministic bonus pickups on safe rows', () => {
    const lanes: LaneConfig[] = [
      { type: 'safe', speed: 0, items: [] },
      { type: 'road', speed: 1, items: [] },
      { type: 'safe', speed: 0, items: [] },
      { type: 'road', speed: -1, items: [] },
      { type: 'safe', speed: 0, items: [] },
      { type: 'safe', speed: 0, items: [] },
      { type: 'safe', speed: 0, items: [] },
      { type: 'goal', speed: 0, items: [] },
      { type: 'decoration', speed: 0, items: [] },
    ];
    const items = buildBonusItems(2, lanes, lanes.length);
    const repeat = buildBonusItems(2, lanes, lanes.length);

    expect(items).toEqual(repeat);
    expect(items.length).toBeGreaterThan(0);
    expect(items.map((item) => item.kind).sort()).toEqual(['currentAnchor', 'fly', 'shield', 'superHop'].sort());
    expect(items.every((item) => item.collected === false)).toBe(true);
    expect(checkBonusCollision(items[0]!.x, items[0]!.y, items[0]!)).toBe(true);
  });

  it('applies combo bonus scoring with charge consumption', () => {
    expect(applyComboBonusScore(50, 0)).toEqual({
      score: 50,
      remainingCharges: 0,
      consumed: false,
    });
    expect(applyComboBonusScore(50, 2)).toEqual({
      score: 100,
      remainingCharges: 1,
      consumed: true,
    });
  });

  it('awards a perfect clear bonus only when the level is completed without deaths', () => {
    expect(getLevelClearBonus(0)).toBe(NO_DEATH_BONUS_SCORE);
    expect(getLevelClearBonus(1)).toBe(0);
  });

  it('awards a time challenge bonus when a level is cleared inside the limit', () => {
    expect(getTimeChallengeBonus(TIME_CHALLENGE_LIMIT_MS - 1)).toBe(TIME_CHALLENGE_BONUS_SCORE);
    expect(getTimeChallengeBonus(TIME_CHALLENGE_LIMIT_MS + 1)).toBe(0);
  });

  it('classifies lane policies by row and type', () => {
    const lanes: LaneConfig[] = [
      { type: 'safe', speed: 0, items: [] },
      { type: 'road', speed: 1, items: [] },
      { type: 'river', speed: -1, items: [] },
      { type: 'goal', speed: 0, items: [] },
    ];

    expect(getLaneAtRow(lanes, 1)).toMatchObject({ type: 'road' });
    expect(isRoadLane(lanes[1])).toBe(true);
    expect(isRiverLane(lanes[2])).toBe(true);
    expect(isGoalLane(lanes[3])).toBe(true);
    expect(getLaneAtRow(lanes, 99)).toBeNull();
  });

  it('advances lane items and wraps them back into the board', () => {
    const lanes: LaneConfig[] = [{ type: 'road', speed: 1, items: [{ width: 2, startX: 650, variant: 'sedan' }] }];
    const items = buildLaneItems(lanes, 1);
    const next = advanceLaneItems(items, lanes, 1);

    expect(next[0]?.[0]?.x).toBe(-100);
  });

  it('exposes a safe initial game state and goal columns', () => {
    const state = createInitialGameState();

    expect(state.score).toBe(0);
    expect(state.lives).toBe(3);
    expect(LILY_PAD_POSITIONS.every((col) => isGoalColumn(col * CELL_SIZE) !== -1)).toBe(true);
  });

  it('applies goal and life transitions predictably', () => {
    const state = createInitialGameState();
    const round = createRoundGameState({ ...state, score: 30, highScore: 50 }, 2, { resetScore: false });
    const postWin = createPostWinState({ ...round, gameWon: true }, 3);
    const goal = resolveGoalHit(round, 0, false);

    expect(round.level).toBe(2);
    expect(round.score).toBe(30);
    expect(postWin.gameWon).toBe(false);
    expect(goal.allDone).toBe(false);
    expect(goal.state.score).toBe(80);
    expect(applyLifeLoss({ ...state, lives: 1 }, false)).toMatchObject({ lives: 0, gameOver: true });
    expect(applyLifeLoss(state, true)).toBe(state);
  });

  it('parses dev flags only when dev mode is enabled', () => {
    expect(parseDevFlags('?god=1&speed=2')).toMatchObject({
      invulnerable: false,
      speedScale: 1,
      startLevel: 1,
    });

    expect(parseDevFlags('?dev=1&god=1&nocollide=1&speed=1.5&level=4&forcegoal=1')).toMatchObject({
      invulnerable: true,
      noRoadCollision: true,
      speedScale: 1.5,
      startLevel: 4,
      forceGoal: true,
      showCollisionBoxes: false,
    });

    expect(parseDevFlags('?dev=1&debugcollisions=1&forcelevelcomplete=1')).toMatchObject({
      showCollisionBoxes: true,
      forceLevelComplete: true,
    });

    expect(parseDevFlags('?dev=1&debugcell=1')).toMatchObject({
      showCellDebug: true,
    });

    expect(parseDevFlags('?dev=1&stepsim=1')).toMatchObject({
      stepSimulation: true,
    });
  });
});
