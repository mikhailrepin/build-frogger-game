import { existsSync, statSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const assetSize = (name: string) => statSync(`public/main-screen/${name}`).size;

describe('main screen assets', () => {
  it('ships responsive compressed backgrounds within the loading budget', () => {
    expect(assetSize('background-768.avif')).toBeLessThan(80_000);
    expect(assetSize('background-1448.avif')).toBeLessThan(180_000);
    expect(assetSize('background-768.jpg')).toBeLessThan(180_000);
    expect(assetSize('background-1448.jpg')).toBeLessThan(420_000);
  });

  it('ships compressed frog artwork with a transparent compatibility fallback', () => {
    expect(assetSize('frog.avif')).toBeLessThan(80_000);
    expect(assetSize('frog.png')).toBeLessThan(520_000);
    expect(existsSync('public/main-screen/background.png')).toBe(false);
    expect(existsSync('public/main-screen/frog.jpg')).toBe(false);
  });
});
