import { BOARD_WIDTH, type GameObject, type LaneConfig } from './gameConstants';

export function advanceLaneItemsInPlace(
  items: GameObject[][],
  lanes: LaneConfig[],
  speedMultiplier: number,
) {
  for (let rowIndex = 0; rowIndex < items.length; rowIndex += 1) {
    const lane = lanes[rowIndex];
    if (!lane || lane.speed === 0) continue;

    const rowItems = items[rowIndex];
    if (!rowItems) continue;

    for (let itemIndex = 0; itemIndex < rowItems.length; itemIndex += 1) {
      const item = rowItems[itemIndex];
      if (!item) continue;

      let nextX = item.x + lane.speed * speedMultiplier;
      if (lane.speed > 0 && nextX > BOARD_WIDTH) {
        nextX = -item.width;
      } else if (lane.speed < 0 && nextX + item.width < 0) {
        nextX = BOARD_WIDTH;
      }
      item.x = nextX;
    }
  }

  return items;
}
