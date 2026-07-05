import { describe, expect, it } from 'vitest';
import { shouldShowOrientationGate } from './orientationPolicy';

describe('orientation gate', () => {
  it('shows for phone-sized landscape viewports', () => {
    expect(shouldShowOrientationGate(844, 390)).toBe(true);
    expect(shouldShowOrientationGate(1024, 767)).toBe(true);
  });

  it('stays hidden for phone-sized portrait viewports', () => {
    expect(shouldShowOrientationGate(390, 844)).toBe(false);
  });

  it('stays hidden for desktop and tablet landscape viewports', () => {
    expect(shouldShowOrientationGate(1280, 720)).toBe(false);
    expect(shouldShowOrientationGate(1024, 768)).toBe(false);
  });

  it('rejects square, invalid, and non-positive viewports', () => {
    expect(shouldShowOrientationGate(500, 500)).toBe(false);
    expect(shouldShowOrientationGate(0, 390)).toBe(false);
    expect(shouldShowOrientationGate(844, 0)).toBe(false);
    expect(shouldShowOrientationGate(Number.NaN, 390)).toBe(false);
    expect(shouldShowOrientationGate(844, Number.POSITIVE_INFINITY)).toBe(false);
  });
});
