import { useEffect, useRef, useState, type ComponentType } from 'react';
import { Canvas } from '@react-three/fiber';
import {
  Anchor,
  Bug,
  Play,
  Rabbit,
} from 'lucide-react';
import * as THREE from 'three';
import { useGame } from './useGame';
import { GameScene } from './Scene';
import { MainScreen } from './MainScreen';
import { PauseOverlay } from './PauseOverlay';
import { BonusGuideOverlay } from './BonusGuideOverlay';
import { GameOverOverlay, LevelCompleteOverlay } from './EndStateOverlay';
import type { Direction } from './gameConstants';
import { CELL_SIZE } from './gameConstants';
import { getRowFromY } from './gameCore';
import {
  adjustAudioVolume,
  getAudioSettings,
  startMainMenuMusic,
  stopMainMenuMusic,
  toggleAudioMuted,
} from './audio';
import { version as APP_VERSION } from '../package.json';
import { UI_COPY, type Locale } from './localization';

type IconComponent = ComponentType<{ className?: string; strokeWidth?: number }>;
type BonusKind = 'shield' | 'slowTime' | 'currentAnchor' | 'superHop' | 'fly';

const UI_ASSETS = {
  coins: '/ui/coins-icon.svg',
  frog: '/ui/froggy-icon.svg',
  shield: '/ui/shield-icon.svg',
  clock: '/ui/clock-fading-icon.svg',
  pause: '/ui/btn-pause.svg',
  controls: {
    up: '/ui/btn-up.svg',
    left: '/ui/btn-left.svg',
    down: '/ui/btn-down.svg',
    right: '/ui/btn-right.svg',
  } satisfies Record<Direction, string>,
};

const BONUS_HUD: Record<BonusKind, { Icon?: IconComponent; src?: string; className: string }> = {
  shield: { src: UI_ASSETS.shield, className: 'drop-shadow-[0_0_10px_rgba(255,159,0,0.65)]' },
  slowTime: { src: UI_ASSETS.clock, className: 'drop-shadow-[0_0_10px_rgba(0,217,238,0.65)]' },
  currentAnchor: { Icon: Anchor, className: 'text-teal-200 drop-shadow-[0_0_10px_rgba(94,234,212,0.65)]' },
  superHop: { Icon: Rabbit, className: 'text-orange-200 drop-shadow-[0_0_10px_rgba(251,146,60,0.65)]' },
  fly: { Icon: Bug, className: 'text-lime-200 drop-shadow-[0_0_10px_rgba(190,242,100,0.65)]' },
};

function ControlButton({ direction, label, onMove, className = '' }: {
  direction: Direction;
  label: string;
  onMove: (direction: Direction) => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onPointerDown={(event) => {
        event.preventDefault();
        onMove(direction);
      }}
      className={`liquid-glass pointer-events-auto h-12 w-12 touch-none rounded-[18px] transition active:scale-95 ${className}`}
    >
      <img src={UI_ASSETS.controls[direction]} alt="" className="h-full w-full select-none" draggable={false} />
    </button>
  );
}

interface GameProps {
  audioSettings: ReturnType<typeof getAudioSettings>;
  locale: Locale;
  reducedMotion: boolean;
  onDecreaseVolume: () => void;
  onIncreaseVolume: () => void;
  onExitToMainScreen: () => void;
  onToggleMuted: () => void;
}

