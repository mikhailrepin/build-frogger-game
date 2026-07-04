import { describe, expect, it } from 'vitest';
import { BONUS_GUIDE_KINDS, getWrappedBonusIndex } from './bonusGuide';

describe('bonus guide pagination', () => {
  it('keeps all gameplay bonus kinds in the guide', () => {
    expect(BONUS_GUIDE_KINDS).toEqual([
      'shield',
      'slowTime',
      'currentAnchor',
      'superHop',
      'fly',
    ]);
  });

  it('wraps navigation in both directions', () => {
    expect(getWrappedBonusIndex(0, -1)).toBe(BONUS_GUIDE_KINDS.length - 1);
    expect(getWrappedBonusIndex(BONUS_GUIDE_KINDS.length - 1, 1)).toBe(0);
  });
});
