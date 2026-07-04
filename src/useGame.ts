import { useCallback, useEffect, useRef, useState } from 'react';
import {
  BOARD_WIDTH,
  BOARD_EDGE_BUFFER,
  HOP_DURATION,
  getLevelSeed,
  generateLevel,
  type Direction,
  type GameObject,
  type LaneConfig,
} from './gameConstants';
import {
  advanceLaneItems,
  buildLaneItems,
  buildBonusItems,
  checkCollision,
  checkBonusCollision,
  applyLifeLoss,
  createInitialFrog,
  createInitialGameState,
  createPostWinState,
  createRoundGameState,
  findPlatformHit,
  getPlatformRideHit,
  getMoveProposal,
  getLaneAtRow,
  getRowFromY,
  isGoalColumn,
  isGoalLane,
  isRiverLane,
  isRoadLane,
  parseDevFlags,
  resolveGoalHit,
  ROW_PROGRESS_SCORE,
  GOAL_SCORE,
  BONUS_SCORE,
  FLY_BONUS_SCORE,
  SHIELD_DURATION_MS,
  SLOW_TIME_DURATION_MS,
  CURRENT_ANCHOR_DURATION_MS,
  SUPER_HOP_DURATION_MS,
  FLY_COMBO_DURATION_MS,
  SLOW_TIME_FACTOR,
  type DevFlags,
  type FrogState,
  type GameState,
  type BonusItem,
  type PlatformRide,
} from './gameCore';
import {
  activateFlyCombo as activateFlyComboSession,
  clearFlyCombo as clearFlyComboSession,
  computeLevelClearScore,
  createChallengeSession,
  registerLevelDeath,
  replaceActiveTimedBonus,
  resetChallengeSession,
  scoreWithFlyCombo,
  type ActiveTimedBonus,
  type ChallengeSession,
} from './gameChallenge';
import { loadHighScore, saveHighScore } from './highScoreStorage';
import { recordGameEvent } from './gameMetrics';
import { flushGameMetrics } from './gameMetricsStorage';
import {
  compareReplaySummaries,
  createReplayRecorder,
  resolveReplaySnapshotFromSearch,
  saveReplaySnapshot,
  shouldRecordReplayFromSearch,
  summarizeReplayState,
  type ReplayInputSource,
  type ReplayRecorder,
  type ReplaySnapshot,
} from './gameReplay';
import {
  playHop,
  playSplash,
  playCrash,
  playGoalReached,
  playLevelComplete,
  playGameOver,
  playBonusCollected,
  playScore,
  startMusic,
  stopAllGameSounds,
  stopGameSoundGroup,
  stopMusic,
} from './audio';
import { getKeyboardGameAction } from './gameInput';

type ActiveBonusHud = {
  kind: BonusItem['kind'];
  remainingSeconds: number;
};

