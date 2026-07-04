import { useEffect, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { BonusModel3D } from './BonusModel3D';
import { BONUS_GUIDE_KINDS, getWrappedBonusIndex, type BonusKind } from './bonusGuide';
import { UI_COPY, type Locale } from './localization';

const GUIDE_ASSETS = {
  left: '/ui/btn-left.svg',
  right: '/ui/btn-right.svg',
};

const guideButtonClass = [
  'flex h-12 w-[212px] items-center justify-center overflow-hidden',
  'rounded-2xl border border-[rgba(123,123,123,0.5)] bg-black/20 px-3 py-1',
  'text-[20px] font-medium uppercase leading-8 tracking-[2px] text-[var(--ui-fg)]',
  'transition duration-150 hover:bg-white/[0.06] focus-visible:outline-none',
  'focus-visible:ring-2 focus-visible:ring-[#84cd4c]/70 active:scale-[0.98]',
].join(' ');

function PreviewModel({ kind, reducedMotion }: { kind: BonusKind; reducedMotion: boolean }) {
  const modelRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (!modelRef.current) return;
    const elapsed = clock.getElapsedTime();
    modelRef.current.rotation.y = reducedMotion ? 0.45 : elapsed * 0.9;
    modelRef.current.position.y = reducedMotion ? 0 : Math.sin(elapsed * 1.8) * 0.035;
  });

  return (
    <group ref={modelRef} scale={2.5} rotation={[-0.08, 0.45, 0]}>
      <BonusModel3D kind={kind} />
    </group>
  );
}

function BonusPreview({ kind, reducedMotion }: { kind: BonusKind; reducedMotion: boolean }) {
  return (
    <div className="h-[112px] w-[150px]" aria-hidden="true">
      <Canvas
        camera={{ position: [0, 0.22, 2.1], fov: 34 }}
        dpr={[1, 1.5]}
        frameloop={reducedMotion ? 'demand' : 'always'}
        gl={{
          alpha: true,
          antialias: true,
          powerPreference: 'low-power',
        }}
      >
        <ambientLight intensity={0.9} />
        <directionalLight position={[2, 3, 4]} intensity={1.6} />
        <directionalLight position={[-2, 1, 2]} intensity={0.45} color="#bbdefb" />
        <PreviewModel kind={kind} reducedMotion={reducedMotion} />
      </Canvas>
    </div>
  );
}

interface BonusGuideOverlayProps {
  locale: Locale;
  reducedMotion: boolean;
  source: 'mainMenu' | 'pause';
  onExitGuide: () => void;
  onBackToGame?: () => void;
}

export function BonusGuideOverlay({
  locale,
  reducedMotion,
  source,
  onExitGuide,
  onBackToGame,
}: BonusGuideOverlayProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const descriptionRef = useRef<HTMLDivElement>(null);
  const exitButtonRef = useRef<HTMLButtonElement>(null);
  const copy = UI_COPY[locale].bonusGuide;
  const activeKind = BONUS_GUIDE_KINDS[activeIndex] ?? BONUS_GUIDE_KINDS[0];
  const activeBonus = copy.bonuses[activeKind];

  const navigate = (delta: -1 | 1) => {
    setActiveIndex((current) => getWrappedBonusIndex(current, delta));
  };

  useEffect(() => {
    exitButtonRef.current?.focus({ preventScroll: true });
  }, []);

  useEffect(() => {
    if (descriptionRef.current) {
      descriptionRef.current.scrollTop = 0;
    }
  }, [activeIndex, locale]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code === 'ArrowLeft') {
        event.preventDefault();
        navigate(-1);
      } else if (event.code === 'ArrowRight') {
        event.preventDefault();
        navigate(1);
      } else if (event.code === 'Escape') {
        event.preventDefault();
        onExitGuide();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onExitGuide]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="bonus-guide-title"
      className="ui-font absolute inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 text-[var(--ui-fg)] backdrop-blur-[4.5px]"
      lang={locale}
    >
      <div className="flex h-[min(100%,874px)] min-h-[560px] w-full max-w-[402px] flex-col items-center justify-center gap-2.5 px-4 py-4">
        <section className="flex min-h-[180px] w-full min-w-0 flex-1 flex-col items-center justify-center gap-6 pb-6 pt-4">
          <h2
            id="bonus-guide-title"
            className="shrink-0 whitespace-nowrap text-center text-[32px] font-medium uppercase leading-10 tracking-[3.2px]"
          >
            {copy.title}
          </h2>

          <article
            className="flex min-h-0 w-full max-w-[450px] flex-1 flex-col items-center gap-2 overflow-hidden rounded-2xl border border-[rgba(123,123,123,0.5)] bg-black/20 px-3 pb-4 pt-5"
            aria-live="polite"
          >
            <BonusPreview kind={activeKind} reducedMotion={reducedMotion} />

            <h3 className="shrink-0 text-center text-[16px] font-normal leading-8 tracking-[1.6px] text-[#ffeb3b]">
              {activeBonus.name}
            </h3>

            <div
              ref={descriptionRef}
              className="bonus-guide-description min-h-0 w-full flex-1 overflow-y-auto overscroll-contain px-1 text-center text-[14px] font-normal leading-6 text-[var(--ui-fg)]"
              tabIndex={0}
            >
              <p>{activeBonus.description}</p>
            </div>

            <nav className="flex w-full shrink-0 items-center justify-center gap-6" aria-label={`${copy.pageLabel} ${activeIndex + 1} / ${BONUS_GUIDE_KINDS.length}`}>
              <button
                type="button"
                aria-label={copy.previous}
                onClick={() => navigate(-1)}
                className="h-12 w-12 rounded-[18px] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#84cd4c]/70 active:scale-95"
              >
                <img src={GUIDE_ASSETS.left} alt="" className="h-full w-full" draggable={false} />
              </button>

              <div className="flex items-center justify-center gap-2" aria-hidden="true">
                {BONUS_GUIDE_KINDS.map((kind, index) => (
                  <span
                    key={kind}
                    className={`h-3 w-2 rounded-xl bg-[var(--ui-fg)] backdrop-blur-md transition-opacity ${index === activeIndex ? 'opacity-100' : 'opacity-20'}`}
                  />
                ))}
              </div>

              <button
                type="button"
                aria-label={copy.next}
                onClick={() => navigate(1)}
                className="h-12 w-12 rounded-[18px] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#84cd4c]/70 active:scale-95"
              >
                <img src={GUIDE_ASSETS.right} alt="" className="h-full w-full" draggable={false} />
              </button>
            </nav>
          </article>
        </section>

        <footer className={`flex w-full shrink-0 flex-col items-center gap-3 ${source === 'pause' ? 'min-h-[203px]' : 'min-h-[96px]'}`}>
          <button
            ref={exitButtonRef}
            type="button"
            onClick={onExitGuide}
            className={guideButtonClass}
          >
            {copy.exitGuide}
          </button>

          {source === 'pause' && onBackToGame ? (
            <>
              <button
                type="button"
                onClick={onBackToGame}
                className={`${guideButtonClass} ${locale === 'ru' ? 'ui-button--compact-copy' : ''}`}
              >
                {copy.backToGame}
              </button>
              <p className="keyboard-help flex items-center justify-center gap-1 text-[12px] font-normal leading-4 text-white">
                <span>P</span>
                <span>{copy.resumeHelp}</span>
              </p>
            </>
          ) : null}
        </footer>
      </div>
    </div>
  );
}
