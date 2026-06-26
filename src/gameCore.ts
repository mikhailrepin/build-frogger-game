import {
  BOARD_WIDTH,
  CELL_SIZE,
  COLS,
  LILY_PAD_POSITIONS,
  PLAYABLE_TOP_Y,
  type Direction,
  type GameObject,
  type LaneConfig,
  type Position,
} from './gameConstants';

export interface FrogState {
  pos: Position;
  startPos: Position;
  targetPos: Position;
  isHopping: boolean;
  hopStart: number;
  direction: Direction;
  alive: boolean;
  riding: boolean;
}

export interface GameState {
  score: number;
  highScore: number;
  lives: number;
  level: number;
  goalsReached: boolean[];
  gameOver: boolean;
  gameWon: boolean;
  paused: boolean;
}

export interface DevFlags {
  invulnerable: boolean;
  noRoadCollision: boolean;
  noRiverDeath: boolean;
  infiniteLives: boolean;
  speedScale: number;
  startLevel: number;
  forceGoal: boolean;
  forceLevelComplete: boolean;
  showCollisionBoxes: boolean;
  showCellDebug: boolean;
  stepSimulation: boolean;
}

export interface MoveProposal {
  startPos: Position;
  targetPos: Position;
}

export interface PlatformHit {
  item: GameObject;
  speed: number;
  row: number;
}

export interface GoalResolution {
  state: GameState;
  allDone: boolean;
}

export interface BonusItem {
  x: number;
  y: number;
  width: number;
  height: number;
  kind: 'shield' | 'slowTime' | 'currentAnchor' | 'superHop' | 'fly';
  collected: boolean;
}

export const ROW_PROGRESS_SCORE = 10;
export const GOAL_SCORE = 50;
export const BONUS_SCORE = 100;
export const FLY_BONUS_SCORE = 150;
export const NO_DEATH_BONUS_SCORE = 300;
export const TIME_CHALLENGE_BONUS_SCORE = 200;
export const TIME_CHALLENGE_LIMIT_MS = 120000;
export const SHIELD_DURATION_MS = 6000;
export const SLOW_TIME_DURATION_MS = 5000;
export const CURRENT_ANCHOR_DURATION_MS = 6000;
export const SUPER_HOP_DURATION_MS = 6000;
export const FLY_COMBO_DURATION_MS = 8000;
export const FLY_COMBO_MULTIPLIER = 2;
export const FLY_COMBO_CHARGES = 3;
export const SLOW_TIME_FACTOR = 0.65;

export function createInitialFrog(rows: number): FrogState {
  const start = {
    x: Math.floor(COLS / 2) * CELL_SIZE,
    y: (rows - 1) * CELL_SIZE,
  };

  return {
    pos: { ...start },
    startPos: { ...start },
    targetPos: { ...start },
    isHopping: false,
    hopStart: 0,
    direction: 'up',
    alive: true,
    riding: false,
  };
}

export function createInitialGameState(): GameState {
  return {
    score: 0,
    highScore: 0,
    lives: 3,
    level: 1,
    goalsReached: LILY_PAD_POSITIONS.map(() => false),
    gameOver: false,
    gameWon: false,
    paused: false,
  };
}

export function createRoundGameState(
  prev: GameState,
  level: number,
  options: { resetScore: boolean },
): GameState {
  return {
    score: options.resetScore ? 0 : prev.score,
    highScore: prev.highScore,
    lives: 3,
    level,
    goalsReached: LILY_PAD_POSITIONS.map(() => false),
    gameOver: false,
    gameWon: false,
    paused: false,
  };
}

export function createPostWinState(prev: GameState, level: number): GameState {
  return {
    ...prev,
    goalsReached: LILY_PAD_POSITIONS.map(() => false),
    gameWon: false,
    level,
  };
}

export function getRowFromY(rows: number, y: number) {
  return rows - 1 - Math.round(y / CELL_SIZE);
}

export function isWithinBoard(x: number, y: number, rows: number) {
  return x >= 0 && x < COLS * CELL_SIZE && y >= PLAYABLE_TOP_Y && y < rows * CELL_SIZE;
}

