export const CELL_SIZE = 50;
export const COLS = 13;
export const BOARD_WIDTH = COLS * CELL_SIZE;
export const PLAYABLE_TOP_Y = CELL_SIZE;
export const BOARD_EDGE_BUFFER = CELL_SIZE / 2;

export type Direction = 'up' | 'down' | 'left' | 'right';
export type LaneType = 'safe' | 'road' | 'river' | 'goal' | 'decoration';
export type LevelModifier = 'rain' | 'nightTraffic' | 'fastCurrent' | 'narrowPlatforms';

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

export interface LevelData {
  lanes: LaneConfig[];
  rows: number;
  modifiers: LevelModifier[];
}

export interface LevelValidationIssue {
  code: string;
  message: string;
}

export interface LevelValidationResult {
  valid: boolean;
  issues: LevelValidationIssue[];
}

export const LILY_PAD_POSITIONS = [0, 3, 6, 9, 12];

export const HOP_DURATION = 110;

export function getLevelSeed(level: number) {
  return level * 7919 + 42;
}

/* ══════ PROCEDURAL LEVEL GENERATION ══════ */

const ROAD_VARIANTS = ['sedan', 'sports', 'truck', 'taxi', 'bus'];
const MODIFIER_POOL: LevelModifier[] = ['rain', 'nightTraffic', 'fastCurrent', 'narrowPlatforms'];
const MECHANICAL_MODIFIERS: LevelModifier[] = ['nightTraffic', 'fastCurrent', 'narrowPlatforms'];

function seededRng(seed: number) {
  let s = seed;
  return () => { s = (s * 16807 + 0) % 2147483647; return (s - 1) / 2147483646; };
}

function pickLevelModifiers(rng: () => number, level: number): LevelModifier[] {
  if (level <= 1) return [];

  const count = Math.min(2, level >= 4 ? 2 : 1);
  const modifiers: LevelModifier[] = [];
  const pool = [...MODIFIER_POOL];

  while (modifiers.length < count && pool.length > 0) {
    const index = Math.floor(rng() * pool.length);
    modifiers.push(pool.splice(index, 1)[0]!);
  }

  return modifiers;
}

function addIssue(issues: LevelValidationIssue[], code: string, message: string) {
  issues.push({ code, message });
}

export function validateLevelData(levelData: LevelData, level = 1): LevelValidationResult {
  const issues: LevelValidationIssue[] = [];
  const { lanes, rows, modifiers } = levelData;

  if (!Array.isArray(lanes) || lanes.length < 5) {
    addIssue(issues, 'lane_count', 'A generated level must contain at least five lanes.');
  }

  if (!Number.isInteger(rows) || rows !== lanes.length) {
    addIssue(issues, 'row_count', 'Level rows must match the lane count.');
  }

  const firstLane = lanes[0];
  const lastLane = lanes[lanes.length - 1];
  const goalLaneIndex = lanes.findIndex((lane) => lane.type === 'goal');
  const roadCount = lanes.filter((lane) => lane.type === 'road').length;
  const riverCount = lanes.filter((lane) => lane.type === 'river').length;
  const safeCount = lanes.filter((lane) => lane.type === 'safe').length;

  if (firstLane?.type !== 'safe') {
    addIssue(issues, 'start_lane', 'The first lane must be a safe starting lane.');
  }

  if (lastLane?.type !== 'decoration') {
    addIssue(issues, 'end_lane', 'The last lane must be a decoration row.');
  }

  if (goalLaneIndex !== lanes.length - 2) {
    addIssue(issues, 'goal_lane', 'The goal lane must sit directly before the decoration row.');
  }

  if (roadCount === 0 || riverCount === 0) {
    addIssue(issues, 'lane_mix', 'A fair level must include both road and river lanes.');
  }

  if (safeCount < 2) {
    addIssue(issues, 'safe_rows', 'A fair level must retain at least two safe rows.');
  }

  const uniqueModifiers = new Set(modifiers);
  if (uniqueModifiers.size !== modifiers.length) {
    addIssue(issues, 'duplicate_modifiers', 'Modifier selections must not contain duplicates.');
  }

  if (modifiers.length > 2) {
    addIssue(issues, 'modifier_count', 'A generated level may not use more than two modifiers.');
  }

  for (const modifier of modifiers) {
    if (!MODIFIER_POOL.includes(modifier)) {
      addIssue(issues, 'unknown_modifier', `Unknown modifier: ${modifier}`);
    }
  }

  const mechanicalModifierCount = modifiers.filter((modifier) => MECHANICAL_MODIFIERS.includes(modifier)).length;
  const maxMechanicalModifiers = level >= 4 ? 2 : level <= 1 ? 0 : 1;
  if (mechanicalModifierCount > maxMechanicalModifiers) {
    addIssue(issues, 'mechanical_modifier_budget', 'The level uses too many gameplay modifiers for its tier.');
  }

  if (modifiers.includes('nightTraffic') && roadCount === 0) {
    addIssue(issues, 'nightTraffic_effect', 'nightTraffic requires at least one road lane.');
  }

  if ((modifiers.includes('fastCurrent') || modifiers.includes('narrowPlatforms')) && riverCount === 0) {
    addIssue(issues, 'river_effect', 'River modifiers require at least one river lane.');
  }

  if (modifiers.includes('narrowPlatforms')) {
    const maxRiverWidth = lanes
      .filter((lane) => lane.type === 'river')
      .flatMap((lane) => lane.items.map((item) => item.width))
      .reduce((max, width) => Math.max(max, width), 0);

    if (maxRiverWidth > 4) {
      addIssue(issues, 'narrow_platforms', 'narrowPlatforms must reduce river platform widths.');
    }
  }

  for (const lane of lanes) {
    if (!Number.isFinite(lane.speed)) {
      addIssue(issues, 'speed', 'Lane speeds must always be finite numbers.');
    }

    if (lane.type === 'road') {
      if (lane.items.length < 2) {
        addIssue(issues, 'road_items', 'Road lanes must contain multiple hazards.');
      }
      for (const item of lane.items) {
        if (item.width < 2 || item.width > 3) {
          addIssue(issues, 'road_item_width', 'Road hazards must stay within the expected width bounds.');
        }
      }
    }

    if (lane.type === 'river') {
      if (lane.items.length < 2) {
        addIssue(issues, 'river_items', 'River lanes must contain multiple platforms.');
      }
      for (const item of lane.items) {
        if (item.width < 2 || item.width > 5) {
          addIssue(issues, 'river_item_width', 'River platforms must stay within the expected width bounds.');
        }
      }
    }
  }

  return {
    valid: issues.length === 0,
    issues,
  };
}

