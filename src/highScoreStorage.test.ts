import { describe, expect, it } from 'vitest';
import { loadHighScore, saveHighScore, type StorageLike } from './highScoreStorage';

function createMemoryStorage(initial: Record<string, string> = {}): StorageLike {
  const state = new Map(Object.entries(initial));
  return {
    getItem: (key) => state.get(key) ?? null,
    setItem: (key, value) => {
      state.set(key, value);
    },
  };
}

describe('high score storage', () => {
  it('loads a numeric score and falls back to zero', () => {
    expect(loadHighScore(createMemoryStorage({ 'frogger.highScore': '42' }))).toBe(42);
    expect(loadHighScore(createMemoryStorage({ 'frogger.highScore': 'bad' }))).toBe(0);
    expect(loadHighScore(null)).toBe(0);
  });

  it('stores a sanitized integer score', () => {
    const storage = createMemoryStorage();
    saveHighScore(48.9, storage);

    expect(storage.getItem('frogger.highScore')).toBe('48');
  });
});
