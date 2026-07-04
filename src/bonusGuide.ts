import type { BonusItem } from './gameCore';

export type BonusKind = BonusItem['kind'];

export const BONUS_GUIDE_KINDS: BonusKind[] = [
  'shield',
  'slowTime',
  'currentAnchor',
  'superHop',
  'fly',
];

export function getWrappedBonusIndex(currentIndex: number, delta: -1 | 1) {
  return (currentIndex + delta + BONUS_GUIDE_KINDS.length) % BONUS_GUIDE_KINDS.length;
}
