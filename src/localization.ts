import type { Direction } from './gameConstants';
import type { BonusItem } from './gameCore';

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
  bonusGuide: {
    title: string;
    exitGuide: string;
    backToGame: string;
    resumeHelp: string;
    previous: string;
    next: string;
    pageLabel: string;
    bonuses: Record<BonusItem['kind'], {
      name: string;
      description: string;
    }>;
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
    bonusGuide: {
      title: 'Bonus Guide',
      exitGuide: 'Exit Guide',
      backToGame: 'Back to Game',
      resumeHelp: 'Resume',
      previous: 'Previous bonus',
      next: 'Next bonus',
      pageLabel: 'Bonus',
      bonuses: {
        shield: {
          name: 'Shield',
          description: 'Awards 100 points and protects the frog from one crash, splash, or out-of-bounds fall for up to 6 seconds. The shield is consumed when it blocks danger. Picking another bonus replaces it.',
        },
        slowTime: {
          name: 'Slow Time',
          description: 'Awards 100 points and slows vehicles, river platforms, and other moving hazards to 65% of their normal speed for 5 seconds. Picking another bonus replaces the effect.',
        },
        currentAnchor: {
          name: 'Current Anchor',
          description: 'Awards 100 points and locks the frog’s horizontal position while it rides logs or turtles for 6 seconds, preventing the river current from carrying it sideways. Picking another bonus replaces the effect.',
        },
        superHop: {
          name: 'Super Hop',
          description: 'Awards 100 points and doubles every jump to two cells for 6 seconds. It crosses dangerous lanes faster, but the longer landing still has to be safe. Picking another bonus replaces the effect.',
        },
        fly: {
          name: 'Fly Combo',
          description: 'Awards 150 points and doubles the next 3 scoring events for up to 8 seconds. The combo ends when all charges are used, the timer expires, or another bonus is collected.',
        },
      },
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
    bonusGuide: {
      title: 'Гид по бонусам',
      exitGuide: 'Закрыть гид',
      backToGame: 'Вернуться в игру',
      resumeHelp: 'Продолжить',
      previous: 'Предыдущий бонус',
      next: 'Следующий бонус',
      pageLabel: 'Бонус',
      bonuses: {
        shield: {
          name: 'Щит',
          description: 'Даёт 100 очков и в течение 6 секунд защищает лягушку от одного столкновения, падения в воду или выхода за границы уровня. После спасения щит исчезает. Новый бонус заменяет его.',
        },
        slowTime: {
          name: 'Замедление времени',
          description: 'Даёт 100 очков и на 5 секунд снижает скорость машин, речных платформ и других движущихся опасностей до 65% от обычной. Новый бонус заменяет эффект.',
        },
        currentAnchor: {
          name: 'Якорь течения',
          description: 'Даёт 100 очков и на 6 секунд фиксирует лягушку по горизонтали на брёвнах и черепахах, не позволяя течению унести её в сторону. Новый бонус заменяет эффект.',
        },
        superHop: {
          name: 'Суперпрыжок',
          description: 'Даёт 100 очков и на 6 секунд увеличивает каждый прыжок до двух клеток. Он помогает быстрее пересекать опасные полосы, но место приземления всё равно должно быть безопасным. Новый бонус заменяет эффект.',
        },
        fly: {
          name: 'Комбо с мухой',
          description: 'Даёт 150 очков и удваивает следующие 3 начисления очков в течение 8 секунд. Комбо заканчивается после расходования зарядов, истечения времени или получения другого бонуса.',
        },
      },
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
