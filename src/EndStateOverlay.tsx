const endStateButtonClass = [
  'liquid-glass flex h-12 w-[212px] items-center justify-center rounded-2xl px-3 py-1',
  'text-[20px] font-medium uppercase leading-8 tracking-[2px] text-[var(--ui-fg)]',
  'transition duration-150 hover:bg-white/[0.06] focus-visible:outline-none',
  'focus-visible:ring-2 focus-visible:ring-[#84cd4c]/70 active:scale-[0.98]',
].join(' ');

function formatScore(value: number) {
  return value.toLocaleString('ru-RU');
}

interface LevelCompleteOverlayProps {
  level: number;
  score: number;
  bonus: number;
}

export function LevelCompleteOverlay({
  level,
  score,
  bonus,
}: LevelCompleteOverlayProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="ui-font absolute inset-0 z-30 flex items-center justify-center overflow-hidden bg-black/70 text-[var(--ui-fg)] backdrop-blur-[4.5px]"
    >
      <div className="flex min-h-[min(100%,874px)] w-full max-w-[402px] flex-col items-center justify-center gap-2.5 px-4 py-4 text-center">
        <div className="flex min-h-[180px] w-full flex-1 flex-col items-center justify-center gap-2 px-4 py-6">
          <h2 className="w-full max-w-[340px] text-[48px] font-medium uppercase leading-[48px] tracking-[4.8px] text-[#84cd4c]">
            <span className="block">Level {level}</span>
            <span className="block">Complete</span>
          </h2>
          <p className="flex w-full items-center justify-center gap-2 whitespace-nowrap text-[16px] font-normal leading-8 tracking-[1.6px]">
            <span>Score</span>
            <span className="text-[#ffeb3b] tabular-nums">{formatScore(score)}</span>
            <span>|</span>
            <span>Bonus</span>
            <span className="text-[#00e5ff] tabular-nums">{formatScore(bonus)}</span>
          </p>
        </div>
      </div>
    </div>
  );
}

interface GameOverOverlayProps {
  score: number;
  bestScore: number;
  onPlayAgain: () => void;
}

export function GameOverOverlay({
  score,
  bestScore,
  onPlayAgain,
}: GameOverOverlayProps) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="game-over-title"
      className="ui-font absolute inset-0 z-30 flex items-center justify-center overflow-y-auto bg-black/70 text-[var(--ui-fg)] backdrop-blur-[4.5px]"
    >
      <div className="flex min-h-[min(100%,874px)] w-full max-w-[402px] flex-col items-center justify-center gap-2.5 px-4 py-4">
        <header className="flex min-h-[180px] w-full flex-1 flex-col items-center justify-end gap-2 px-4 py-6 text-center">
          <h2
            id="game-over-title"
            className="whitespace-nowrap text-[48px] font-medium uppercase leading-[48px] tracking-[4.8px] text-[#e96f5c]"
          >
            Game Over
          </h2>
          <p className="flex w-full items-center justify-center gap-2 whitespace-nowrap text-[16px] font-normal leading-8 tracking-[1.6px]">
            <span>Score</span>
            <span className="text-[#ffeb3b] tabular-nums">{formatScore(score)}</span>
            <span>|</span>
            <span>Best</span>
            <span className="text-[#84cd4c] tabular-nums">{formatScore(bestScore)}</span>
          </p>
        </header>

        <footer className="flex min-h-[241px] w-full flex-1 flex-col items-center justify-end gap-3 pb-[100px]">
          <button
            type="button"
            onClick={onPlayAgain}
            className={endStateButtonClass}
          >
            Play Again
          </button>
          <p className="flex items-center justify-center gap-1 text-[12px] font-normal leading-4 text-white/70">
            <span>Space</span>
            <span>/</span>
            <span>Enter</span>
          </p>
        </footer>
      </div>
    </div>
  );
}
