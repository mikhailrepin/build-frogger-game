import { useEffect, useRef, useState } from 'react';

type Locale = 'en' | 'ru';

const MAIN_SCREEN_ASSETS = {
  background: '/main-screen/background.png',
  frog: '/main-screen/frog.png',
  logo: '/main-screen/text.png',
  flags: {
    en: '/main-screen/usa-flag.png',
    ru: '/main-screen/russia-flag.png',
  } satisfies Record<Locale, string>,
};

const COPY = {
  en: {
    start: 'Start Game',
    bonusGuide: 'Bonus Guide',
    sound: 'Sound',
    soundOn: 'On',
    soundOff: 'Off',
    language: 'Language',
    switchLanguage: 'Switch language to Russian',
    gameTitle: 'Froggy Urban Splash!',
  },
  ru: {
    start: 'Начать игру',
    bonusGuide: 'Бонусы',
    sound: 'Звук',
    soundOn: 'Вкл',
    soundOff: 'Выкл',
    language: 'Язык',
    switchLanguage: 'Переключить язык на английский',
    gameTitle: 'Froggy Urban Splash!',
  },
} satisfies Record<Locale, Record<string, string>>;

interface MainScreenProps {
  muted: boolean;
  transitioning: boolean;
  version: string;
  onStart: () => void;
  onToggleMuted: () => void;
}

export function MainScreen({
  muted,
  transitioning,
  version,
  onStart,
  onToggleMuted,
}: MainScreenProps) {
  const [locale, setLocale] = useState<Locale>('en');
  const screenRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const copy = COPY[locale];

  useEffect(() => {
    const screen = screenRef.current;
    if (!screen || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    let targetX = 0;
    let targetY = 0;

    const renderParallax = () => {
      animationFrameRef.current = null;
      screen.style.setProperty('--start-bg-x', `${targetX * -4}px`);
      screen.style.setProperty('--start-bg-y', `${targetY * -3}px`);
      screen.style.setProperty('--start-logo-x', `${targetX * 7}px`);
      screen.style.setProperty('--start-logo-y', `${targetY * 5}px`);
      screen.style.setProperty('--start-frog-x', `${targetX * 11}px`);
      screen.style.setProperty('--start-frog-y', `${targetY * 8}px`);
    };

    const scheduleParallax = () => {
      if (animationFrameRef.current === null) {
        animationFrameRef.current = window.requestAnimationFrame(renderParallax);
      }
    };

    const handlePointerMove = (event: PointerEvent) => {
      targetX = Math.max(-1, Math.min(1, event.clientX / window.innerWidth * 2 - 1));
      targetY = Math.max(-1, Math.min(1, event.clientY / window.innerHeight * 2 - 1));
      scheduleParallax();
    };

    const resetParallax = () => {
      targetX = 0;
      targetY = 0;
      scheduleParallax();
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    document.documentElement.addEventListener('mouseleave', resetParallax);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      document.documentElement.removeEventListener('mouseleave', resetParallax);
      if (animationFrameRef.current !== null) {
        window.cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  const toggleLocale = () => {
    setLocale((current) => (current === 'en' ? 'ru' : 'en'));
  };

  return (
    <div
      ref={screenRef}
      className={`start-screen ui-font ${transitioning ? 'start-screen--transitioning' : ''}`}
      lang={locale}
    >
      <div className="start-screen__background" aria-hidden="true">
        <img
          src={MAIN_SCREEN_ASSETS.background}
          alt=""
          draggable={false}
          fetchPriority="high"
        />
      </div>

      <div className="start-screen__logo">
        <img
          src={MAIN_SCREEN_ASSETS.logo}
          alt={copy.gameTitle}
          draggable={false}
          fetchPriority="high"
        />
      </div>

      <div className="start-screen__frog" aria-hidden="true">
        <img
          src={MAIN_SCREEN_ASSETS.frog}
          alt=""
          draggable={false}
          fetchPriority="high"
        />
      </div>

      <div className="start-screen__menu">
        <div className="start-screen__actions">
          <button
            type="button"
            onClick={onStart}
            disabled={transitioning}
            className="start-screen__button"
          >
            {copy.start}
          </button>

          <button
            type="button"
            disabled
            className="start-screen__button"
          >
            {copy.bonusGuide}
          </button>

          <button
            type="button"
            aria-pressed={muted}
            onClick={onToggleMuted}
            className="start-screen__button"
          >
            <span>
              {copy.sound}{' '}
              <span className={muted ? 'start-screen__state--off' : 'start-screen__state--on'}>
                {muted ? copy.soundOff : copy.soundOn}
              </span>
            </span>
          </button>

          <button
            type="button"
            aria-label={copy.switchLanguage}
            onClick={toggleLocale}
            className="start-screen__button"
          >
            <span>{copy.language}</span>
            <img
              src={MAIN_SCREEN_ASSETS.flags[locale]}
              alt=""
              className="start-screen__flag"
              draggable={false}
            />
          </button>
        </div>

        <footer className="start-screen__footer">
          <span>v {version}</span>
          <span>©Mikhail Repin 2026</span>
        </footer>
      </div>

      <div className="start-screen__fade" aria-hidden="true" />
    </div>
  );
}
