import { useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import { useGame } from './useGame';
import { GameScene } from './Scene';
import type { Direction } from './gameConstants';
import { CELL_SIZE } from './gameConstants';
import { getRowFromY } from './gameCore';

function FrogIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <circle cx="12" cy="13" r="6.5" fill="currentColor" />
      <circle cx="8.5" cy="7.5" r="2.2" fill="currentColor" />
      <circle cx="15.5" cy="7.5" r="2.2" fill="currentColor" />
      <circle cx="8.5" cy="7.5" r="0.8" fill="#0f172a" />
      <circle cx="15.5" cy="7.5" r="0.8" fill="#0f172a" />
      <path d="M8 14.5c1.2 1.1 6.8 1.1 8 0" stroke="#0f172a" strokeWidth="1.2" strokeLinecap="round" fill="none" />
    </svg>
  );
}

function SkullIcon({ className = 'w-10 h-10' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <circle cx="12" cy="10" r="6.8" fill="currentColor" />
      <circle cx="9" cy="9" r="1.2" fill="#0f172a" />
      <circle cx="15" cy="9" r="1.2" fill="#0f172a" />
      <path d="M9 14.2h6" stroke="#0f172a" strokeWidth="1.4" strokeLinecap="round" />
      <rect x="9" y="16" width="6" height="3.2" rx="1.1" fill="currentColor" />
    </svg>
  );
}

function VictoryIcon({ className = 'w-10 h-10' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        d="M12 2.5l2.8 5.7 6.3.9-4.5 4.4 1.1 6.2L12 16.7 6.3 19.7l1.1-6.2L2.9 9.1l6.3-.9L12 2.5z"
        fill="currentColor"
      />
    </svg>
  );
}

function ShieldIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path d="M12 2.5l7 2.8v5.2c0 4.6-2.7 8.7-7 10.9-4.3-2.2-7-6.3-7-10.9V5.3L12 2.5z" fill="currentColor" />
      <path d="M8.5 11.5l2.3 2.3 4.8-5" stroke="#0f172a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

function ClockIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="8.2" fill="currentColor" />
      <path d="M12 7.3v5l3.3 2" stroke="#0f172a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <circle cx="12" cy="12" r="1" fill="#0f172a" />
    </svg>
  );
}

function AnchorIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path d="M12 2.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5z" fill="currentColor" />
      <path d="M12 7.5v9.2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M6.8 13.4c0 3 2.4 5.6 5.2 5.6s5.2-2.6 5.2-5.6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />
      <path d="M8.2 19h7.6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M5 13.4h3.8M15.2 13.4H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function HopIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path d="M5 15l7-7 7 7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 11l4-4 4 4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 4v16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.55" />
    </svg>
  );
}

function FlyIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <ellipse cx="12" cy="12" rx="3.2" ry="4.8" fill="currentColor" />
      <path d="M7.2 8.3c1.4-1.7 3-2.5 4.8-2.5-.3 2-.9 3.7-2.2 5.1-1.3-.4-2.1-1.1-2.6-2.6z" fill="currentColor" opacity="0.75" />
      <path d="M16.8 8.3c-.5 1.5-1.3 2.2-2.6 2.6-1.3-1.4-1.9-3.1-2.2-5.1 1.8 0 3.4.8 4.8 2.5z" fill="currentColor" opacity="0.75" />
      <path d="M12 7v10" stroke="#0f172a" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M10.4 15.7c.5.7 1 .9 1.6.9s1.1-.2 1.6-.9" stroke="#0f172a" strokeWidth="1.2" strokeLinecap="round" fill="none" />
    </svg>
  );
}

