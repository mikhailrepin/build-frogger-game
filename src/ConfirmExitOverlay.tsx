import { useEffect, useRef } from 'react';
import { UI_COPY, type Locale } from './localization';

const confirmButtonClass = [
  'flex h-12 w-[212px] items-center justify-center overflow-hidden',
  'rounded-2xl border border-[rgba(123,123,123,0.5)] bg-black/20 px-3 py-1',
  'text-[20px] font-medium uppercase leading-8 tracking-[2px]',
  'transition duration-150 hover:bg-white/[0.06] focus-visible:outline-none',
  'focus-visible:ring-2 focus-visible:ring-[#84cd4c]/70 active:scale-[0.98]',
].join(' ');

interface ConfirmExitOverlayProps {
  locale: Locale;
  onExit: () => void;
  onResume: () => void;
}

export function ConfirmExitOverlay({
  locale,
  onExit,
  onResume,
}: ConfirmExitOverlayProps) {
  const resumeButtonRef = useRef<HTMLButtonElement>(null);
  const copy = UI_COPY[locale].confirmExit;

  useEffect(() => {
    resumeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.repeat) {
        return;
      }

      if (event.code === 'Space' || event.code === 'Enter' || event.code === 'NumpadEnter') {
        event.preventDefault();
        onResume();
      } else if (event.code === 'Escape') {
        event.preventDefault();
        onExit();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onExit, onResume]);

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="confirm-exit-title"
      aria-describedby="confirm-exit-description"
      className="ui-font absolute inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/70 text-[var(--ui-fg)] backdrop-blur-[4.5px]"
      lang={locale}
    >
      <div className="flex min-h-[min(100%,874px)] w-full max-w-[402px] translate-y-4 flex-col items-center justify-center gap-2.5 px-4 py-4">
        <header className="flex min-h-[180px] w-full flex-1 flex-col items-center justify-end gap-2 px-4 py-6 text-center">
          <h2
            id="confirm-exit-title"
            className="w-full text-[32px] font-medium uppercase leading-10 tracking-[3.2px]"
          >
            {copy.title}
          </h2>
          <p
            id="confirm-exit-description"
            className="w-full text-[16px] font-normal leading-6 tracking-[1.6px]"
          >
            {copy.description}
          </p>
        </header>

        <footer className="flex min-h-[241px] w-full flex-1 flex-col items-center justify-end gap-3 pb-[100px]">
          <button
            ref={resumeButtonRef}
            type="button"
            onClick={onResume}
            className={`${confirmButtonClass} text-[#84cd4c]`}
          >
            {copy.resume}
          </button>
          <button
            type="button"
            onClick={onExit}
            className={`${confirmButtonClass} text-[#e96f5c] ${locale === 'ru' ? 'ui-button--compact-copy' : ''}`}
          >
            {copy.exitToMenu}
          </button>
          <p className="flex items-center justify-center gap-1 text-[12px] font-normal leading-4 text-white opacity-70">
            <span>Space</span>
            <span>/</span>
            <span>Enter</span>
            <span className="text-[10px] [text-shadow:0_2px_2.8px_black]">•</span>
            <span>{copy.exitHelp}</span>
          </p>
        </footer>
      </div>
    </div>
  );
}
