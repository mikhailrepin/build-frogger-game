import { describe, expect, it } from 'vitest';
import {
  clampCameraCenterToWorldBounds,
  clampGroundCameraCenterToScreenEdges,
  computeBoardScreenSpanZoom,
  computeGroundCameraOffsetForScreenY,
  computeOrthographicZoom,
  isMobileCameraViewport,
} from './viewMath';

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

  it('detects phone-sized portrait and landscape viewports', () => {
    expect(isMobileCameraViewport(390, 844)).toBe(true);
    expect(isMobileCameraViewport(844, 390)).toBe(true);
    expect(isMobileCameraViewport(768, 1024)).toBe(false);
    expect(isMobileCameraViewport(1280, 720)).toBe(false);
  });

  it('projects the board across the requested number of screen widths', () => {
    const zoom = computeBoardScreenSpanZoom(390, 13, 1.5, 55);

    expect(13 * zoom / 390).toBeCloseTo(1.5, 6);
    expect(computeBoardScreenSpanZoom(0, 13, 1.5, 55)).toBe(55);
  });

  it('converts a lower-third screen target into a ground camera offset', () => {
    const offset = computeGroundCameraOffsetForScreenY(844, 45, 2 / 3, 0.8);

    expect(offset).toBeCloseTo((844 / 6) / (45 * 0.8), 6);
    expect(computeGroundCameraOffsetForScreenY(844, 45, 0.5, 0.8)).toBe(0);
    expect(computeGroundCameraOffsetForScreenY(0, 45, 2 / 3, 0.8)).toBe(0);
  });

  it('clamps horizontal camera movement to the board edges', () => {
    const viewportSpan = 390 / 45;
    const left = clampCameraCenterToWorldBounds(-20, viewportSpan, -6.75, 6.75);
    const right = clampCameraCenterToWorldBounds(20, viewportSpan, -6.75, 6.75);

    expect(left - viewportSpan / 2).toBeCloseTo(-6.75, 6);
    expect(right + viewportSpan / 2).toBeCloseTo(6.75, 6);
    expect(clampCameraCenterToWorldBounds(4, 20, -6.75, 6.75)).toBe(0);
  });

  it('clamps vertical look-ahead to the visible board edges', () => {
    const viewportHeight = 844;
    const zoom = 45;
    const projection = 0.8;
    const worldMin = -7.75;
    const worldMax = 7.75;
    const topScreenY = 0.08;
    const bottomScreenY = 2 / 3;
    const upperCenter = clampGroundCameraCenterToScreenEdges(
      -20,
      viewportHeight,
      zoom,
      projection,
      worldMin,
      worldMax,
      topScreenY,
      bottomScreenY,
    );
    const lowerCenter = clampGroundCameraCenterToScreenEdges(
      20,
      viewportHeight,
      zoom,
      projection,
      worldMin,
      worldMax,
      topScreenY,
      bottomScreenY,
    );
    const topEdgePixel = viewportHeight / 2
      + projection * (worldMin - upperCenter) * zoom;
    const bottomEdgePixel = viewportHeight / 2
      + projection * (worldMax - lowerCenter) * zoom;

    expect(topEdgePixel).toBeCloseTo(viewportHeight * topScreenY, 6);
    expect(bottomEdgePixel).toBeCloseTo(viewportHeight * bottomScreenY, 6);
  });
});
