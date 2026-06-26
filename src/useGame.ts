import { useCallback, useEffect, useRef, useState } from 'react';
import {
  CELL_SIZE, COLS, BOARD_WIDTH, LILY_PAD_POSITIONS,
  HOP_DURATION, generateLevel, makeFrogStart,
  type Position, type Direction, type GameObject, type LaneConfig,
} from './gameConstants';
import {
  playHop, playSplash, playCrash, playGoalReached,
  playLevelComplete, playGameOver, playScore,
  startMusic, stopMusic,
} from './audio';

interface FrogState {
  pos: Position;
  startPos: Position;
  targetPos: Position;
  isHopping: boolean;
  hopStart: number;
  direction: Direction;
  alive: boolean;
  riding: boolean;
}

interface GameState {
  score: number;
  highScore: number;
  lives: number;
  level: number;
  goalsReached: boolean[];
  gameOver: boolean;
  gameWon: boolean;
  paused: boolean;
}

export function useGame() {
  // Dynamic level data
  const [levelData, setLevelData] = useState(() => generateLevel(1));
  const laneConfigsRef = useRef(levelData.lanes);
  const rowsRef = useRef(levelData.rows);
  laneConfigsRef.current = levelData.lanes;
  rowsRef.current = levelData.rows;

  // Frog factory uses current rowsRef

  const [frog, setFrog] = useState<FrogState>(() => {
    const start = makeFrogStart(levelData.rows);
    return {
      pos: { ...start }, startPos: { ...start }, targetPos: { ...start },
      isHopping: false, hopStart: 0, direction: 'up', alive: true, riding: false,
    };
  });

  const [gameState, setGameState] = useState<GameState>({
    score: 0, highScore: 0, lives: 3, level: 1,
    goalsReached: LILY_PAD_POSITIONS.map(() => false),
    gameOver: false, gameWon: false, paused: false,
  });

  const [laneItems, setLaneItems] = useState<GameObject[][]>([]);
  const [deathAnimation, setDeathAnimation] = useState(false);
  const [showSplash, setShowSplash] = useState(false);
  const [musicStarted, setMusicStarted] = useState(false);

  const animFrameRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const frogRef = useRef(frog);
  const gameStateRef = useRef(gameState);
  const laneItemsRef = useRef(laneItems);

  frogRef.current = frog;
  gameStateRef.current = gameState;
  laneItemsRef.current = laneItems;

  // Start music on first interaction
  useEffect(() => {
    if (!musicStarted) {
      const handler = () => { startMusic(); setMusicStarted(true); window.removeEventListener('keydown', handler); window.removeEventListener('click', handler); };
      window.addEventListener('keydown', handler);
      window.addEventListener('click', handler);
      return () => { window.removeEventListener('keydown', handler); window.removeEventListener('click', handler); };
    }
  }, [musicStarted]);

  const initLaneItems = useCallback((lanes: LaneConfig[], rows: number) => {
    const items: GameObject[][] = lanes.map((lane, rowIndex) => {
      return lane.items.map((item) => ({
        x: item.startX,
        y: (rows - 1 - rowIndex) * CELL_SIZE,
        width: item.width * CELL_SIZE,
        height: CELL_SIZE,
        variant: item.variant,
      }));
    });
    setLaneItems(items);
    laneItemsRef.current = items;
  }, []);

  const resetFrog = useCallback(() => {
    const start = makeFrogStart(rowsRef.current);
    setFrog({
      pos: { ...start }, startPos: { ...start }, targetPos: { ...start },
      isHopping: false, hopStart: 0, direction: 'up', alive: true, riding: false,
    });
    setDeathAnimation(false);
    setShowSplash(false);
  }, []);

  // Initialize
  useEffect(() => {
    initLaneItems(levelData.lanes, levelData.rows);
  }, [levelData, initLaneItems]);

  const getRowFromY = (y: number) => rowsRef.current - 1 - Math.round(y / CELL_SIZE);

  const checkCollision = (frogX: number, frogY: number, obj: GameObject) => {
    const m = 6;
    return frogX + m < obj.x + obj.width && frogX + CELL_SIZE - m > obj.x &&
           frogY + m < obj.y + obj.height && frogY + CELL_SIZE - m > obj.y;
  };

  const checkOnPlatform = (frogX: number, frogY: number, items: GameObject[][]) => {
    const row = getRowFromY(frogY);
    const lanes = laneConfigsRef.current;
    if (row < 0 || row >= lanes.length) return null;
    const lane = lanes[row];
    if (lane.type !== 'river') return null;
    const rowItems = items[row];
    if (!rowItems) return null;
    for (const item of rowItems) {
      if (checkCollision(frogX, frogY, item)) return { item, speed: lane.speed };
    }
    return null;
  };

  const handleDeath = useCallback((isSplash: boolean = false) => {
    if (isSplash) { setShowSplash(true); playSplash(); }
    else { playCrash(); }
    setDeathAnimation(true);
    setFrog((prev) => ({ ...prev, alive: false, isHopping: false }));
    setTimeout(() => {
      setGameState((prev) => {
        const newLives = prev.lives - 1;
        if (newLives <= 0) {
          playGameOver();
          stopMusic();
          return { ...prev, lives: 0, gameOver: true };
        }
        return { ...prev, lives: newLives };
      });
      resetFrog();
    }, 800);
  }, [resetFrog]);

  const maxRowRef = useRef(0);

  const moveFrog = useCallback((direction: Direction) => {
    const f = frogRef.current;
    const gs = gameStateRef.current;
    if (f.isHopping || !f.alive || gs.gameOver || gs.gameWon || gs.paused) return;

    let newX = f.pos.x;
    let newY = f.pos.y;
    switch (direction) {
      case 'up': newY -= CELL_SIZE; break;
      case 'down': newY += CELL_SIZE; break;
      case 'left': newX -= CELL_SIZE; break;
      case 'right': newX += CELL_SIZE; break;
    }

    const rows = rowsRef.current;
    if (newX < 0 || newX >= COLS * CELL_SIZE) return;
    if (newY < CELL_SIZE || newY >= rows * CELL_SIZE) return;

    const nearestCol = Math.round(f.pos.x / CELL_SIZE);
    const snappedX = nearestCol * CELL_SIZE;
    const snappedNewX = direction === 'left' ? snappedX - CELL_SIZE
      : direction === 'right' ? snappedX + CELL_SIZE : snappedX;

    if (snappedNewX < 0 || snappedNewX >= COLS * CELL_SIZE) return;

    playHop();

    setFrog((prev) => ({
      ...prev,
      startPos: { x: Math.round(prev.pos.x), y: Math.round(prev.pos.y) },
      targetPos: { x: snappedNewX, y: Math.round(newY) },
      isHopping: true, hopStart: performance.now(), direction,
    }));

    const newRow = getRowFromY(Math.round(newY));
    if (newRow > maxRowRef.current) {
      maxRowRef.current = newRow;
      playScore();
      setGameState((prev) => ({ ...prev, score: prev.score + 10 }));
    }
  }, []);

  // Keyboard
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const gs = gameStateRef.current;
      if (gs.gameOver || gs.gameWon) {
        if (e.key === ' ' || e.key === 'Enter') {
          const newLevel = gs.gameOver ? 1 : gs.level;
          const ld = generateLevel(newLevel);
          setLevelData(ld);
          laneConfigsRef.current = ld.lanes;
          rowsRef.current = ld.rows;
          maxRowRef.current = 0;
          if (gs.gameOver) startMusic();
          setGameState({
            score: gs.gameOver ? 0 : gs.score, highScore: gs.highScore,
            lives: 3, level: newLevel,
            goalsReached: LILY_PAD_POSITIONS.map(() => false),
            gameOver: false, gameWon: false, paused: false,
          });
          const start = makeFrogStart(ld.rows);
          setFrog({
            pos: { ...start }, startPos: { ...start }, targetPos: { ...start },
            isHopping: false, hopStart: 0, direction: 'up', alive: true, riding: false,
          });
          setDeathAnimation(false); setShowSplash(false);
          initLaneItems(ld.lanes, ld.rows);
        }
        return;
      }
      switch (e.key) {
        case 'ArrowUp': case 'w': case 'W': e.preventDefault(); moveFrog('up'); break;
        case 'ArrowDown': case 's': case 'S': e.preventDefault(); moveFrog('down'); break;
        case 'ArrowLeft': case 'a': case 'A': e.preventDefault(); moveFrog('left'); break;
        case 'ArrowRight': case 'd': case 'D': e.preventDefault(); moveFrog('right'); break;
        case 'p': case 'P': setGameState(p => ({ ...p, paused: !p.paused })); break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [moveFrog, initLaneItems]);

  // Game loop
  useEffect(() => {
    const easeOutQuad = (t: number) => t * (2 - t);
    const gameLoop = (timestamp: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = timestamp;
      lastTimeRef.current = timestamp;
      const gs = gameStateRef.current;
      if (gs.gameOver || gs.paused) { animFrameRef.current = requestAnimationFrame(gameLoop); return; }

      const f = frogRef.current;
      const lanes = laneConfigsRef.current;
      const rows = rowsRef.current;
      const speedMul = 1 + (gs.level - 1) * 0.12;

      // Update lane items
      setLaneItems((prev) => {
        const next = prev.map((rowItems, rowIndex) => {
          const lane = lanes[rowIndex];
          if (!lane || lane.speed === 0) return rowItems;
          return rowItems.map((item) => {
            let nx = item.x + lane.speed * speedMul;
            if (lane.speed > 0 && nx > BOARD_WIDTH) nx = -item.width;
            else if (lane.speed < 0 && nx + item.width < 0) nx = BOARD_WIDTH;
            return { ...item, x: nx };
          });
        });
        laneItemsRef.current = next;
        return next;
      });

      // Hop animation
      if (f.isHopping) {
        const progress = Math.min((timestamp - f.hopStart) / HOP_DURATION, 1);
        if (progress >= 1) {
          setFrog(p => ({ ...p, pos: { ...p.targetPos }, isHopping: false }));
        } else {
          const e = easeOutQuad(progress);
          setFrog(p => ({
            ...p, pos: {
              x: p.startPos.x + (p.targetPos.x - p.startPos.x) * e,
              y: p.startPos.y + (p.targetPos.y - p.startPos.y) * e,
            },
          }));
        }
      }

      // Collisions
      if (!f.isHopping && f.alive) {
        const currentRow = ROWS_FROM(rows, f.pos.y);
        const lane = lanes[currentRow];
        const items = laneItemsRef.current;
        if (lane) {
          if (lane.type === 'road') {
            const ri = items[currentRow];
            if (ri) for (const item of ri) { if (checkCollision(f.pos.x, f.pos.y, item)) { handleDeath(false); break; } }
          }
          if (lane.type === 'river') {
            const platform = checkOnPlatform(f.pos.x, f.pos.y, items);
            if (platform) {
              const nx = f.pos.x + platform.speed * speedMul;
              if (nx < -CELL_SIZE / 2 || nx > BOARD_WIDTH - CELL_SIZE / 2) handleDeath(true);
              else setFrog(p => ({
                ...p, pos: { ...p.pos, x: nx },
                startPos: { ...p.startPos, x: p.startPos.x + platform.speed * speedMul },
                targetPos: { ...p.targetPos, x: p.targetPos.x + platform.speed * speedMul },
                riding: true,
              }));
            } else handleDeath(true);
          }
          if (lane.type === 'goal') {
            const frogCol = Math.round(f.pos.x / CELL_SIZE);
            const idx = LILY_PAD_POSITIONS.indexOf(frogCol);
            if (idx !== -1 && !gs.goalsReached[idx]) {
              maxRowRef.current = 0;
              playGoalReached();
              setGameState(p => {
                const ng = [...p.goalsReached]; ng[idx] = true;
                const allDone = ng.every(Boolean);
                if (allDone) playLevelComplete();
                const ns = p.score + 50;
                return { ...p, score: ns, highScore: Math.max(p.highScore, ns),
                  goalsReached: ng, gameWon: allDone,
                  level: allDone ? p.level + 1 : p.level };
              });
              resetFrog();
            } else handleDeath(false);
          }
        }
      }
      animFrameRef.current = requestAnimationFrame(gameLoop);
    };
    animFrameRef.current = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [handleDeath, resetFrog]);

  // Level complete — advance
  useEffect(() => {
    if (gameState.gameWon) {
      const t = setTimeout(() => {
        const newLevel = gameState.level;
        const ld = generateLevel(newLevel);
        setLevelData(ld);
        laneConfigsRef.current = ld.lanes;
        rowsRef.current = ld.rows;
        maxRowRef.current = 0;
        setGameState(p => ({ ...p, goalsReached: LILY_PAD_POSITIONS.map(() => false), gameWon: false }));
        const start = makeFrogStart(ld.rows);
        setFrog({
          pos: { ...start }, startPos: { ...start }, targetPos: { ...start },
          isHopping: false, hopStart: 0, direction: 'up', alive: true, riding: false,
        });
        setDeathAnimation(false); setShowSplash(false);
        initLaneItems(ld.lanes, ld.rows);
      }, 2000);
      return () => clearTimeout(t);
    }
  }, [gameState.gameWon, gameState.level, resetFrog, initLaneItems]);

  return { frog, gameState, laneItems, deathAnimation, showSplash, moveFrog,
    laneConfigs: levelData.lanes, totalRows: levelData.rows };
}

function ROWS_FROM(rows: number, y: number) {
  return rows - 1 - Math.round(y / CELL_SIZE);
}