export function assertValidLevelData(levelData: LevelData, level = 1) {
  const result = validateLevelData(levelData, level);
  if (!result.valid) {
    const details = result.issues.map((issue) => `${issue.code}: ${issue.message}`).join('; ');
    throw new Error(`Invalid generated level ${level}: ${details}`);
  }
}

function genRoadLane(rng: () => number, level: number, modifiers: LevelModifier[]): LaneConfig {
  const dir = rng() > 0.5 ? 1 : -1;
  const baseSpeed = 0.7 + rng() * 1.2 + level * 0.08;
  const modifierSpeed = modifiers.includes('nightTraffic') ? 1.12 : 1;
  const speed = dir * baseSpeed * modifierSpeed;
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

function genRiverLane(rng: () => number, level: number, modifiers: LevelModifier[]): LaneConfig {
  const dir = rng() > 0.5 ? 1 : -1;
  const baseSpeed = 0.5 + rng() * 1.0 + level * 0.06;
  const modifierSpeed = modifiers.includes('fastCurrent') ? 1.15 : 1;
  const speed = dir * baseSpeed * modifierSpeed;
  const isTurtle = rng() > 0.65;
  const variant = isTurtle ? 'turtle' : undefined;
  const platformWidth = modifiers.includes('narrowPlatforms') ? -1 : 0;
  const w = isTurtle ? Math.max(2, 3 + platformWidth) : Math.max(2, 3 + Math.floor(rng() * 3) + platformWidth);
  const count = isTurtle ? (2 + Math.floor(rng() * 2)) : 2;
  const spacing = BOARD_WIDTH / count;
  const items: ItemConfig[] = [];
  for (let i = 0; i < count; i++) {
    items.push({ width: isTurtle ? 3 : w, startX: Math.floor(rng() * spacing * 0.5 + i * spacing) % BOARD_WIDTH, variant });
  }
  return { type: 'river', speed, items };
}

export function generateLevel(level: number): LevelData {
  const rng = seededRng(getLevelSeed(level));
  const modifiers = pickLevelModifiers(rng, level);

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
        middleLanes.push(genRoadLane(rng, level, modifiers));
      } else {
        middleLanes.push(genRiverLane(rng, level, modifiers));
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

  const levelData = { lanes, rows: lanes.length, modifiers };
  assertValidLevelData(levelData, level);
  return levelData;
}

// Default level 1 for initial state
const defaultLevel = generateLevel(1);
export const LANE_CONFIGS = defaultLevel.lanes;
export const ROWS = defaultLevel.rows;
export const DEFAULT_LEVEL_MODIFIERS = defaultLevel.modifiers;

export function makeFrogStart(rows: number): Position {
  return {
    x: Math.floor(COLS / 2) * CELL_SIZE,
    y: (rows - 1) * CELL_SIZE,
  };
}

export const FROG_START = makeFrogStart(ROWS);