function Game({
  audioSettings,
  locale,
  reducedMotion,
  onDecreaseVolume,
  onIncreaseVolume,
  onExitToMainScreen,
  onToggleMuted,
}: GameProps) {
  const {
    frogRef,
    gameState,
    laneItems,
    laneItemsRef,
    levelModifiers,
    bonusItems,
    shieldActive,
    slowTimeActive,
    currentAnchorActive,
    superHopActive,
    activeBonus,
    challengeBonus,
    deathAnimation,
    showSplash,
    moveFrog,
    requestSimulationStep,
    togglePause,
    restartGame,
    laneConfigs,
    totalRows,
    devFlags,
  } = useGame();
  const [shaking, setShaking] = useState(false);
  const [cellDebug, setCellDebug] = useState<{ row: number; col: number } | null>(null);
  const [revealingGame, setRevealingGame] = useState(true);

  useEffect(() => {
    if (deathAnimation) {
      setShaking(true);
      const timer = window.setTimeout(() => setShaking(false), 350);
      return () => window.clearTimeout(timer);
    }
  }, [deathAnimation]);

  useEffect(() => {
    if (!devFlags.showCellDebug) {
      setCellDebug(null);
      return;
    }

    const update = () => {
      const frog = frogRef.current;
      setCellDebug({
        row: getRowFromY(totalRows, frog.pos.y),
        col: Math.round(frog.pos.x / CELL_SIZE),
      });
    };

    update();
    const timer = window.setInterval(update, 100);
    return () => window.clearInterval(timer);
  }, [devFlags.showCellDebug, frogRef, totalRows]);

  const activeBonusMeta = activeBonus ? BONUS_HUD[activeBonus.kind] : null;
  const ActiveBonusIcon = activeBonusMeta?.Icon;
  const activeBonusText = activeBonus ? Math.max(0, activeBonus.remainingSeconds) : gameState.lives;
  const overlayVisible = gameState.paused || gameState.gameOver || gameState.gameWon;
  const copy = UI_COPY[locale].game;
  return (
    <div className="fixed inset-0 select-none overflow-hidden bg-[#002713]" lang={locale}>
      <div className={`absolute inset-0 ${shaking && !reducedMotion ? 'animate-shake' : ''}`}>
        <Canvas
          orthographic
          camera={{
            near: -100,
            far: 100,
            position: [6, 8, 6],
            zoom: 55,
          }}
          shadows="percentage"
          dpr={[1, 2]}
          gl={{
            antialias: true,
            alpha: false,
            powerPreference: 'high-performance',
            localClippingEnabled: true,
          }}
          onCreated={({ camera, gl }) => {
            camera.lookAt(0, 0, 0);
            camera.updateProjectionMatrix();
            gl.setClearColor(new THREE.Color('#002713'));
          }}
        >
          <GameScene
            frogRef={frogRef}
            gameState={gameState}
            laneItems={laneItems}
            laneItemsRef={laneItemsRef}
            levelModifiers={levelModifiers}
            bonusItems={bonusItems}
            shieldActive={shieldActive}
            slowTimeActive={slowTimeActive}
            currentAnchorActive={currentAnchorActive}
            superHopActive={superHopActive}
            deathAnimation={deathAnimation}
            showSplash={showSplash}
            laneConfigs={laneConfigs}
            totalRows={totalRows}
            showCollisionBoxes={devFlags.showCollisionBoxes}
            reducedMotion={reducedMotion}
          />
        </Canvas>
      </div>

      <div
        className={`pointer-events-none absolute left-0 right-0 top-0 z-20 flex justify-center transition-opacity ${overlayVisible ? 'invisible opacity-0' : 'visible opacity-100'}`}
        style={{ paddingTop: 'max(10px, env(safe-area-inset-top))' }}
      >
        <div
          className="liquid-glass ui-font pointer-events-auto flex h-14 w-[clamp(380px,calc(100vw-24px),720px)] items-center justify-between rounded-[20px] p-1 text-[var(--ui-fg)]"
        >
          <div className="flex min-w-[86px] shrink-0 items-center gap-2 px-2 min-[390px]:min-w-[100px]">
            <img src={UI_ASSETS.coins} alt="" className="h-6 w-6 shrink-0" draggable={false} />
            <span className="min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-[18px] font-normal leading-8 tracking-[1.8px] text-[var(--ui-fg)] tabular-nums">
              {gameState.score}
            </span>
          </div>

          <div className="flex h-8 min-w-[46px] flex-1 items-center justify-center gap-2">
            {activeBonusMeta?.src ? (
              <img src={activeBonusMeta.src} alt="" className={`h-6 w-6 shrink-0 ${activeBonusMeta.className}`} draggable={false} />
            ) : ActiveBonusIcon ? (
              <ActiveBonusIcon className={`h-6 w-6 shrink-0 ${activeBonusMeta.className}`} strokeWidth={2.4} />
            ) : (
              <img src={UI_ASSETS.frog} alt="" className="h-[22px] w-[26px] shrink-0 drop-shadow-[0_0_10px_rgba(0,255,93,0.55)]" draggable={false} />
            )}
            <span className="whitespace-nowrap text-[18px] font-medium leading-8 tracking-[1.8px] text-[var(--ui-fg)] tabular-nums">
              {activeBonusText}
            </span>
          </div>

          <div className="flex shrink-0 items-center justify-end gap-3">
            <span className="whitespace-nowrap text-[18px] font-medium uppercase leading-8 tracking-[1.8px] text-[var(--ui-fg)]">
              {copy.level} {gameState.level}
            </span>
            <button
              type="button"
              aria-label={gameState.paused ? copy.resume : copy.pause}
              onClick={togglePause}
              className="flex h-12 w-12 items-center justify-center rounded-[18px] text-[var(--ui-fg)] transition active:scale-95"
            >
              {gameState.paused ? (
                <span className="liquid-glass flex h-12 w-12 items-center justify-center rounded-[18px]">
                  <Play className="h-5 w-5" strokeWidth={3} />
                </span>
              ) : (
                <img src={UI_ASSETS.pause} alt="" className="h-full w-full" draggable={false} />
              )}
            </button>
          </div>
        </div>
      </div>

      <div
        className={`ui-font pointer-events-none absolute bottom-0 left-0 right-0 z-20 flex flex-col items-center transition-opacity ${overlayVisible ? 'invisible opacity-0' : 'visible opacity-100'}`}
        style={{ paddingBottom: 'max(14px, env(safe-area-inset-bottom))' }}
      >
        <ControlButton direction="up" label={copy.move.up} onMove={(direction) => moveFrog(direction, 'touch')} className="mb-2" />
        <div className="flex gap-2">
          <ControlButton direction="left" label={copy.move.left} onMove={(direction) => moveFrog(direction, 'touch')} />
          <ControlButton direction="down" label={copy.move.down} onMove={(direction) => moveFrog(direction, 'touch')} />
          <ControlButton direction="right" label={copy.move.right} onMove={(direction) => moveFrog(direction, 'touch')} />
        </div>
        <p className="keyboard-help mt-1.5 rounded-lg text-[10px] font-normal leading-4 text-white [text-shadow:0_2px_2.8px_black]">
          {copy.keyboardHelp}
        </p>
      </div>

      {devFlags.showCellDebug && cellDebug && (
        <div className="absolute left-4 top-24 z-20 rounded-md border border-cyan-400/30 bg-black/60 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.22em] text-cyan-200 backdrop-blur-sm">
          R{cellDebug.row} C{cellDebug.col}
        </div>
      )}

      {devFlags.stepSimulation && (
        <div className="absolute right-4 top-24 z-20 flex gap-2">
          <button
            type="button"
            onClick={requestSimulationStep}
            className="rounded-md border border-cyan-400/30 bg-black/60 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.22em] text-cyan-200 backdrop-blur-sm"
          >
            STEP
          </button>
        </div>
      )}

      {gameState.gameOver && (
        <GameOverOverlay
          locale={locale}
          score={gameState.score}
          bestScore={gameState.highScore}
          onPlayAgain={() => restartGame()}
        />
      )}

      {gameState.gameWon && (
        <LevelCompleteOverlay
          locale={locale}
          level={Math.max(1, gameState.level - 1)}
          score={gameState.score}
          bonus={challengeBonus}
        />
      )}

      {gameState.paused && !gameState.gameOver && !gameState.gameWon && (
        <PauseOverlay
          locale={locale}
          score={gameState.score}
          volumeLevel={audioSettings.volumeLevel}
          muted={audioSettings.muted}
          reducedMotion={reducedMotion}
          onDecreaseVolume={onDecreaseVolume}
          onIncreaseVolume={onIncreaseVolume}
          onExitToMainScreen={onExitToMainScreen}
          onToggleMute={onToggleMuted}
          onResume={togglePause}
        />
      )}

      {revealingGame ? (
        <div
          className={`game-reveal ${reducedMotion ? 'game-reveal--reduced' : ''}`}
          aria-hidden="true"
          onAnimationEnd={() => setRevealingGame(false)}
        />
      ) : null}
    </div>
  );
}

