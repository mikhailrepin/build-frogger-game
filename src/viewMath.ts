export interface OrthographicFitOptions {
  padding?: number;
  safety?: number;
  minZoom?: number;
  maxZoom?: number;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export function computeOrthographicZoom(
  viewportWidth: number,
  viewportHeight: number,
  worldWidth: number,
  worldHeight: number,
  options: OrthographicFitOptions = {},
) {
  const {
    padding = 0,
    safety = 1,
    minZoom = 1,
    maxZoom = Number.POSITIVE_INFINITY,
  } = options;

  if (viewportWidth <= 0 || viewportHeight <= 0 || worldWidth <= 0 || worldHeight <= 0) {
    return minZoom;
  }

  const fitWidth = worldWidth + padding * 2;
  const fitHeight = worldHeight + padding * 2;
  const widthZoom = viewportWidth / fitWidth;
  const heightZoom = viewportHeight / fitHeight;
  const fitZoom = Math.min(widthZoom, heightZoom) * safety;

  return clamp(fitZoom, minZoom, maxZoom);
}
