import { describe, expect, it } from 'vitest';
import { getKeyboardGameAction } from './gameInput';

describe('keyboard game input', () => {
  it.each([
    ['KeyW', 'up'],
    ['KeyS', 'down'],
    ['KeyA', 'left'],
    ['KeyD', 'right'],
    ['ArrowUp', 'up'],
    ['ArrowDown', 'down'],
    ['ArrowLeft', 'left'],
    ['ArrowRight', 'right'],
  ] as const)('maps physical code %s to move %s', (code, direction) => {
    expect(getKeyboardGameAction(code)).toEqual({ type: 'move', direction });
  });

  it('maps layout-independent pause, restart, and step controls', () => {
    expect(getKeyboardGameAction('KeyP')).toEqual({ type: 'pause' });
    expect(getKeyboardGameAction('Space')).toEqual({ type: 'restart' });
    expect(getKeyboardGameAction('Enter')).toEqual({ type: 'restart' });
    expect(getKeyboardGameAction('NumpadEnter')).toEqual({ type: 'restart' });
    expect(getKeyboardGameAction('Period')).toEqual({ type: 'step' });
    expect(getKeyboardGameAction('KeyN')).toEqual({ type: 'step' });
  });

  it('ignores displayed characters and unrelated physical keys', () => {
    expect(getKeyboardGameAction('ц')).toBeNull();
    expect(getKeyboardGameAction('Escape')).toBeNull();
  });
});
