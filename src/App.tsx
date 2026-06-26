import { useEffect, useState, type ComponentType } from 'react';
import { Canvas } from '@react-three/fiber';
import {
  Anchor,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Bug,
  Coins,
  HeartPulse,
  Pause,
  Play,
  Rabbit,
  RotateCcw,
  Shield,
  Skull,
  Timer,
  Trophy,
} from 'lucide-react';
import * as THREE from 'three';
import { useGame } from './useGame';
import { GameScene } from './Scene';
import type { Direction } from './gameConstants';
import { CELL_SIZE } from './gameConstants';
import { getRowFromY } from './gameCore';

type IconComponent = ComponentType<{ className?: string; strokeWidth?: number }>;
type BonusKind = 'shield' | 'slowTime' | 'currentAnchor' | 'superHop' | 'fly';

const BONUS_HUD: Record<BonusKind, { Icon: IconComponent; className: string }> = {
  shield: { Icon: Shield, className: 'text-amber-200 drop-shadow-[0_0_12px_rgba(251,191,36,0.75)]' },
  slowTime: { Icon: Timer, className: 'text-sky-200 drop-shadow-[0_0_12px_rgba(125,211,252,0.75)]' },
  currentAnchor: { Icon: Anchor, className: 'text-teal-200 drop-shadow-[0_0_12px_rgba(94,234,212,0.75)]' },
  superHop: { Icon: Rabbit, className: 'text-orange-200 drop-shadow-[0_0_12px_rgba(251,146,60,0.75)]' },
  fly: { Icon: Bug, className: 'text-lime-200 drop-shadow-[0_0_12px_rgba(190,242,100,0.75)]' },
};

function ControlButton({ direction, onMove, className = '' }: {
  direction: Direction;
  onMove: (direction: Direction) => void;
  className?: string;
}) {
  const Icon = direction === 'up'
    ? ArrowUp
    : direction === 'down'
      ? ArrowDown
      : direction === 'left'
        ? ArrowLeft
        : ArrowRight;

  return (
    <button
      type="button"
      aria-label={`Move ${direction}`}
      onPointerDown={(event) => {
        event.preventDefault();
        onMove(direction);
      }}
      className={`pointer-events-auto flex h-16 w-16 touch-none items-center justify-center rounded-[1.35rem] border border-white/25 bg-[#02190d]/70 text-slate-200 shadow-[0_0_22px_rgba(0,0,0,0.35)] backdrop-blur-md transition active:scale-95 sm:h-12 sm:w-12 sm:rounded-2xl ${className}`}
    >
      <Icon className="h-7 w-7 sm:h-5 sm:w-5" strokeWidth={3} />
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
        className="pointer-events-none absolute left-0 right-0 top-0 z-20 flex justify-center"
        style={{ paddingTop: 'max(16px, env(safe-area-inset-top))' }}
      >
        <div
          className="pointer-events-auto flex h-[4.35rem] items-center justify-between rounded-[2rem] border border-white/25 bg-[#02190d]/75 px-5 text-slate-200 shadow-[0_16px_40px_rgba(0,0,0,0.25)] backdrop-blur-md sm:h-[3.75rem] sm:px-4"
          style={{ width: 'min(calc(100% - 32px), 760px)' }}
        >
          <div className="flex min-w-[6rem] items-center gap-2">
            <Coins className="h-7 w-7 text-yellow-300 sm:h-5 sm:w-5" strokeWidth={2.8} />
            <span className="font-mono text-4xl font-black leading-none tracking-normal text-slate-300 tabular-nums sm:text-2xl">
              {gameState.score}
            </span>
          </div>

          <div className="flex min-w-[5rem] items-center justify-center gap-2">
            {ActiveBonusIcon ? (
              <>
                <ActiveBonusIcon className={`h-9 w-9 sm:h-6 sm:w-6 ${activeBonusMeta.className}`} strokeWidth={2.8} />
                <span className="font-mono text-3xl font-black leading-none tracking-normal text-slate-300 tabular-nums sm:text-xl">
                  {activeBonus?.remainingSeconds ?? 0}s
                </span>
              </>
            ) : (
              <>
                <HeartPulse className="h-9 w-9 text-emerald-400 drop-shadow-[0_0_12px_rgba(52,211,153,0.75)] sm:h-6 sm:w-6" strokeWidth={2.6} />
                <span className="font-mono text-3xl font-black leading-none tracking-normal text-slate-300 tabular-nums sm:text-xl">
                  {gameState.lives}
                </span>
              </>
            )}
          </div>

          <div className="flex min-w-[7.25rem] items-center justify-end gap-3 sm:min-w-[6rem] sm:gap-2">
            <span className="whitespace-nowrap font-mono text-3xl font-black leading-none tracking-normal text-slate-300 sm:text-xl">
              LVL {gameState.level}
            </span>
            <button
              type="button"
              aria-label={gameState.paused ? 'Resume' : 'Pause'}
              onClick={togglePause}
              className="flex h-14 w-14 items-center justify-center rounded-[1.55rem] border border-white/25 bg-[#02190d]/70 text-slate-300 transition hover:bg-white/10 active:scale-95 sm:h-11 sm:w-11 sm:rounded-2xl"
            >
              {gameState.paused ? <Play className="h-6 w-6" strokeWidth={3} /> : <Pause className="h-6 w-6" strokeWidth={3} />}
            </button>
          </div>
        </div>
      </div>

      <div
        className="pointer-events-none absolute bottom-0 left-0 right-0 z-20 flex flex-col items-center"
        style={{ paddingBottom: 'max(18px, env(safe-area-inset-bottom))' }}
      >
        <ControlButton direction="up" onMove={(direction) => moveFrog(direction, 'touch')} className="mb-3 sm:mb-2" />
        <div className="flex gap-4 sm:gap-3">
          <ControlButton direction="left" onMove={(direction) => moveFrog(direction, 'touch')} />
          <ControlButton direction="down" onMove={(direction) => moveFrog(direction, 'touch')} />
          <ControlButton direction="right" onMove={(direction) => moveFrog(direction, 'touch')} />
        </div>
        {supportsKeyboardHints && (
          <p className="mt-3 font-mono text-xs font-semibold tracking-normal text-slate-300/75 sm:text-[10px]">
            Arrow Keys / WASD | P Pause
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
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/50 backdrop-blur-sm">
          <h2 className="font-mono text-4xl font-black tracking-normal text-white">PAUSED</h2>
          <button
            type="button"
            onClick={togglePause}
            className="mt-5 inline-flex items-center gap-2 rounded-lg border border-white/20 bg-[#02190d]/80 px-6 py-3 font-mono text-sm font-bold tracking-normal text-slate-100 transition hover:bg-white/10 active:scale-95"
          >
            <Play className="h-4 w-4" strokeWidth={2.8} />
            RESUME
          </button>
        </div>
      )}
    </div>
  );
}