export function getMoveProposal(
  pos: Position,
  direction: Direction,
  rows: number,
  stepCells = 1,
): MoveProposal | null {
  const cells = Math.max(1, Math.floor(stepCells));
  let newX = pos.x;
  let newY = pos.y;

  switch (direction) {
    case 'up':
      newY -= CELL_SIZE * cells;
      break;
    case 'down':
      newY += CELL_SIZE * cells;
      break;
    case 'left':
      newX -= CELL_SIZE * cells;
      break;
    case 'right':
      newX += CELL_SIZE * cells;
      break;
  }

  if (!isWithinBoard(newX, newY, rows)) return null;

  const nearestCol = Math.round(pos.x / CELL_SIZE);
  const snappedX = nearestCol * CELL_SIZE;
  const snappedNewX = direction === 'left'
    ? snappedX - CELL_SIZE
    : direction === 'right'
      ? snappedX + CELL_SIZE
      : snappedX;

  if (snappedNewX < 0 || snappedNewX >= COLS * CELL_SIZE) return null;

  return {
    startPos: { x: Math.round(pos.x), y: Math.round(pos.y) },
    targetPos: { x: snappedNewX, y: Math.round(newY) },
  };
}

export function checkCollision(frogX: number, frogY: number, obj: GameObject) {
  const m = 6;
  return frogX + m < obj.x + obj.width &&
    frogX + CELL_SIZE - m > obj.x &&
    frogY + m < obj.y + obj.height &&
    frogY + CELL_SIZE - m > obj.y;
}

export function buildLaneItems(lanes: LaneConfig[], rows: number) {
  return lanes.map((lane, rowIndex) => lane.items.map((item) => ({
    x: item.startX,
    y: (rows - 1 - rowIndex) * CELL_SIZE,
    width: item.width * CELL_SIZE,
    height: CELL_SIZE,
    variant: item.variant,
  })));
}

function seededRng(seed: number) {
  let value = seed;
  return () => {
    value = (value * 48271) % 2147483647;
    return (value - 1) / 2147483646;
  };
}

export function buildBonusItems(level: number, lanes: LaneConfig[], rows: number): BonusItem[] {
  const rng = seededRng(level * 109 + rows * 17);
  const safeRows = lanes
    .map((lane, rowIndex) => (lane.type === 'safe' && rowIndex > 0 && rowIndex < lanes.length - 2 ? rowIndex : -1))
    .filter((row) => row >= 0);
  if (safeRows.length === 0) return [];

  const count = Math.min(5, safeRows.length);
  const bonusKinds: BonusItem['kind'][] = ['shield', 'slowTime', 'currentAnchor', 'superHop', 'fly'];
  const startOffset = level % bonusKinds.length;
  const items: BonusItem[] = [];
  for (let i = 0; i < count; i++) {
    const rowIndex = safeRows[Math.floor(rng() * safeRows.length)];
    const baseX = Math.floor(rng() * (COLS - 2) + 1) * CELL_SIZE;
    items.push({
      x: baseX,
      y: (rows - 1 - rowIndex) * CELL_SIZE,
      width: CELL_SIZE * 0.5,
      height: CELL_SIZE * 0.5,
      kind: bonusKinds[(startOffset + i) % bonusKinds.length],
      collected: false,
    });
  }
  return items;
}

export function checkBonusCollision(frogX: number, frogY: number, bonus: BonusItem) {
  const m = 10;
  return frogX + m < bonus.x + bonus.width &&
    frogX + CELL_SIZE - m > bonus.x &&
    frogY + m < bonus.y + bonus.height &&
    frogY + CELL_SIZE - m > bonus.y;
}

export function getLaneAtRow(lanes: LaneConfig[], row: number) {
  return lanes[row] ?? null;
}

export function isRoadLane(lane: LaneConfig | null | undefined) {
  return lane?.type === 'road';
}

export function isRiverLane(lane: LaneConfig | null | undefined) {
  return lane?.type === 'river';
}

export function isGoalLane(lane: LaneConfig | null | undefined) {
  return lane?.type === 'goal';
}

