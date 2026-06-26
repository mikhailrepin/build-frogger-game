import { describe, expect, it } from 'vitest';
import { computeOrthographicZoom } from './viewMath';

describe('view math', () => {
  it('fits an orthographic camera to the smaller available dimension', () => {
    const zoom = computeOrthographicZoom(390, 844, 13, 25, { safety: 0.9 });

    expect(zoom).toBeCloseTo((390 / 13) * 0.9, 4);
  });

  it('clamps invalid inputs to the minimum zoom', () => {
    expect(computeOrthographicZoom(0, 844, 13, 25, { minZoom: 12 })).toBe(12);
    expect(computeOrthographicZoom(390, 0, 13, 25, { minZoom: 12 })).toBe(12);
    expect(computeOrthographicZoom(390, 844, 13, 25, { minZoom: 12, maxZoom: 20 })).toBeGreaterThanOrEqual(12);
  });
});