export function useGame() {
  const search = typeof window !== 'undefined' ? window.location.search : '';
  const devFlagsRef = useRef<DevFlags>(
    parseDevFlags(search),
  );
  const replayPlaybackSnapshotRef = useRef<ReplaySnapshot | null>(resolveReplaySnapshotFromSearch(search));
  const recordReplayEnabled = shouldRecordReplayFromSearch(search);
  const initialLevel = replayPlaybackSnapshotRef.current?.level ?? devFlagsRef.current.startLevel;
  const initialLevelSeed = getLevelSeed(initialLevel);
  const initialLevelData = useRef(generateLevel(initialLevel)).current;

  const [levelData, setLevelData] = useState(() => initialLevelData);
  const laneConfigsRef = useRef(levelData.lanes);
  const rowsRef = useRef(levelData.rows);
  laneConfigsRef.current = levelData.lanes;
  rowsRef.current = levelData.rows;

  const frogRef = useRef<FrogState>(createInitialFrog(levelData.rows));
  const [gameState, setGameState] = useState<GameState>(() => ({
    ...createInitialGameState(),
    highScore: loadHighScore(),
    paused: devFlagsRef.current.stepSimulation,
  }));

  const [laneItems, setLaneItems] = useState<GameObject[][]>(() => buildLaneItems(levelData.lanes, levelData.rows));
  const [bonusItems, setBonusItems] = useState<BonusItem[]>(() => buildBonusItems(initialLevel, initialLevelData.lanes, initialLevelData.rows));
  const [shieldActive, setShieldActive] = useState(false);
  const [slowTimeActive, setSlowTimeActive] = useState(false);
  const [currentAnchorActive, setCurrentAnchorActive] = useState(false);
  const [superHopActive, setSuperHopActive] = useState(false);
  const [flyComboActive, setFlyComboActive] = useState(false);
  const [featuredBonus, setFeaturedBonus] = useState<ActiveTimedBonus | null>(null);
  const [challengeBonus, setChallengeBonus] = useState(0);
  const [hudClockNow, setHudClockNow] = useState(() => Date.now());
  const [deathAnimation, setDeathAnimation] = useState(false);
  const [showSplash, setShowSplash] = useState(false);
  const [musicStarted, setMusicStarted] = useState(false);
  const replayRecorderRef = useRef<ReplayRecorder | null>(null);
  const platformRideRef = useRef<PlatformRide | null>(null);

  const animFrameRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const deathTimeoutRef = useRef<number | null>(null);
  const levelTimeoutRef = useRef<number | null>(null);
  const shieldTimeoutRef = useRef<number | null>(null);
  const slowTimeTimeoutRef = useRef<number | null>(null);
  const currentAnchorTimeoutRef = useRef<number | null>(null);
  const superHopTimeoutRef = useRef<number | null>(null);
  const flyComboTimeoutRef = useRef<number | null>(null);
  const challengeSessionRef = useRef<ChallengeSession>(createChallengeSession(Date.now()));
  const stepRequestedRef = useRef(false);
  const firstMoveRecordedRef = useRef(false);
  const gameOverSoundPlayedRef = useRef(false);
  const levelCompleteSoundPlayedRef = useRef(false);
  const gameStateRef = useRef(gameState);
  const laneItemsRef = useRef(laneItems);
  const bonusItemsRef = useRef(bonusItems);
  const shieldActiveRef = useRef(false);
  const slowTimeActiveRef = useRef(false);
  const currentAnchorActiveRef = useRef(false);
  const superHopActiveRef = useRef(false);
  const flyComboActiveRef = useRef(false);
  const maxRowRef = useRef(0);

  gameStateRef.current = gameState;
  bonusItemsRef.current = bonusItems;
  shieldActiveRef.current = shieldActive;
  slowTimeActiveRef.current = slowTimeActive;
  currentAnchorActiveRef.current = currentAnchorActive;
  superHopActiveRef.current = superHopActive;
  flyComboActiveRef.current = flyComboActive;

  useEffect(() => {
    // Lane motion advances in refs between renders. Rehydrating the ref from React
    // state on every render rewinds obstacle/platform positions whenever HUD state changes.
    laneItemsRef.current = laneItems;
  }, [laneItems]);

  const clearPendingTimers = useCallback(() => {
    if (deathTimeoutRef.current !== null) {
      window.clearTimeout(deathTimeoutRef.current);
      deathTimeoutRef.current = null;
    }
    if (levelTimeoutRef.current !== null) {
      window.clearTimeout(levelTimeoutRef.current);
      levelTimeoutRef.current = null;
    }
    if (shieldTimeoutRef.current !== null) {
      window.clearTimeout(shieldTimeoutRef.current);
      shieldTimeoutRef.current = null;
    }
    if (slowTimeTimeoutRef.current !== null) {
      window.clearTimeout(slowTimeTimeoutRef.current);
      slowTimeTimeoutRef.current = null;
    }
    if (currentAnchorTimeoutRef.current !== null) {
      window.clearTimeout(currentAnchorTimeoutRef.current);
      currentAnchorTimeoutRef.current = null;
    }
    if (superHopTimeoutRef.current !== null) {
      window.clearTimeout(superHopTimeoutRef.current);
      superHopTimeoutRef.current = null;
    }
    if (flyComboTimeoutRef.current !== null) {
      window.clearTimeout(flyComboTimeoutRef.current);
      flyComboTimeoutRef.current = null;
    }
    setFeaturedBonus(null);
  }, []);

  const showFeaturedBonus = useCallback((kind: BonusItem['kind'], durationMs: number) => {
    const now = Date.now();
    setFeaturedBonus((current) => replaceActiveTimedBonus(current, kind, durationMs, now));
  }, []);

  const clearFeaturedBonus = useCallback((kind: BonusItem['kind']) => {
    setFeaturedBonus((current) => (current?.kind === kind ? null : current));
  }, []);

  const resetFrog = useCallback((rows: number) => {
    platformRideRef.current = null;
    frogRef.current = createInitialFrog(rows);
    setDeathAnimation(false);
    setShowSplash(false);
  }, []);

  const clearShield = useCallback(() => {
    if (shieldTimeoutRef.current !== null) {
      window.clearTimeout(shieldTimeoutRef.current);
      shieldTimeoutRef.current = null;
    }
    shieldActiveRef.current = false;
    setShieldActive(false);
    clearFeaturedBonus('shield');
  }, [clearFeaturedBonus]);

  const clearSlowTime = useCallback(() => {
    if (slowTimeTimeoutRef.current !== null) {
      window.clearTimeout(slowTimeTimeoutRef.current);
      slowTimeTimeoutRef.current = null;
    }
    slowTimeActiveRef.current = false;
    setSlowTimeActive(false);
    clearFeaturedBonus('slowTime');
  }, [clearFeaturedBonus]);

  const clearCurrentAnchor = useCallback(() => {
    if (currentAnchorTimeoutRef.current !== null) {
      window.clearTimeout(currentAnchorTimeoutRef.current);
      currentAnchorTimeoutRef.current = null;
    }
    currentAnchorActiveRef.current = false;
    setCurrentAnchorActive(false);
    clearFeaturedBonus('currentAnchor');
  }, [clearFeaturedBonus]);

  const clearSuperHop = useCallback(() => {
    if (superHopTimeoutRef.current !== null) {
      window.clearTimeout(superHopTimeoutRef.current);
      superHopTimeoutRef.current = null;
    }
    superHopActiveRef.current = false;
    setSuperHopActive(false);
    clearFeaturedBonus('superHop');
  }, [clearFeaturedBonus]);

  const activateShield = useCallback(() => {
    clearShield();
    shieldActiveRef.current = true;
    setShieldActive(true);
    showFeaturedBonus('shield', SHIELD_DURATION_MS);
    recordGameEvent('ability_used', { ability: 'shield' });
    shieldTimeoutRef.current = window.setTimeout(() => {
      shieldTimeoutRef.current = null;
      shieldActiveRef.current = false;
      setShieldActive(false);
      clearFeaturedBonus('shield');
    }, SHIELD_DURATION_MS);
  }, [clearShield, clearFeaturedBonus, showFeaturedBonus]);

  const activateSlowTime = useCallback(() => {
    clearSlowTime();
    slowTimeActiveRef.current = true;
    setSlowTimeActive(true);
    showFeaturedBonus('slowTime', SLOW_TIME_DURATION_MS);
    recordGameEvent('ability_used', { ability: 'slow_time' });
    slowTimeTimeoutRef.current = window.setTimeout(() => {
      slowTimeTimeoutRef.current = null;
      slowTimeActiveRef.current = false;
      setSlowTimeActive(false);
      clearFeaturedBonus('slowTime');
    }, SLOW_TIME_DURATION_MS);
  }, [clearSlowTime, clearFeaturedBonus, showFeaturedBonus]);

  const activateCurrentAnchor = useCallback(() => {
    clearCurrentAnchor();
    currentAnchorActiveRef.current = true;
    setCurrentAnchorActive(true);
    showFeaturedBonus('currentAnchor', CURRENT_ANCHOR_DURATION_MS);
    recordGameEvent('ability_used', { ability: 'current_anchor' });
    currentAnchorTimeoutRef.current = window.setTimeout(() => {
      currentAnchorTimeoutRef.current = null;
      currentAnchorActiveRef.current = false;
      setCurrentAnchorActive(false);
      clearFeaturedBonus('currentAnchor');
    }, CURRENT_ANCHOR_DURATION_MS);
  }, [clearCurrentAnchor, clearFeaturedBonus, showFeaturedBonus]);

  const activateSuperHop = useCallback(() => {
    clearSuperHop();
    superHopActiveRef.current = true;
    setSuperHopActive(true);
    showFeaturedBonus('superHop', SUPER_HOP_DURATION_MS);
    recordGameEvent('ability_used', { ability: 'super_hop' });
    superHopTimeoutRef.current = window.setTimeout(() => {
      superHopTimeoutRef.current = null;
      superHopActiveRef.current = false;
      setSuperHopActive(false);
      clearFeaturedBonus('superHop');
    }, SUPER_HOP_DURATION_MS);
  }, [clearSuperHop, clearFeaturedBonus, showFeaturedBonus]);

  const clearFlyCombo = useCallback(() => {
    if (flyComboTimeoutRef.current !== null) {
      window.clearTimeout(flyComboTimeoutRef.current);
      flyComboTimeoutRef.current = null;
    }
    challengeSessionRef.current = clearFlyComboSession(challengeSessionRef.current);
    flyComboActiveRef.current = false;
    setFlyComboActive(false);
    clearFeaturedBonus('fly');
  }, [clearFeaturedBonus]);

  const activateFlyCombo = useCallback(() => {
    clearFlyCombo();
    challengeSessionRef.current = activateFlyComboSession(challengeSessionRef.current);
    flyComboActiveRef.current = true;
    setFlyComboActive(true);
    showFeaturedBonus('fly', FLY_COMBO_DURATION_MS);
    recordGameEvent('ability_used', { ability: 'fly_combo' });
    flyComboTimeoutRef.current = window.setTimeout(() => {
      flyComboTimeoutRef.current = null;
      clearFlyCombo();
    }, FLY_COMBO_DURATION_MS);
  }, [clearFlyCombo, showFeaturedBonus]);

  const clearActiveBonuses = useCallback(() => {
    clearShield();
    clearSlowTime();
    clearCurrentAnchor();
    clearSuperHop();
    clearFlyCombo();
  }, [clearShield, clearSlowTime, clearCurrentAnchor, clearSuperHop, clearFlyCombo]);

  const awardScore = useCallback((baseScore: number) => {
    const next = scoreWithFlyCombo(challengeSessionRef.current, baseScore);
    challengeSessionRef.current = next.session;
    if (next.result.consumed && next.session.flyComboCharges <= 0) {
        clearFlyCombo();
      }

    setGameState((prev) => {
      const nextScore = prev.score + next.result.score;
      return {
        ...prev,
        score: nextScore,
        highScore: Math.max(prev.highScore, nextScore),
      };
    });

    return next.result.score;
  }, [clearFlyCombo]);

  const rebuildBonusItems = useCallback((level: number, lanes: LaneConfig[], rows: number) => {
    const nextItems = buildBonusItems(level, lanes, rows);
    setBonusItems(nextItems);
    bonusItemsRef.current = nextItems;
  }, []);

  const requestSimulationStep = useCallback(() => {
    if (!devFlagsRef.current.stepSimulation) return;
    stepRequestedRef.current = true;
    setGameState((prev) => ({ ...prev, paused: true }));
  }, []);

  const togglePause = useCallback(() => {
    if (devFlagsRef.current.stepSimulation) return;
    setGameState((prev) => (
      prev.gameOver || prev.gameWon ? prev : { ...prev, paused: !prev.paused }
    ));
  }, []);

  const rebuildLaneItems = useCallback((lanes: LaneConfig[], rows: number) => {
    const nextItems = buildLaneItems(lanes, rows);
    setLaneItems(nextItems);
    laneItemsRef.current = nextItems;
  }, []);

  const resetLevelClock = useCallback(() => {
    challengeSessionRef.current = resetChallengeSession(Date.now());
    setHudClockNow(Date.now());
  }, []);

  useEffect(() => {
    saveHighScore(gameState.highScore);
  }, [gameState.highScore]);

  useEffect(() => {
    if (!gameState.gameOver) {
      gameOverSoundPlayedRef.current = false;
      return;
    }
    if (gameOverSoundPlayedRef.current) return;

    gameOverSoundPlayedRef.current = true;
    void playGameOver();
    stopMusic();
    recordGameEvent('game_over', { score: gameState.score, level: gameState.level });
  }, [gameState.gameOver, gameState.level, gameState.score]);

  useEffect(() => {
    if (!gameState.gameWon) {
      levelCompleteSoundPlayedRef.current = false;
      return;
    }
    if (levelCompleteSoundPlayedRef.current) return;

    levelCompleteSoundPlayedRef.current = true;
    void playLevelComplete();
    recordGameEvent('level_complete', { level: gameState.level });
  }, [gameState.gameWon, gameState.level]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setHudClockNow(Date.now());
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!musicStarted) {
      const handler = () => {
        startMusic();
        setMusicStarted(true);
        window.removeEventListener('keydown', handler);
        window.removeEventListener('click', handler);
      };

      window.addEventListener('keydown', handler);
      window.addEventListener('click', handler);

      return () => {
        window.removeEventListener('keydown', handler);
        window.removeEventListener('click', handler);
      };
    }
  }, [musicStarted]);

  useEffect(() => {
    recordGameEvent('start', { level: initialLevel });
  }, [initialLevel]);

  useEffect(() => {
    if (!recordReplayEnabled || replayPlaybackSnapshotRef.current) return;

    replayRecorderRef.current = createReplayRecorder({
      level: initialLevel,
      seed: initialLevelSeed,
      initialState: summarizeReplayState(gameStateRef.current, frogRef.current),
    });

    const flushReplay = () => {
      const recorder = replayRecorderRef.current;
      if (!recorder) return;
      const snapshot = recorder.finish(summarizeReplayState(gameStateRef.current, frogRef.current));
      saveReplaySnapshot(snapshot);
    };

    const interval = window.setInterval(flushReplay, 5000);
    window.addEventListener('beforeunload', flushReplay);
    window.addEventListener('pagehide', flushReplay);

    return () => {
      flushReplay();
      window.removeEventListener('beforeunload', flushReplay);
      window.removeEventListener('pagehide', flushReplay);
      window.clearInterval(interval);
    };
  }, [initialLevel, initialLevelSeed, recordReplayEnabled]);

  useEffect(() => {
    const flushMetrics = () => {
      flushGameMetrics();
    };

    const interval = window.setInterval(flushMetrics, 5000);
    window.addEventListener('beforeunload', flushMetrics);
    window.addEventListener('pagehide', flushMetrics);

    return () => {
      window.removeEventListener('beforeunload', flushMetrics);
      window.removeEventListener('pagehide', flushMetrics);
      window.clearInterval(interval);
      flushMetrics();
    };
  }, []);

  const restartGame = useCallback((source: ReplayInputSource = 'keyboard') => {
    clearPendingTimers();
    stopAllGameSounds();

    const gs = gameStateRef.current;
    const nextLevel = gs.gameOver ? initialLevel : gs.level;
    firstMoveRecordedRef.current = false;
    recordGameEvent('restart', { gameOver: gs.gameOver, level: nextLevel });
    if (recordReplayEnabled && source !== 'replay') {
      replayRecorderRef.current?.recordRestart(source);
    }
    const nextLevelData = generateLevel(nextLevel);

    setLevelData(nextLevelData);
    laneConfigsRef.current = nextLevelData.lanes;
    rowsRef.current = nextLevelData.rows;
    maxRowRef.current = 0;
    setChallengeBonus(0);
    resetLevelClock();

    if (gs.gameOver) startMusic();

    setGameState({
      ...createRoundGameState(gs, nextLevel, { resetScore: gs.gameOver }),
      paused: devFlagsRef.current.stepSimulation,
    });

    frogRef.current = createInitialFrog(nextLevelData.rows);
    platformRideRef.current = null;
    setDeathAnimation(false);
    setShowSplash(false);
    rebuildLaneItems(nextLevelData.lanes, nextLevelData.rows);
    rebuildBonusItems(nextLevel, nextLevelData.lanes, nextLevelData.rows);
    clearActiveBonuses();
  }, [clearPendingTimers, rebuildLaneItems, rebuildBonusItems, clearActiveBonuses, recordReplayEnabled, resetLevelClock]);

  const handleDeath = useCallback((isSplash = false) => {
    const flags = devFlagsRef.current;
    if (flags.invulnerable || flags.infiniteLives) return;
    if (deathTimeoutRef.current !== null) return;

    if (shieldActiveRef.current) {
      clearShield();
      playScore();
      recordGameEvent('ability_used', { ability: 'shield', outcome: 'blocked_death' });
      return;
    }

    challengeSessionRef.current = registerLevelDeath(challengeSessionRef.current);
    recordGameEvent('death', { splash: isSplash, level: gameStateRef.current.level });
    clearFlyCombo();
    if (isSplash) {
      setShowSplash(true);
      playSplash();
    } else {
      playCrash();
    }

    setDeathAnimation(true);
    platformRideRef.current = null;
    frogRef.current = {
      ...frogRef.current,
      alive: false,
      isHopping: false,
      riding: false,
    };

    deathTimeoutRef.current = window.setTimeout(() => {
      deathTimeoutRef.current = null;
      stopGameSoundGroup('death');
      setGameState((prev) => applyLifeLoss(prev, devFlagsRef.current.infiniteLives));

      resetFrog(rowsRef.current);
    }, 800);
  }, [resetFrog, clearShield, clearFlyCombo]);

  const moveFrog = useCallback((direction: Direction, source: ReplayInputSource = 'keyboard') => {
    const f = frogRef.current;
    const gs = gameStateRef.current;
    if (f.isHopping || !f.alive || gs.gameOver || gs.gameWon || gs.paused) return;

    const hopCells = superHopActiveRef.current ? 2 : 1;
    const proposal = getMoveProposal(f.pos, direction, rowsRef.current, hopCells);
    if (!proposal) return;

    playHop();
    platformRideRef.current = null;
    frogRef.current = {
      ...frogRef.current,
      startPos: proposal.startPos,
      targetPos: proposal.targetPos,
      isHopping: true,
      hopStart: performance.now(),
      direction,
      riding: false,
    };

    const newRow = getRowFromY(rowsRef.current, proposal.targetPos.y);
    if (newRow > maxRowRef.current) {
      maxRowRef.current = newRow;
      playScore();
      awardScore(ROW_PROGRESS_SCORE);
      if (!firstMoveRecordedRef.current) {
        firstMoveRecordedRef.current = true;
        recordGameEvent('first_move', { direction });
      }
    }

    if (recordReplayEnabled && source !== 'replay') {
      replayRecorderRef.current?.recordMove(direction, source);
    }
  }, [awardScore, recordReplayEnabled]);

  const collectBonus = useCallback((bonusIndex: number) => {
    const bonus = bonusItemsRef.current[bonusIndex];
    if (!bonus || bonus.collected) return;

    const nextItems = bonusItemsRef.current.map((item, idx) => (
      idx === bonusIndex ? { ...item, collected: true } : item
    ));
    bonusItemsRef.current = nextItems;
    setBonusItems(nextItems);
    clearActiveBonuses();
    playBonusCollected();
    if (bonus.kind === 'fly') {
      awardScore(FLY_BONUS_SCORE);
      activateFlyCombo();
      return;
    }

    awardScore(BONUS_SCORE);
    if (bonus.kind === 'shield') {
      activateShield();
    } else if (bonus.kind === 'slowTime') {
      activateSlowTime();
    } else if (bonus.kind === 'currentAnchor') {
      activateCurrentAnchor();
    } else if (bonus.kind === 'superHop') {
      activateSuperHop();
    }
  }, [activateShield, activateFlyCombo, activateSlowTime, activateCurrentAnchor, activateSuperHop, awardScore, clearActiveBonuses]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (replayPlaybackSnapshotRef.current) {
        return;
      }

      const gs = gameStateRef.current;
      const action = getKeyboardGameAction(e.code);
      if (!action) return;

      if (gs.gameOver || gs.gameWon) {
        if (action.type === 'restart') {
          e.preventDefault();
          restartGame();
        }
        return;
      }

      if (devFlagsRef.current.stepSimulation && gs.paused && action.type === 'step') {
        e.preventDefault();
        requestSimulationStep();
        return;
      }

      switch (action.type) {
        case 'move':
          e.preventDefault();
          moveFrog(action.direction);
          break;
        case 'pause':
          e.preventDefault();
          if (devFlagsRef.current.stepSimulation) {
            break;
          }
          setGameState((prev) => ({ ...prev, paused: !prev.paused }));
          break;
        case 'restart':
        case 'step':
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [moveFrog, restartGame, requestSimulationStep]);

  useEffect(() => {
    const replaySnapshot = replayPlaybackSnapshotRef.current;
    if (!replaySnapshot) return;

    const timers = replaySnapshot.actions.map((action) => window.setTimeout(() => {
      if (action.type === 'move' && action.direction) {
        moveFrog(action.direction, 'replay');
      } else if (action.type === 'restart') {
        restartGame('replay');
      }
    }, action.at));

    const finishDelay = Math.max(250, ...replaySnapshot.actions.map((action) => action.at)) + 400;
    const finishTimer = window.setTimeout(() => {
      const matched = compareReplaySummaries(
        replaySnapshot.finalState,
        summarizeReplayState(gameStateRef.current, frogRef.current),
      );
      if (!matched) {
        console.warn('Frogger replay mismatch', { expected: replaySnapshot.finalState, actual: summarizeReplayState(gameStateRef.current, frogRef.current) });
      }
    }, finishDelay);

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
      window.clearTimeout(finishTimer);
    };
  }, [moveFrog, restartGame]);

  useEffect(() => {
    const easeOutQuad = (t: number) => t * (2 - t);

    const gameLoop = (timestamp: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = timestamp;
      const delta = timestamp - lastTimeRef.current;
      lastTimeRef.current = timestamp;

      const gs = gameStateRef.current;
      const stepMode = devFlagsRef.current.stepSimulation;
      const shouldHold = gs.gameOver || gs.paused || stepMode;
      if (shouldHold && !stepRequestedRef.current) {
        const f = frogRef.current;
        if (f.isHopping) {
          frogRef.current = { ...f, hopStart: f.hopStart + delta };
        }
        animFrameRef.current = requestAnimationFrame(gameLoop);
        return;
      }
      stepRequestedRef.current = false;

      const f = frogRef.current;
      const lanes = laneConfigsRef.current;
      const rows = rowsRef.current;
      const flags = devFlagsRef.current;
      const speedMul = (1 + (gs.level - 1) * 0.12) * flags.speedScale * (slowTimeActiveRef.current ? SLOW_TIME_FACTOR : 1);

      laneItemsRef.current = advanceLaneItems(laneItemsRef.current, lanes, speedMul);

      let activeFrog = f;
      if (f.isHopping) {
        const progress = Math.min((timestamp - f.hopStart) / HOP_DURATION, 1);
        if (progress >= 1) {
          activeFrog = {
            ...f,
            pos: { ...f.targetPos },
            isHopping: false,
          };
        } else {
          const eased = easeOutQuad(progress);
          activeFrog = {
            ...f,
            pos: {
              x: f.startPos.x + (f.targetPos.x - f.startPos.x) * eased,
              y: f.startPos.y + (f.targetPos.y - f.startPos.y) * eased,
            },
          };
        }
        frogRef.current = activeFrog;
      }

      if (!activeFrog.isHopping && activeFrog.alive) {
        const currentRow = getRowFromY(rows, activeFrog.pos.y);
        const lane = getLaneAtRow(lanes, currentRow);
        const items = laneItemsRef.current;
        const bonuses = bonusItemsRef.current;

        for (let i = 0; i < bonuses.length; i++) {
          const bonus = bonuses[i];
          if (bonus && !bonus.collected && checkBonusCollision(activeFrog.pos.x, activeFrog.pos.y, bonus)) {
            collectBonus(i);
            break;
          }
        }

        if (lane) {
          if (!isRiverLane(lane)) {
            platformRideRef.current = null;
            if (frogRef.current.riding) {
              frogRef.current = { ...frogRef.current, riding: false };
            }
          }

          if (isRoadLane(lane) && !flags.noRoadCollision) {
            const rowItems = items[currentRow];
            if (rowItems) {
              for (const item of rowItems) {
                if (checkCollision(activeFrog.pos.x, activeFrog.pos.y, item)) {
                  handleDeath(false);
                  break;
                }
              }
            }
          }

          if (isRiverLane(lane)) {
            const currentRide = platformRideRef.current?.row === currentRow
              ? platformRideRef.current
              : null;
            if (platformRideRef.current && !currentRide) {
              platformRideRef.current = null;
            }
            const lockedPlatform = currentRide
              ? getPlatformRideHit(currentRide, lanes, items)
              : null;
            if (platformRideRef.current && !lockedPlatform) {
              platformRideRef.current = null;
            }
            const platform = lockedPlatform
              ?? findPlatformHit(activeFrog.pos.x, activeFrog.pos.y, rows, lanes, items);
            if (platform) {
              const newlyAttached = !lockedPlatform;
              if (newlyAttached) {
                platformRideRef.current = {
                  itemIndex: platform.itemIndex,
                  row: platform.row,
                };
              }
              const platformDelta = newlyAttached ? 0 : platform.speed * speedMul;
              const nx = activeFrog.pos.x + platformDelta;
              const adjustedNx = currentAnchorActiveRef.current ? activeFrog.pos.x : nx;
              const appliedDelta = adjustedNx - activeFrog.pos.x;
              if (adjustedNx < -BOARD_EDGE_BUFFER || adjustedNx > BOARD_WIDTH - BOARD_EDGE_BUFFER) {
                if (!flags.noRiverDeath) handleDeath(true);
              } else {
                frogRef.current = {
                  ...frogRef.current,
                  pos: { ...frogRef.current.pos, x: adjustedNx },
                  startPos: { ...frogRef.current.startPos, x: frogRef.current.startPos.x + appliedDelta },
                  targetPos: { ...frogRef.current.targetPos, x: frogRef.current.targetPos.x + appliedDelta },
                  riding: true,
                };
              }
            } else if (!flags.noRiverDeath) {
              handleDeath(true);
            }
          }

          if (isGoalLane(lane)) {
            const goalIdx = flags.forceGoal
              ? gameStateRef.current.goalsReached.findIndex((value) => !value)
              : isGoalColumn(activeFrog.pos.x);

            if (goalIdx !== -1 && !gs.goalsReached[goalIdx]) {
              maxRowRef.current = 0;
              playGoalReached();
              recordGameEvent('goal', { goalIdx, level: gs.level });
              const goalScore = scoreWithFlyCombo(challengeSessionRef.current, GOAL_SCORE);
              challengeSessionRef.current = goalScore.session;
              if (goalScore.session.flyComboCharges <= 0 && goalScore.result.consumed) {
                clearFlyCombo();
              }
              const clearBonus = computeLevelClearScore(challengeSessionRef.current, Date.now());
              setChallengeBonus(clearBonus.score);

              setGameState((prev) => (
                resolveGoalHit(
                  prev,
                  goalIdx,
                  flags.forceLevelComplete,
                  goalScore.result.score + clearBonus.score,
                ).state
              ));

              resetFrog(rows);
            } else if (!flags.forceGoal) {
              handleDeath(false);
            }
          }
        }
      }

      animFrameRef.current = requestAnimationFrame(gameLoop);
    };

    animFrameRef.current = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [handleDeath, resetFrog, collectBonus, clearFlyCombo]);

  useEffect(() => {
    if (!gameState.gameWon) return;

      levelTimeoutRef.current = window.setTimeout(() => {
        levelTimeoutRef.current = null;
        const nextLevel = gameState.level;
        const nextLevelData = generateLevel(nextLevel);

      setLevelData(nextLevelData);
      laneConfigsRef.current = nextLevelData.lanes;
      rowsRef.current = nextLevelData.rows;
      maxRowRef.current = 0;
        setChallengeBonus(0);
        setGameState((prev) => ({
          ...createPostWinState(prev, nextLevel),
          paused: devFlagsRef.current.stepSimulation || prev.paused,
        }));
        frogRef.current = createInitialFrog(nextLevelData.rows);
        platformRideRef.current = null;
        setDeathAnimation(false);
        setShowSplash(false);
        rebuildLaneItems(nextLevelData.lanes, nextLevelData.rows);
        rebuildBonusItems(nextLevel, nextLevelData.lanes, nextLevelData.rows);
        clearActiveBonuses();
      }, 2000);

    return () => {
      if (levelTimeoutRef.current !== null) {
        window.clearTimeout(levelTimeoutRef.current);
        levelTimeoutRef.current = null;
      }
    };
  }, [gameState.gameWon, gameState.level, rebuildLaneItems, rebuildBonusItems, clearActiveBonuses]);

  useEffect(() => {
    return () => {
      clearPendingTimers();
      stopAllGameSounds();
      stopMusic();
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [clearPendingTimers]);

  const levelElapsedSeconds = Math.max(0, Math.floor((hudClockNow - challengeSessionRef.current.levelStartedAt) / 1000));
  const featuredBonusRemainingMs = featuredBonus ? Math.max(0, featuredBonus.expiresAt - hudClockNow) : 0;
  const activeBonus: ActiveBonusHud | null = featuredBonus && featuredBonusRemainingMs > 0
    ? {
      kind: featuredBonus.kind,
      remainingSeconds: Math.ceil(featuredBonusRemainingMs / 1000),
    }
    : null;

  return {
    frogRef,
    gameState,
    laneItems,
    laneItemsRef,
    levelModifiers: levelData.modifiers,
    bonusItems,
    shieldActive,
    slowTimeActive,
    currentAnchorActive,
    superHopActive,
    flyComboActive,
    activeBonus,
    challengeBonus,
    levelElapsedSeconds,
    deathAnimation,
    showSplash,
    moveFrog,
    requestSimulationStep,
    togglePause,
    restartGame,
    laneConfigs: levelData.lanes,
    totalRows: levelData.rows,
    devFlags: devFlagsRef.current,
  };
}
