import type { Direction } from './gameConstants';

export type Locale = 'en' | 'ru';

interface UiCopy {
  mainScreen: {
    start: string;
    bonusGuide: string;
    sound: string;
    soundOn: string;
    soundOff: string;
    language: string;
    switchLanguage: string;
    gameTitle: string;
  };
  game: {
    level: string;
    pause: string;
    resume: string;
    move: Record<Direction, string>;
    keyboardHelp: string;
  };
  pause: {
    title: string;
    score: string;
    volume: string;
    decreaseVolume: string;
    increaseVolume: string;
    sound: string;
    soundOn: string;
    soundOff: string;
    bonusGuide: string;
    mainScreen: string;
    backToGame: string;
    resumeHelp: string;
  };
  levelComplete: {
    level: string;
    complete: string;
    score: string;
    bonus: string;
  };
  gameOver: {
    title: string;
    score: string;
    best: string;
    playAgain: string;
  };
  confirmExit: {
    title: string;
    description: string;
    resume: string;
    exitToMenu: string;
    exitHelp: string;
  };
}

export const UI_COPY = {
  en: {
    mainScreen: {
      start: 'Start Game',
      bonusGuide: 'Bonus Guide',
      sound: 'Sound',
      soundOn: 'On',
      soundOff: 'Off',
      language: 'Language',
      switchLanguage: 'Switch language to Russian',
      gameTitle: 'Froggy Urban Splash!',
    },
    game: {
      level: 'L',
      pause: 'Pause',
      resume: 'Resume',
      move: {
        up: 'Move up',
        left: 'Move left',
        down: 'Move down',
        right: 'Move right',
      },
      keyboardHelp: 'Arrow Keys / WASD  •  P Pause',
    },
    pause: {
      title: 'Pause',
      score: 'Score',
      volume: 'Volume',
      decreaseVolume: 'Decrease volume',
      increaseVolume: 'Increase volume',
      sound: 'Sound',
      soundOn: 'On',
      soundOff: 'Off',
      bonusGuide: 'Bonus Guide',
      mainScreen: 'Main Screen',
      backToGame: 'Back to Game',
      resumeHelp: 'Resume',
    },
    levelComplete: {
      level: 'Level',
      complete: 'Complete',
      score: 'Score',
      bonus: 'Bonus',
    },
    gameOver: {
      title: 'Game Over',
      score: 'Score',
      best: 'Best',
      playAgain: 'Play Again',
    },
    confirmExit: {
      title: 'Exit to main screen?',
      description: 'If you exit, you will have to start the current level progress all over again.',
      resume: 'Resume',
      exitToMenu: 'Exit to Menu',
      exitHelp: 'Esc - exit',
    },
  },
  ru: {
    mainScreen: {
      start: 'Начать игру',
      bonusGuide: 'Бонусы',
      sound: 'Звук',
      soundOn: 'Вкл',
      soundOff: 'Выкл',
      language: 'Язык',
      switchLanguage: 'Переключить язык на английский',
      gameTitle: 'Froggy Urban Splash!',
    },
    game: {
      level: 'Ур.',
      pause: 'Пауза',
      resume: 'Продолжить',
      move: {
        up: 'Двигаться вверх',
        left: 'Двигаться влево',
        down: 'Двигаться вниз',
        right: 'Двигаться вправо',
      },
      keyboardHelp: 'Стрелки / WASD  •  P Пауза',
    },
    pause: {
      title: 'Пауза',
      score: 'Счёт',
      volume: 'Громкость',
      decreaseVolume: 'Уменьшить громкость',
      increaseVolume: 'Увеличить громкость',
      sound: 'Звук',
      soundOn: 'Вкл',
      soundOff: 'Выкл',
      bonusGuide: 'Бонусы',
      mainScreen: 'Главный экран',
      backToGame: 'Продолжить',
      resumeHelp: 'Продолжить',
    },
    levelComplete: {
      level: 'Уровень',
      complete: 'Пройден',
      score: 'Счёт',
      bonus: 'Бонус',
    },
    gameOver: {
      title: 'Конец игры',
      score: 'Счёт',
      best: 'Рекорд',
      playAgain: 'Ещё раз',
    },
    confirmExit: {
      title: 'Выйти на главный экран?',
      description: 'При выходе прогресс текущего уровня будет потерян, и его придётся начать заново.',
      resume: 'Продолжить',
      exitToMenu: 'Выйти в меню',
      exitHelp: 'Esc — выйти',
    },
  },
} satisfies Record<Locale, UiCopy>;

export function getNumberLocale(locale: Locale) {
  return locale === 'ru' ? 'ru-RU' : 'en-US';
}