type AppPhase = 'menu' | 'menu-guide' | 'leaving-menu' | 'playing';

export default function App() {
  const [phase, setPhase] = useState<AppPhase>('menu');
  const [locale, setLocale] = useState<Locale>('en');
  const [audioSettings, setAudioSettings] = useState(getAudioSettings);
  const [reducedMotion, setReducedMotion] = useState(() => (
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  ));
  const startTimerRef = useRef<number | null>(null);
  const mainMenuActive = phase !== 'playing';

  useEffect(() => {
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const syncMotion = () => setReducedMotion(motionQuery.matches);
    syncMotion();
    motionQuery.addEventListener('change', syncMotion);

    return () => {
      motionQuery.removeEventListener('change', syncMotion);
    };
  }, []);

  useEffect(() => () => {
    if (startTimerRef.current !== null) {
      window.clearTimeout(startTimerRef.current);
    }
  }, []);

  useEffect(() => {
    if (!mainMenuActive) {
      stopMainMenuMusic();
      return;
    }

    const requestPlayback = () => {
      void startMainMenuMusic();
    };

    requestPlayback();
    window.addEventListener('pointerdown', requestPlayback);
    window.addEventListener('click', requestPlayback);
    window.addEventListener('keydown', requestPlayback);

    return () => {
      window.removeEventListener('pointerdown', requestPlayback);
      window.removeEventListener('click', requestPlayback);
      window.removeEventListener('keydown', requestPlayback);
      stopMainMenuMusic();
    };
  }, [mainMenuActive]);

  const startGame = () => {
    if (phase !== 'menu') {
      return;
    }

    setPhase('leaving-menu');
    startTimerRef.current = window.setTimeout(() => {
      setPhase('playing');
      startTimerRef.current = null;
    }, reducedMotion ? 90 : 420);
  };

  const decreaseVolume = () => {
    setAudioSettings(adjustAudioVolume(-1));
  };

  const increaseVolume = () => {
    setAudioSettings(adjustAudioVolume(1));
  };

  const toggleMuted = () => {
    setAudioSettings(toggleAudioMuted());
  };

  const exitToMainScreen = () => {
    void startMainMenuMusic();
    setPhase('menu');
  };

  if (phase !== 'playing') {
    return (
      <>
        <MainScreen
          locale={locale}
          muted={audioSettings.muted}
          transitioning={phase === 'leaving-menu'}
          version={APP_VERSION}
          onBonusGuide={() => setPhase('menu-guide')}
          onLocaleChange={setLocale}
          onStart={startGame}
          onToggleMuted={toggleMuted}
        />
        {phase === 'menu-guide' ? (
          <BonusGuideOverlay
            locale={locale}
            reducedMotion={reducedMotion}
            source="mainMenu"
            onExitGuide={() => setPhase('menu')}
          />
        ) : null}
      </>
    );
  }

  return (
    <Game
      audioSettings={audioSettings}
      locale={locale}
      reducedMotion={reducedMotion}
      onDecreaseVolume={decreaseVolume}
      onIncreaseVolume={increaseVolume}
      onExitToMainScreen={exitToMainScreen}
      onToggleMuted={toggleMuted}
    />
  );
}
