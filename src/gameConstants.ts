export const CELL_SIZE = 50;
export const COLS = 13;
export const BOARD_WIDTH = COLS * CELL_SIZE;

export type Direction = 'up' | 'down' | 'left' | 'right';
export type LaneType = 'safe' | 'road' | 'river' | 'goal' | 'decoration';

export interface LaneConfig {
  type: LaneType;
  speed: number;
  items: ItemConfig[];
}

export interface ItemConfig {
  width: number;
  startX: number;
  variant?: string;
}

export interface Position { x: number; y: number; }

export interface GameObject {
  x: number; y: number;
  width: number; height: number;
  variant?: string;
}

export const LILY_PAD_POSITIONS = [0, 3, 6, 9, 12];

export const HOP_DURATION = 110;

/* ══════ PROCEDURAL LEVEL GENERATION ══════ */

const ROAD_VARIANTS = ['sedan', 'sports', 'truck', 'taxi', 'bus'];

function seededRng(seed: number) {
  let s = seed;
  return () => { s = (s * 16807 + 0) % 2147483647; return (s - 1) / 2147483646; };
}

function genRoadLane(rng: () => number, level: number): LaneConfig {
  const dir = rng() > 0.5 ? 1 : -1;
  const baseSpeed = 0.7 + rng() * 1.2 + level * 0.08;
  const speed = dir * baseSpeed;
  const variant = ROAD_VARIANTS[Math.floor(rng() * ROAD_VARIANTS.length)];
  const isBig = variant === 'truck' || variant === 'bus';
  const w = isBig ? 3 : 2;
  const count = isBig ? 2 : (2 + Math.floor(rng() * 2));
  const spacing = BOARD_WIDTH / count;
  const items: ItemConfig[] = [];
  for (let i = 0; i < count; i++) {
    items.push({ width: w, startX: Math.floor(rng() * spacing + i * spacing) % BOARD_WIDTH, variant });
  }
  return { type: 'road', speed, items };
}

function genRiverLane(rng: () => number, level: number): LaneConfig {
  const dir = rng() > 0.5 ? 1 : -1;
  const baseSpeed = 0.5 + rng() * 1.0 + level * 0.06;
  const speed = dir * baseSpeed;
  const isTurtle = rng() > 0.65;
  const variant = isTurtle ? 'turtle' : undefined;
  const w = isTurtle ? 3 : (3 + Math.floor(rng() * 3));
  const count = isTurtle ? (2 + Math.floor(rng() * 2)) : 2;
  const spacing = BOARD_WIDTH / count;
  const items: ItemConfig[] = [];
  for (let i = 0; i < count; i++) {
    items.push({ width: isTurtle ? 3 : w, startX: Math.floor(rng() * spacing * 0.5 + i * spacing) % BOARD_WIDTH, variant });
  }
  return { type: 'river', speed, items };
}

export interface LevelData {
  lanes: LaneConfig[];
  rows: number;
}

export function generateLevel(level: number): LevelData {
  const rng = seededRng(level * 7919 + 42);

  // Level size grows: 15 rows for level 1, +2 per level, max 25
  const baseMiddle = 10; // road + river lanes
  const extraLanes = Math.min(level - 1, 5) * 2;
  const middleCount = baseMiddle + extraLanes;

  // Generate middle lanes — mix of road and river sections
  // Each section is 2-5 lanes of the same type, separated by safe zones
  const middleLanes: LaneConfig[] = [];
  let remaining = middleCount;
  let lastType: 'road' | 'river' = rng() > 0.5 ? 'road' : 'river';

  while (remaining > 0) {
    const sectionLen = Math.min(remaining, 2 + Math.floor(rng() * 3));

    for (let i = 0; i < sectionLen; i++) {
      if (lastType === 'road') {
        middleLanes.push(genRoadLane(rng, level));
      } else {
        middleLanes.push(genRiverLane(rng, level));
      }
    }
    remaining -= sectionLen;

    // Add safe zone between sections (if more lanes remain)
    if (remaining > 0) {
      middleLanes.push({ type: 'safe', speed: 0, items: [] });
      remaining -= 1;
      lastType = lastType === 'road' ? 'river' : 'road';
    }
  }

  // Full lane layout: start + middle + bank + goal + decoration
  const lanes: LaneConfig[] = [
    { type: 'safe', speed: 0, items: [] },  // row 0: start
    ...middleLanes,
    { type: 'safe', speed: 0, items: [] },  // bank before goal
    { type: 'goal', speed: 0, items: [] },  // goal
    { type: 'decoration', speed: 0, items: [] }, // top
  ];

  return { lanes, rows: lanes.length };
}

// Default level 1 for initial state
const defaultLevel = generateLevel(1);
export const LANE_CONFIGS = defaultLevel.lanes;
export const ROWS = defaultLevel.rows;

export function makeFrogStart(rows: number): Position {
  return {
    x: Math.floor(COLS / 2) * CELL_SIZE,
    y: (rows - 1) * CELL_SIZE,
  };
}

export const FROG_START = makeFrogStart(ROWS);
