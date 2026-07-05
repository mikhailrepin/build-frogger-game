import { isMobileCameraViewport } from './viewMath';

export function shouldShowOrientationGate(viewportWidth: number, viewportHeight: number) {
  if (!Number.isFinite(viewportWidth) || !Number.isFinite(viewportHeight)) {
    return false;
  }

  return viewportWidth > viewportHeight
    && isMobileCameraViewport(viewportWidth, viewportHeight);
}
