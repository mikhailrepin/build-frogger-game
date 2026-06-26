const HIGH_SCORE_KEY = 'frogger.highScore';

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export function getBrowserStorage(): StorageLike | null {
  if (typeof window === 'undefined' || !window.localStorage) return null;
  return window.localStorage;
}

export function loadHighScore(storage: StorageLike | null = getBrowserStorage()) {
  if (!storage) return 0;
  const raw = storage.getItem(HIGH_SCORE_KEY);
  const parsed = raw ? Number(raw) : 0;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

export function saveHighScore(score: number, storage: StorageLike | null = getBrowserStorage()) {
  if (!storage) return;
  const next = Number.isFinite(score) && score > 0 ? Math.floor(score) : 0;
  storage.setItem(HIGH_SCORE_KEY, String(next));
}

export { HIGH_SCORE_KEY };
