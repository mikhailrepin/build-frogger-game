import { getNumberLocale, UI_COPY, type Locale } from './localization';

const endStateButtonClass = [
  'liquid-glass flex h-12 w-[212px] items-center justify-center rounded-2xl px-3 py-1',
  'text-[20px] font-medium uppercase leading-8 tracking-[2px] text-[var(--ui-fg)]',
  'transition duration-150 hover:bg-white/[0.06] focus-visible:outline-none',
  'focus-visible:ring-2 focus-visible:ring-[#84cd4c]/70 active:scale-[0.98]',
].join(' ');

function formatScore(value: number, locale: Locale) {
  return value.toLocaleString(getNumberLocale(locale));
}

interface LevelCompleteOverlayProps {
  locale: Locale;
  level: number;
  score: number;
  bonus: number;
}

export function LevelCompleteOverlay({
  locale,
  level,
  score,
  bonus,
}: LevelCompleteOverlayProps) {
  const copy = UI_COPY[locale].levelComplete;

  return (
    <div
      role="status"
      aria-live="polite"
      className="ui-font absolute inset-0 z-30 flex items-center justify-center overflow-hidden bg-black/70 text-[var(--ui-fg)] backdrop-blur-[4.5px]"
      lang={locale}
    >
      <div className="flex min-h-[min(100%,874px)] w-full max-w-[402px] flex-col items-center justify-center gap-2.5 px-4 py-4 text-center">
        <div className="flex min-h-[180px] w-full flex-1 flex-col items-center justify-center gap-2 px-4 py-6">
          <h2 className="w-full max-w-[340px] text-[48px] font-medium uppercase leading-[48px] tracking-[4.8px] text-[#84cd4c]">
            <span className="block">{copy.level} {level}</span>
            <span className="block">{copy.complete}</span>
          </h2>
          <p className="flex w-full items-center justify-center gap-2 whitespace-nowrap text-[16px] font-normal leading-8 tracking-[1.6px]">
            <span>{copy.score}</span>
            <span className="text-[#ffeb3b] tabular-nums">{formatScore(score, locale)}</span>
            <span>|</span>
            <span>{copy.bonus}</span>
            <span className="text-[#00e5ff] tabular-nums">{formatScore(bonus, locale)}</span>
          </p>
        </div>
      </div>
    </div>
  );
}

interface GameOverOverlayProps {
  locale: Locale;
  score: number;
  bestScore: number;
  onPlayAgain: () => void;
}

export function GameOverOverlay({
  locale,
  score,
  bestScore,
  onPlayAgain,
}: GameOverOverlayProps) {
  const copy = UI_COPY[locale].gameOver;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="game-over-title"
      className="ui-font absolute inset-0 z-30 flex items-center justify-center overflow-y-auto bg-black/70 text-[var(--ui-fg)] backdrop-blur-[4.5px]"
      lang={locale}
    >
      <div className="flex min-h-[min(100%,874px)] w-full max-w-[402px] flex-col items-center justify-center gap-2.5 px-4 py-4">
        <header className="flex min-h-[180px] w-full flex-1 flex-col items-center justify-end gap-2 px-4 py-6 text-center">
          <h2
            id="game-over-title"
            className="whitespace-nowrap text-[48px] font-medium uppercase leading-[48px] tracking-[4.8px] text-[#e96f5c]"
          >
            {copy.title}
          </h2>
          <p className="flex w-full items-center justify-center gap-2 whitespace-nowrap text-[16px] font-normal leading-8 tracking-[1.6px]">
            <span>{copy.score}</span>
            <span className="text-[#ffeb3b] tabular-nums">{formatScore(score, locale)}</span>
            <span>|</span>
            <span>{copy.best}</span>
            <span className="text-[#84cd4c] tabular-nums">{formatScore(bestScore, locale)}</span>
          </p>
        </header>

        <footer className="flex min-h-[241px] w-full flex-1 flex-col items-center justify-end gap-3 pb-[100px]">
          <button
            type="button"
            onClick={onPlayAgain}
            className={endStateButtonClass}
          >
            {copy.playAgain}
          </button>
          <p className="keyboard-help flex items-center justify-center gap-1 text-[12px] font-normal leading-4 text-white">
            <span>Space</span>
            <span>/</span>
            <span>Enter</span>
          </p>
        </footer>
      </div>
    </div>
  );
}
