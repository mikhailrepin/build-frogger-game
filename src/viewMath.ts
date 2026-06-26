export interface OrthographicFitOptions {
  padding?: number;
  safety?: number;
  minZoom?: number;
  maxZoom?: number;
}

const MOBILE_CAMERA_MAX_LONG_EDGE = 1024;
const MOBILE_CAMERA_MAX_SHORT_EDGE = 767;

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export function isMobileCameraViewport(viewportWidth: number, viewportHeight: number) {
  if (viewportWidth <= 0 || viewportHeight <= 0) return false;
  const shortEdge = Math.min(viewportWidth, viewportHeight);
  const longEdge = Math.max(viewportWidth, viewportHeight);
  return shortEdge <= MOBILE_CAMERA_MAX_SHORT_EDGE && longEdge <= MOBILE_CAMERA_MAX_LONG_EDGE;
}

export function computeBoardScreenSpanZoom(
  viewportWidth: number,
  worldWidth: number,
  boardScreenWidths: number,
  fallbackZoom: number,
) {
  if (viewportWidth <= 0 || worldWidth <= 0 || boardScreenWidths <= 0) {
    return fallbackZoom;
  }

  return viewportWidth * boardScreenWidths / worldWidth;
}

export function computeGroundCameraOffsetForScreenY(
  viewportHeight: number,
  zoom: number,
  targetScreenY: number,
  groundVerticalProjection: number,
) {
  if (
    viewportHeight <= 0
    || zoom <= 0
    || groundVerticalProjection <= 0
    || !Number.isFinite(targetScreenY)
  ) {
    return 0;
  }

  const clampedScreenY = clamp(targetScreenY, 0, 1);
  const pixelOffsetFromCenter = (clampedScreenY - 0.5) * viewportHeight;
  return pixelOffsetFromCenter / (zoom * groundVerticalProjection);
}

export function clampCameraCenterToWorldBounds(
  desiredCenter: number,
  viewportSpan: number,
  worldMin: number,
  worldMax: number,
) {
  if (
    viewportSpan <= 0
    || worldMax <= worldMin
    || !Number.isFinite(desiredCenter)
  ) {
    return desiredCenter;
  }

  const worldCenter = (worldMin + worldMax) / 2;
  if (viewportSpan >= worldMax - worldMin) return worldCenter;

  return clamp(
    desiredCenter,
    worldMin + viewportSpan / 2,
    worldMax - viewportSpan / 2,
  );
}

export function clampGroundCameraCenterToScreenEdges(
  desiredCenter: number,
  viewportHeight: number,
  zoom: number,
  groundVerticalProjection: number,
  worldMin: number,
  worldMax: number,
  topScreenY: number,
  bottomScreenY: number,
) {
  if (
    viewportHeight <= 0
    || zoom <= 0
    || groundVerticalProjection <= 0
    || worldMax <= worldMin
    || !Number.isFinite(desiredCenter)
  ) {
    return desiredCenter;
  }

  const topPixel = clamp(topScreenY, 0, 1) * viewportHeight;
  const bottomPixel = clamp(bottomScreenY, 0, 1) * viewportHeight;
  if (topPixel > bottomPixel) return desiredCenter;

  const groundScale = zoom * groundVerticalProjection;
  const minCenter = worldMin + (viewportHeight / 2 - topPixel) / groundScale;
  const maxCenter = worldMax - (bottomPixel - viewportHeight / 2) / groundScale;

  if (minCenter > maxCenter) return (minCenter + maxCenter) / 2;
  return clamp(desiredCenter, minCenter, maxCenter);
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
