import { useEffect, useRef } from 'react';
import { AUDIO_VOLUME_LEVELS } from './audio';

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
  score: number;
  volumeLevel: number;
  muted: boolean;
  onDecreaseVolume: () => void;
  onIncreaseVolume: () => void;
  onToggleMute: () => void;
  onResume: () => void;
}

export function PauseOverlay({
  score,
  volumeLevel,
  muted,
  onDecreaseVolume,
  onIncreaseVolume,
  onToggleMute,
  onResume,
}: PauseOverlayProps) {
  const resumeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    resumeButtonRef.current?.focus();
  }, []);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="pause-title"
      className="ui-font absolute inset-0 z-40 flex items-center justify-center overflow-y-auto bg-black/70 text-[var(--ui-fg)] backdrop-blur-[4.5px]"
    >
      <div className="flex min-h-[min(100%,874px)] w-full max-w-[402px] flex-col items-center justify-center gap-2.5 px-4 py-4">
        <header className="flex min-h-[180px] w-full flex-col items-center justify-center gap-2 px-4 py-6 text-center">
          <h2
            id="pause-title"
            className="text-[48px] font-medium uppercase leading-[48px] tracking-[4.8px]"
          >
            Pause
          </h2>
          <p className="flex items-center justify-center gap-2 text-[16px] font-normal leading-8 tracking-[1.6px]">
            <span>Score</span>
            <span className="text-[#ffeb3b] tabular-nums">
              {score.toLocaleString('ru-RU')}
            </span>
          </p>
        </header>

        <div className="flex w-full flex-col items-center justify-center gap-6 px-4">
          <div className="flex items-center justify-center gap-4" aria-label={`Volume ${volumeLevel} of ${AUDIO_VOLUME_LEVELS}`}>
            <button
              type="button"
              aria-label="Decrease volume"
              onClick={onDecreaseVolume}
              disabled={volumeLevel <= 1}
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
              aria-label="Increase volume"
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
                Sound{' '}
                <span className={muted ? 'text-[#e96f5c]' : 'text-[#84cd4c]'}>
                  {muted ? 'Off' : 'On'}
                </span>
              </span>
              {muted ? (
                <img src={PAUSE_ASSETS.volumeOff} alt="" className="h-6 w-6" draggable={false} />
              ) : null}
            </button>
            <button type="button" disabled className={menuButtonClass}>
              Bonus Guide
            </button>
            <button type="button" disabled className={menuButtonClass}>
              Main Screen
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
            Back to Game
          </button>
          <p className="flex items-center justify-center gap-1 text-[12px] font-normal leading-4 text-white/70">
            <span>P</span>
            <span>Resume</span>
          </p>
        </footer>
      </div>
    </div>
  );
}