export function advanceLaneItems(
  prev: GameObject[][],
  lanes: LaneConfig[],
  speedMul: number,
) {
  return prev.map((rowItems, rowIndex) => {
    const lane = lanes[rowIndex];
    if (!lane || lane.speed === 0) return rowItems;
    return rowItems.map((item) => {
      let nx = item.x + lane.speed * speedMul;
      if (lane.speed > 0 && nx > BOARD_WIDTH) nx = -item.width;
      else if (lane.speed < 0 && nx + item.width < 0) nx = BOARD_WIDTH;
      return { ...item, x: nx };
    });
  });
}

export function findPlatformHit(
  frogX: number,
  frogY: number,
  rows: number,
  lanes: LaneConfig[],
  items: GameObject[][],
): PlatformHit | null {
  const row = getRowFromY(rows, frogY);
  if (row < 0 || row >= lanes.length) return null;
  const lane = lanes[row];
  if (!lane || lane.type !== 'river') return null;

  const rowItems = items[row];
  if (!rowItems) return null;

  for (const item of rowItems) {
    if (checkCollision(frogX, frogY, item)) {
      return { item, speed: lane.speed, row };
    }
  }

  return null;
}

export function isGoalColumn(frogX: number) {
  const frogCol = Math.round(frogX / CELL_SIZE);
  return LILY_PAD_POSITIONS.indexOf(frogCol);
}

export function parseDevFlags(search: string) {
  const params = new URLSearchParams(search);
  const enabled = params.get('dev') === '1' || params.get('dev') === 'true';
  const flag = (name: string) => enabled && (params.get(name) === '1' || params.get(name) === 'true');
  const number = (name: string, fallback: number) => {
    if (!enabled) return fallback;
    const value = Number(params.get(name));
    return Number.isFinite(value) && value > 0 ? value : fallback;
  };

  return {
    invulnerable: flag('god'),
    noRoadCollision: flag('nocollide'),
    noRiverDeath: flag('noriverdeath'),
    infiniteLives: flag('infinitelives'),
    speedScale: number('speed', 1),
    startLevel: number('level', 1),
    forceGoal: flag('forcegoal'),
    forceLevelComplete: flag('forcelevelcomplete'),
    showCollisionBoxes: flag('debugcollisions'),
    showCellDebug: flag('debugcell'),
    stepSimulation: flag('stepsim'),
  } satisfies DevFlags;
}

export function applyLifeLoss(prev: GameState, infiniteLives: boolean) {
  if (infiniteLives) return prev;
  const newLives = prev.lives - 1;
  if (newLives <= 0) {
    return { ...prev, lives: 0, gameOver: true };
  }
  return { ...prev, lives: newLives };
}

export function resolveGoalHit(
  prev: GameState,
  goalIdx: number,
  forceLevelComplete = false,
  scoreBonus = GOAL_SCORE,
): GoalResolution {
  const nextGoals = [...prev.goalsReached];
  nextGoals[goalIdx] = true;
  const allDone = forceLevelComplete || nextGoals.every(Boolean);
  const nextScore = prev.score + scoreBonus;

  return {
    state: {
      ...prev,
      score: nextScore,
      highScore: Math.max(prev.highScore, nextScore),
      goalsReached: nextGoals,
      gameWon: allDone,
      level: allDone ? prev.level + 1 : prev.level,
    },
    allDone,
  };
}

export interface ComboBonusResult {
  score: number;
  remainingCharges: number;
  consumed: boolean;
}

export function applyComboBonusScore(baseScore: number, comboCharges: number, multiplier = FLY_COMBO_MULTIPLIER): ComboBonusResult {
  if (comboCharges <= 0) {
    return {
      score: baseScore,
      remainingCharges: 0,
      consumed: false,
    };
  }

  return {
    score: baseScore * multiplier,
    remainingCharges: comboCharges - 1,
    consumed: true,
  };
}

export function getLevelClearBonus(deathsThisLevel: number) {
  return deathsThisLevel === 0 ? NO_DEATH_BONUS_SCORE : 0;
}

export function getTimeChallengeBonus(elapsedMs: number, limitMs = TIME_CHALLENGE_LIMIT_MS) {
  return elapsedMs <= limitMs ? TIME_CHALLENGE_BONUS_SCORE : 0;
}
