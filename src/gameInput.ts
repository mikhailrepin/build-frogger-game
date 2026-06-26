import type { Direction } from './gameConstants';

export type GameKeyboardAction =
  | { type: 'move'; direction: Direction }
  | { type: 'pause' }
  | { type: 'restart' }
  | { type: 'step' };

const MOVE_DIRECTION_BY_CODE: Readonly<Record<string, Direction>> = {
  ArrowUp: 'up',
  KeyW: 'up',
  ArrowDown: 'down',
  KeyS: 'down',
  ArrowLeft: 'left',
  KeyA: 'left',
  ArrowRight: 'right',
  KeyD: 'right',
};

export function getKeyboardGameAction(code: string): GameKeyboardAction | null {
  const direction = MOVE_DIRECTION_BY_CODE[code];
  if (direction) return { type: 'move', direction };

  switch (code) {
    case 'KeyP':
      return { type: 'pause' };
    case 'Space':
    case 'Enter':
    case 'NumpadEnter':
      return { type: 'restart' };
    case 'Period':
    case 'KeyN':
      return { type: 'step' };
    default:
      return null;
  }
}