export default function App() {
  const { frogRef, gameState, laneItems, laneItemsRef, levelModifiers, bonusItems, shieldActive, slowTimeActive, currentAnchorActive, superHopActive, flyComboActive, challengeBonus, levelElapsedSeconds, deathAnimation, showSplash, moveFrog, requestSimulationStep, restartGame, laneConfigs, totalRows, devFlags } = useGame();
  const [shaking, setShaking] = useState(false);
  const [cellDebug, setCellDebug] = useState<{ row: number; col: number } | null>(null);
  const [reducedMotion, setReducedMotion] = useState(() => (
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  ));
  const [supportsTouchControls, setSupportsTouchControls] = useState(() => (
    typeof window !== 'undefined' && window.matchMedia('(any-pointer: coarse)').matches
  ));
  const [supportsKeyboardHints, setSupportsKeyboardHints] = useState(() => (
    typeof window !== 'undefined' && window.matchMedia('(any-pointer: fine)').matches
  ));

  useEffect(() => {
    if (deathAnimation) {
      setShaking(true);
      const t = setTimeout(() => setShaking(false), 350);
      return () => clearTimeout(t);
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

    const touchQuery = window.matchMedia('(any-pointer: coarse)');
    const keyboardQuery = window.matchMedia('(any-pointer: fine)');
    const sync = () => {
      setSupportsTouchControls(touchQuery.matches);
      setSupportsKeyboardHints(keyboardQuery.matches);
    };

    sync();
    touchQuery.addEventListener('change', sync);
    keyboardQuery.addEventListener('change', sync);
    return () => {
      motionQuery.removeEventListener('change', syncMotion);
      touchQuery.removeEventListener('change', sync);
      keyboardQuery.removeEventListener('change', sync);
    };
  }, []);

  const handleTouch = (dir: Direction) => moveFrog(dir, 'touch');

  return (
    <div className="fixed inset-0 select-none overflow-hidden">
      {/* Full-screen 3D canvas — no black, map fills the view */}
      <div className={`absolute inset-0 ${shaking && !reducedMotion ? 'animate-shake' : ''}`}>
        <Canvas
          orthographic
          camera={{
            near: -100, far: 100,
            position: [6, 8, 6],
            zoom: 55,
          }}
          shadows="percentage"
          dpr={[1, 2]}
          gl={{ antialias: true, alpha: false, powerPreference: 'high-performance',
                localClippingEnabled: true }}
          onCreated={({ camera, gl }) => {
            camera.lookAt(0, 0, 0);
            camera.updateProjectionMatrix();
            gl.setClearColor(new THREE.Color('#1a472a'));
          }}
        >
          <GameScene
            frogRef={frogRef} gameState={gameState} laneItems={laneItems} laneItemsRef={laneItemsRef}
            levelModifiers={levelModifiers}
            bonusItems={bonusItems} shieldActive={shieldActive} slowTimeActive={slowTimeActive} currentAnchorActive={currentAnchorActive} superHopActive={superHopActive}
            deathAnimation={deathAnimation} showSplash={showSplash}
            laneConfigs={laneConfigs} totalRows={totalRows}
            showCollisionBoxes={devFlags.showCollisionBoxes}
            reducedMotion={reducedMotion}
          />
        </Canvas>
      </div>

      {/* ── HUD overlay (top) ── */}
      <div className="absolute top-0 left-0 right-0 z-20 pointer-events-none">
        <div className="flex flex-wrap items-center justify-between gap-2 max-w-3xl mx-auto px-4 py-2 pointer-events-auto">
          <div className="flex gap-2 sm:gap-4">
            <div className="flex flex-col items-center bg-black/40 backdrop-blur-sm rounded-lg px-3 py-1">
              <span className="text-[8px] uppercase tracking-[0.2em] text-gray-400 font-mono">Score</span>
              <span className="text-lg font-black bg-clip-text text-transparent bg-gradient-to-r from-amber-300 to-yellow-500 font-mono tabular-nums">
                {gameState.score}
              </span>
            </div>
            <div className="flex flex-col items-center bg-black/40 backdrop-blur-sm rounded-lg px-3 py-1">
              <span className="text-[8px] uppercase tracking-[0.2em] text-gray-400 font-mono">Best</span>
              <span className="text-lg font-black text-amber-200/70 font-mono tabular-nums">{gameState.highScore}</span>
            </div>
          </div>

          <div className="w-full flex justify-center sm:w-auto">
            <div className="bg-black/40 backdrop-blur-sm rounded-lg px-4 py-1">
              <h1 className="text-base font-black tracking-[0.2em] font-mono flex items-center gap-1.5"
                style={{ background: 'linear-gradient(135deg,#4ade80,#16a34a)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                <span style={{ WebkitTextFillColor: 'initial' }}><FrogIcon className="w-4 h-4 text-emerald-300" /></span> FROGGER
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex flex-col items-center bg-black/40 backdrop-blur-sm rounded-lg px-3 py-1">
              <span className="text-[8px] uppercase tracking-[0.2em] text-gray-400 font-mono">Lvl</span>
              <span className="text-lg font-black text-sky-400 font-mono">{gameState.level}</span>
            </div>
            <div className="flex flex-col items-center bg-black/40 backdrop-blur-sm rounded-lg px-3 py-1">
              <span className="text-[8px] uppercase tracking-[0.2em] text-gray-400 font-mono">Time</span>
              <span className="text-lg font-black text-lime-300 font-mono tabular-nums">{levelElapsedSeconds}s</span>
            </div>
            <div className={`flex items-center rounded-lg bg-black/40 backdrop-blur-sm px-2 py-1 ${shieldActive ? 'text-amber-300' : 'text-gray-500'}`}>
              <ShieldIcon className="w-4 h-4" />
            </div>
            <div className={`flex items-center rounded-lg bg-black/40 backdrop-blur-sm px-2 py-1 ${slowTimeActive ? 'text-sky-300' : 'text-gray-500'}`}>
              <ClockIcon className="w-4 h-4" />
            </div>
            <div className={`flex items-center rounded-lg bg-black/40 backdrop-blur-sm px-2 py-1 ${currentAnchorActive ? 'text-teal-300' : 'text-gray-500'}`}>
              <AnchorIcon className="w-4 h-4" />
            </div>
            <div className={`flex items-center rounded-lg bg-black/40 backdrop-blur-sm px-2 py-1 ${superHopActive ? 'text-amber-300' : 'text-gray-500'}`}>
              <HopIcon className="w-4 h-4" />
            </div>
            <div className={`flex items-center rounded-lg bg-black/40 backdrop-blur-sm px-2 py-1 ${flyComboActive ? 'text-lime-300' : 'text-gray-500'}`}>
              <FlyIcon className="w-4 h-4" />
            </div>
            <div className="flex gap-0.5 bg-black/40 backdrop-blur-sm rounded-lg px-2 py-1.5">
              {Array.from({ length: 3 }).map((_, i) => (
                <span key={i} className={`transition-all duration-300 ${i < gameState.lives ? 'opacity-100 scale-100 text-emerald-300' : 'opacity-20 scale-50 text-emerald-300'}`}>
                  <FrogIcon className="w-4 h-4" />
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Controls overlay (bottom) ── */}
      {(supportsTouchControls || supportsKeyboardHints) && (
        <div className="absolute bottom-3 left-0 right-0 z-20 flex flex-col items-center gap-1 pointer-events-none">
          {supportsTouchControls && (
            <>
              <button onClick={() => handleTouch('up')}
                className="pointer-events-auto rounded-xl flex items-center justify-center transition-all active:scale-90 text-white/70 cursor-pointer"
                style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.1)', width: 48, height: 48 }}>
                <svg viewBox="0 0 24 24" width={18} height={18} fill="currentColor"><path d="M12 4l-8 8h5v8h6v-8h5z" /></svg>
              </button>
              <div className="flex gap-1">
                {(['left', 'down', 'right'] as Direction[]).map(dir => (
                  <button key={dir} onClick={() => handleTouch(dir)}
                    className="pointer-events-auto rounded-xl flex items-center justify-center transition-all active:scale-90 text-white/70 cursor-pointer"
                    style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.1)', width: 48, height: 48 }}>
                    <svg viewBox="0 0 24 24" width={18} height={18} fill="currentColor"
                      style={{ transform: dir === 'left' ? 'rotate(-90deg)' : dir === 'down' ? 'rotate(180deg)' : 'rotate(90deg)' }}>
                      <path d="M12 4l-8 8h5v8h6v-8h5z" />
                    </svg>
                  </button>
                ))}
              </div>
            </>
          )}
          {supportsKeyboardHints && (
            <p className="text-white/30 text-[9px] font-mono tracking-wider mt-0.5">
              Arrow Keys / WASD · P Pause
            </p>
          )}
        </div>
      )}

      {devFlags.showCellDebug && cellDebug && (
        <div className="absolute left-3 top-14 z-20 rounded-md border border-cyan-400/30 bg-black/60 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.22em] text-cyan-200 backdrop-blur-sm">
          R{cellDebug.row} C{cellDebug.col}
        </div>
      )}

      {devFlags.stepSimulation && (
        <div className="absolute right-3 top-14 z-20 flex gap-2">
          <button
            onClick={requestSimulationStep}
            className="rounded-md border border-cyan-400/30 bg-black/60 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.22em] text-cyan-200 backdrop-blur-sm"
          >
            STEP
          </button>
        </div>
      )}

      {/* ── Game state overlays ── */}
      {gameState.gameOver && (
        <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center z-30 backdrop-blur-sm">
          <div className="text-center space-y-3 animate-bounce-in">
            <div className="flex justify-center text-red-500 drop-shadow-[0_0_20px_rgba(239,68,68,0.5)]"><SkullIcon className="w-12 h-12" /></div>
            <h2 className="text-5xl font-black font-mono tracking-wider"
              style={{ background: 'linear-gradient(135deg,#ef4444,#dc2626)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', filter: 'drop-shadow(0 0 20px rgba(239,68,68,0.5))' }}>
              GAME OVER
            </h2>
            <div className="flex items-center justify-center gap-5 text-lg font-mono mt-2">
              <span className="text-gray-300">Score: <span className="text-amber-400 font-black">{gameState.score}</span></span>
              <span className="text-gray-600">|</span>
              <span className="text-gray-300">Best: <span className="text-amber-300 font-black">{gameState.highScore}</span></span>
            </div>
            {gameState.score > 0 && gameState.score >= gameState.highScore && (
              <p className="text-emerald-400 font-mono text-sm animate-pulse font-bold tracking-widest">★ NEW HIGH SCORE ★</p>
            )}
            <button onClick={() => restartGame()}
              className="mt-4 px-8 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-mono rounded-lg text-sm tracking-widest font-bold shadow-lg active:scale-95 transition-all cursor-pointer">
              PLAY AGAIN
            </button>
            <p className="text-gray-500 font-mono text-[10px]">SPACE or ENTER</p>
          </div>
        </div>
      )}

      {gameState.gameWon && (
        <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center z-30 backdrop-blur-[2px]">
          <div className="text-center space-y-3 animate-bounce-in">
            <div className="flex justify-center text-emerald-300 drop-shadow-[0_0_16px_rgba(74,222,128,0.5)]"><VictoryIcon className="w-12 h-12" /></div>
            <h2 className="text-4xl font-black font-mono tracking-wider"
              style={{ background: 'linear-gradient(135deg,#4ade80,#22c55e)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', filter: 'drop-shadow(0 0 16px rgba(74,222,128,0.5))' }}>
              LEVEL {gameState.level} COMPLETE!
            </h2>
            <p className="text-xl text-amber-400 font-mono font-bold">Score: {gameState.score}</p>
            {challengeBonus > 0 && (
              <p className="text-lime-300 font-mono text-sm font-bold tracking-widest">
                LEVEL BONUS +{challengeBonus}
              </p>
            )}
            <div className="flex gap-2 justify-center">
              {Array.from({ length: 5 }).map((_, i) => (
                <span key={i} className="animate-bounce text-emerald-300" style={{ animationDelay: `${i * 0.1}s` }}>
                  <FrogIcon className="w-5 h-5" />
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {gameState.paused && !gameState.gameOver && !gameState.gameWon && (
        <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center z-30">
          <h2 className="text-4xl font-black text-white font-mono tracking-[0.4em] animate-pulse">PAUSED</h2>
          <p className="text-gray-400 font-mono text-xs mt-2">Press P to resume</p>
        </div>
      )}
    </div>
  );
}
