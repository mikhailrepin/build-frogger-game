import { useEffect, useState, type ComponentType } from 'react';
import { Canvas } from '@react-three/fiber';
import {
  Anchor,
  Bug,
  Play,
  Rabbit,
  RotateCcw,
  Skull,
  Trophy,
} from 'lucide-react';
import * as THREE from 'three';
import { useGame } from './useGame';
import { GameScene } from './Scene';
import { PauseOverlay } from './PauseOverlay';
import type { Direction } from './gameConstants';
import { CELL_SIZE } from './gameConstants';
import { getRowFromY } from './gameCore';
import {
  AUDIO_VOLUME_LEVELS,
  getAudioSettings,
  setAudioMuted,
  setAudioVolumeLevel,
} from './audio';

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

function ControlButton({ direction, onMove, className = '' }: {
  direction: Direction;
  onMove: (direction: Direction) => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      aria-label={`Move ${direction}`}
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

export default function App() {
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
  const [reducedMotion, setReducedMotion] = useState(() => (
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  ));
  const [supportsKeyboardHints, setSupportsKeyboardHints] = useState(() => (
    typeof window !== 'undefined' && window.matchMedia('(any-pointer: fine)').matches
  ));
  const [audioSettings, setAudioSettingsState] = useState(getAudioSettings);

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

  useEffect(() => {
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const syncMotion = () => setReducedMotion(motionQuery.matches);
    syncMotion();
    motionQuery.addEventListener('change', syncMotion);

    const keyboardQuery = window.matchMedia('(any-pointer: fine)');
    const syncKeyboard = () => setSupportsKeyboardHints(keyboardQuery.matches);
    syncKeyboard();
    keyboardQuery.addEventListener('change', syncKeyboard);

    return () => {
      motionQuery.removeEventListener('change', syncMotion);
      keyboardQuery.removeEventListener('change', syncKeyboard);
    };
  }, []);

  const activeBonusMeta = activeBonus ? BONUS_HUD[activeBonus.kind] : null;
  const ActiveBonusIcon = activeBonusMeta?.Icon;
  const activeBonusText = activeBonus ? Math.max(0, activeBonus.remainingSeconds) : gameState.lives;
  const decreaseVolume = () => {
    const volumeLevel = Math.max(1, audioSettings.volumeLevel - 1);
    setAudioVolumeLevel(volumeLevel);
    setAudioSettingsState({ ...audioSettings, volumeLevel });
  };
  const increaseVolume = () => {
    const volumeLevel = Math.min(AUDIO_VOLUME_LEVELS, audioSettings.volumeLevel + 1);
    setAudioVolumeLevel(volumeLevel);
    setAudioSettingsState({ ...audioSettings, volumeLevel });
  };
  const toggleMuted = () => {
    const muted = !audioSettings.muted;
    setAudioMuted(muted);
    setAudioSettingsState({ ...audioSettings, muted });
  };

  return (
    <div className="fixed inset-0 select-none overflow-hidden bg-[#002713]">
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
        className={`pointer-events-none absolute left-0 right-0 top-0 z-20 flex justify-center transition-opacity ${gameState.paused ? 'invisible opacity-0' : 'visible opacity-100'}`}
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
            {activeBonus ? (
              <img src={UI_ASSETS.clock} alt="" className="hidden h-6 w-6 shrink-0 min-[390px]:block" draggable={false} />
            ) : null}
            <span className="whitespace-nowrap text-[18px] font-medium leading-8 tracking-[1.8px] text-[var(--ui-fg)] tabular-nums">
              {activeBonusText}
            </span>
          </div>

          <div className="flex shrink-0 items-center justify-end gap-3">
            <span className="whitespace-nowrap text-[18px] font-medium uppercase leading-8 tracking-[1.8px] text-[var(--ui-fg)]">
              L {gameState.level}
            </span>
            <button
              type="button"
              aria-label={gameState.paused ? 'Resume' : 'Pause'}
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
        className={`ui-font pointer-events-none absolute bottom-0 left-0 right-0 z-20 flex flex-col items-center transition-opacity ${gameState.paused ? 'invisible opacity-0' : 'visible opacity-100'}`}
        style={{ paddingBottom: 'max(14px, env(safe-area-inset-bottom))' }}
      >
        <ControlButton direction="up" onMove={(direction) => moveFrog(direction, 'touch')} className="mb-2" />
        <div className="flex gap-2">
          <ControlButton direction="left" onMove={(direction) => moveFrog(direction, 'touch')} />
          <ControlButton direction="down" onMove={(direction) => moveFrog(direction, 'touch')} />
          <ControlButton direction="right" onMove={(direction) => moveFrog(direction, 'touch')} />
        </div>
        {supportsKeyboardHints && (
          <p className="mt-1.5 rounded-lg text-[10px] font-normal leading-4 text-white/70 [text-shadow:0_2px_2.8px_black]">
            Arrow Keys / WASD&nbsp;&nbsp;•&nbsp;&nbsp;P Pause
          </p>
        )}
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
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="animate-bounce-in space-y-4 text-center">
            <div className="flex justify-center text-red-400 drop-shadow-[0_0_20px_rgba(248,113,113,0.55)]">
              <Skull className="h-14 w-14" strokeWidth={2.6} />
            </div>
            <h2 className="font-mono text-5xl font-black tracking-normal text-red-300">GAME OVER</h2>
            <div className="flex items-center justify-center gap-5 font-mono text-lg text-slate-300">
              <span>Score: <span className="font-black text-amber-300">{gameState.score}</span></span>
              <span className="text-slate-600">|</span>
              <span>Best: <span className="font-black text-amber-200">{gameState.highScore}</span></span>
            </div>
            {gameState.score > 0 && gameState.score >= gameState.highScore && (
              <p className="flex items-center justify-center gap-2 font-mono text-sm font-bold tracking-normal text-emerald-300">
                <Trophy className="h-4 w-4" strokeWidth={2.6} />
                NEW HIGH SCORE
              </p>
            )}
            <button
              type="button"
              onClick={() => restartGame()}
              className="mt-2 inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-7 py-3 font-mono text-sm font-bold tracking-normal text-[#04160d] shadow-lg transition hover:bg-emerald-400 active:scale-95"
            >
              <RotateCcw className="h-4 w-4" strokeWidth={2.8} />
              PLAY AGAIN
            </button>
          </div>
        </div>
      )}

      {gameState.gameWon && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/50 backdrop-blur-[2px]">
          <div className="animate-bounce-in space-y-3 text-center">
            <div className="flex justify-center text-emerald-300 drop-shadow-[0_0_16px_rgba(74,222,128,0.5)]">
              <Trophy className="h-14 w-14" strokeWidth={2.6} />
            </div>
            <h2 className="font-mono text-4xl font-black tracking-normal text-emerald-300">LEVEL {gameState.level} COMPLETE</h2>
            <p className="font-mono text-xl font-bold text-amber-300">Score: {gameState.score}</p>
            {challengeBonus > 0 && (
              <p className="font-mono text-sm font-bold tracking-normal text-lime-300">LEVEL BONUS +{challengeBonus}</p>
            )}
          </div>
        </div>
      )}

      {gameState.paused && !gameState.gameOver && !gameState.gameWon && (
        <PauseOverlay
          score={gameState.score}
          volumeLevel={audioSettings.volumeLevel}
          muted={audioSettings.muted}
          onDecreaseVolume={decreaseVolume}
          onIncreaseVolume={increaseVolume}
          onToggleMute={toggleMuted}
          onResume={togglePause}
        />
      )}
    </div>
  );
}
