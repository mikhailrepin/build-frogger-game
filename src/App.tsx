import { useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import { useGame } from './useGame';
import { GameScene } from './Scene';
import type { Direction } from './gameConstants';

export default function App() {
  const { frog, gameState, laneItems, deathAnimation, showSplash, moveFrog, laneConfigs, totalRows } = useGame();
  const [shaking, setShaking] = useState(false);

  useEffect(() => {
    if (deathAnimation) {
      setShaking(true);
      const t = setTimeout(() => setShaking(false), 350);
      return () => clearTimeout(t);
    }
  }, [deathAnimation]);

  const handleTouch = (dir: Direction) => moveFrog(dir);

  return (
    <div className="fixed inset-0 select-none overflow-hidden">
      {/* Full-screen 3D canvas — no black, map fills the view */}
      <div className={`absolute inset-0 ${shaking ? 'animate-shake' : ''}`}>
        <Canvas
          orthographic
          camera={{
            near: -100, far: 100,
            position: [6, 8, 6],
            zoom: 55,
          }}
          shadows
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
            frog={frog} gameState={gameState} laneItems={laneItems}
            deathAnimation={deathAnimation} showSplash={showSplash}
            laneConfigs={laneConfigs} totalRows={totalRows}
          />
        </Canvas>
      </div>

      {/* ── HUD overlay (top) ── */}
      <div className="absolute top-0 left-0 right-0 z-20 pointer-events-none">
        <div className="flex items-center justify-between max-w-3xl mx-auto px-4 py-2 pointer-events-auto">
          <div className="flex gap-4">
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

          <div className="bg-black/40 backdrop-blur-sm rounded-lg px-4 py-1">
            <h1 className="text-base font-black tracking-[0.2em] font-mono flex items-center gap-1.5"
              style={{ background: 'linear-gradient(135deg,#4ade80,#16a34a)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              <span style={{ WebkitTextFillColor: 'initial' }}>🐸</span> FROGGER
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex flex-col items-center bg-black/40 backdrop-blur-sm rounded-lg px-3 py-1">
              <span className="text-[8px] uppercase tracking-[0.2em] text-gray-400 font-mono">Lvl</span>
              <span className="text-lg font-black text-sky-400 font-mono">{gameState.level}</span>
            </div>
            <div className="flex gap-0.5 bg-black/40 backdrop-blur-sm rounded-lg px-2 py-1.5">
              {Array.from({ length: 3 }).map((_, i) => (
                <span key={i} className={`text-sm transition-all duration-300 ${i < gameState.lives ? 'opacity-100 scale-100' : 'opacity-20 scale-50'}`}>
                  🐸
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Controls overlay (bottom) ── */}
      <div className="absolute bottom-3 left-0 right-0 z-20 flex flex-col items-center gap-1 pointer-events-none">
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
        <p className="text-white/30 text-[9px] font-mono tracking-wider mt-0.5">
          Arrow Keys / WASD · P Pause
        </p>
      </div>

      {/* ── Game state overlays ── */}
      {gameState.gameOver && (
        <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center z-30 backdrop-blur-sm">
          <div className="text-center space-y-3 animate-bounce-in">
            <div className="text-6xl">💀</div>
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
            <button onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }))}
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
            <div className="text-6xl">🎉</div>
            <h2 className="text-4xl font-black font-mono tracking-wider"
              style={{ background: 'linear-gradient(135deg,#4ade80,#22c55e)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', filter: 'drop-shadow(0 0 16px rgba(74,222,128,0.5))' }}>
              LEVEL {gameState.level} COMPLETE!
            </h2>
            <p className="text-xl text-amber-400 font-mono font-bold">Score: {gameState.score}</p>
            <div className="flex gap-2 justify-center">
              {Array.from({ length: 5 }).map((_, i) => (
                <span key={i} className="text-2xl animate-bounce" style={{ animationDelay: `${i * 0.1}s` }}>🐸</span>
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
