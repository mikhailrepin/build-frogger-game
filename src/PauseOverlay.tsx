import { useEffect, useRef, useState } from 'react';
import { AUDIO_VOLUME_LEVELS } from './audio';
import { ConfirmExitOverlay } from './ConfirmExitOverlay';
import { getNumberLocale, UI_COPY, type Locale } from './localization';

const VOLUME_BAR_HEIGHTS = [24, 32, 40, 48] as const;

const PAUSE_ASSETS = {
  volumeLow: '/ui/volume-low.svg',
  volumeHigh: '/ui/volume-high.svg',
  volumeOff: '/ui/volume-off.svg',
};

const menuButtonClass = [
  'flex h-12 w-[212px] items-center justify-center gap-2 overflow-hidden',
  'rounded-2xl border border-[rgba(123,123,123,0.5)] bg-black/20 px-3 py-1',
  'text-[20px] font-medium uppercase leading-8 tracking-[2px] text-[var(--ui-fg)]',
  'transition duration-150 hover:bg-white/[0.06] focus-visible:outline-none',
  'focus-visible:ring-2 focus-visible:ring-[#84cd4c]/70 active:scale-[0.98]',
  'disabled:cursor-default disabled:opacity-100 disabled:hover:bg-black/20 disabled:active:scale-100',
].join(' ');

interface PauseOverlayProps {
  locale: Locale;
  score: number;
  volumeLevel: number;
  muted: boolean;
  onDecreaseVolume: () => void;
  onIncreaseVolume: () => void;
  onToggleMute: () => void;
  onExitToMainScreen: () => void;
  onResume: () => void;
}

export function PauseOverlay({
  locale,
  score,
  volumeLevel,
  muted,
  onDecreaseVolume,
  onIncreaseVolume,
  onToggleMute,
  onExitToMainScreen,
  onResume,
}: PauseOverlayProps) {
  const [confirmingExit, setConfirmingExit] = useState(false);
  const resumeButtonRef = useRef<HTMLButtonElement>(null);
  const copy = UI_COPY[locale].pause;

  useEffect(() => {
    resumeButtonRef.current?.focus();
  }, []);

  if (confirmingExit) {
    return (
      <ConfirmExitOverlay
        locale={locale}
        onExit={onExitToMainScreen}
        onResume={onResume}
      />
    );
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="pause-title"
      className="ui-font absolute inset-0 z-40 flex items-center justify-center overflow-y-auto bg-black/70 text-[var(--ui-fg)] backdrop-blur-[4.5px]"
      lang={locale}
    >
      <div className="flex min-h-[min(100%,874px)] w-full max-w-[402px] flex-col items-center justify-center gap-2.5 px-4 py-4">
        <header className="flex min-h-[180px] w-full flex-col items-center justify-center gap-2 px-4 py-6 text-center">
          <h2
            id="pause-title"
            className="text-[48px] font-medium uppercase leading-[48px] tracking-[4.8px]"
          >
            {copy.title}
          </h2>
          <p className="flex items-center justify-center gap-2 text-[16px] font-normal leading-8 tracking-[1.6px]">
            <span>{copy.score}</span>
            <span className="text-[#ffeb3b] tabular-nums">
              {score.toLocaleString(getNumberLocale(locale))}
            </span>
          </p>
        </header>

        <div className="flex w-full flex-col items-center justify-center gap-6 px-4">
          <div className="flex items-center justify-center gap-4" aria-label={`${copy.volume} ${volumeLevel} / ${AUDIO_VOLUME_LEVELS}`}>
            <button
              type="button"
              aria-label={copy.decreaseVolume}
              onClick={onDecreaseVolume}
              disabled={volumeLevel <= 0}
              className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[rgba(123,123,123,0.5)] bg-black/20 p-1 transition hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#84cd4c]/70 active:scale-95 disabled:opacity-40"
            >
              <img src={PAUSE_ASSETS.volumeLow} alt="" className="h-6 w-6" draggable={false} />
            </button>

            <div className="flex h-12 items-center gap-3" aria-hidden="true">
              {VOLUME_BAR_HEIGHTS.map((height, index) => {
                const active = !muted && index < volumeLevel;
                return (
                  <span
                    key={height}
                    className={`w-3 rounded-xl bg-[var(--ui-fg)] backdrop-blur-md transition-opacity ${active ? 'opacity-100' : 'opacity-20'}`}
                    style={{ height }}
                  />
                );
              })}
            </div>

            <button
              type="button"
              aria-label={copy.increaseVolume}
              onClick={onIncreaseVolume}
              disabled={volumeLevel >= AUDIO_VOLUME_LEVELS}
              className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[rgba(123,123,123,0.5)] bg-black/20 p-1 transition hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#84cd4c]/70 active:scale-95 disabled:opacity-40"
            >
              <img src={PAUSE_ASSETS.volumeHigh} alt="" className="h-6 w-6" draggable={false} />
            </button>
          </div>

          <div className="flex w-full flex-col items-center justify-center gap-3">
            <button
              type="button"
              aria-pressed={muted}
              onClick={onToggleMute}
              className={menuButtonClass}
            >
              <span>
                {copy.sound}{' '}
                <span className={muted ? 'text-[#e96f5c]' : 'text-[#84cd4c]'}>
                  {muted ? copy.soundOff : copy.soundOn}
                </span>
              </span>
              {muted ? (
                <img src={PAUSE_ASSETS.volumeOff} alt="" className="h-6 w-6" draggable={false} />
              ) : null}
            </button>
            <button type="button" disabled className={menuButtonClass}>
              {copy.bonusGuide}
            </button>
            <button
              type="button"
              onClick={() => setConfirmingExit(true)}
              className={`${menuButtonClass} ${locale === 'ru' ? 'ui-button--compact-copy' : ''}`}
            >
              {copy.mainScreen}
            </button>
          </div>
        </div>

        <footer className="flex min-h-[180px] w-full flex-col items-center justify-end gap-3">
          <button
            ref={resumeButtonRef}
            type="button"
            onClick={onResume}
            className={menuButtonClass}
          >
            {copy.backToGame}
          </button>
          <p className="keyboard-help flex items-center justify-center gap-1 text-[12px] font-normal leading-4 text-white">
            <span>P</span>
            <span>{copy.resumeHelp}</span>
          </p>
        </footer>
      </div>
    </div>
  );
}
