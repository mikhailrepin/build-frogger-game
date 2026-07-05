import { useEffect, useState } from 'react';
import { RotateCw, Smartphone } from 'lucide-react';
import { UI_COPY, type Locale } from './localization';
import { shouldShowOrientationGate } from './orientationPolicy';

function readOrientationGateState() {
  if (typeof window === 'undefined') {
    return false;
  }

  const viewport = window.visualViewport;
  return shouldShowOrientationGate(
    viewport?.width ?? window.innerWidth,
    viewport?.height ?? window.innerHeight,
  );
}

export function useOrientationGate() {
  const [visible, setVisible] = useState(readOrientationGateState);

  useEffect(() => {
    const orientationQuery = window.matchMedia('(orientation: landscape)');
    const visualViewport = window.visualViewport;
    const syncOrientation = () => {
      const nextVisible = readOrientationGateState();
      setVisible((currentVisible) => (
        currentVisible === nextVisible ? currentVisible : nextVisible
      ));
    };

    syncOrientation();
    window.addEventListener('resize', syncOrientation);
    orientationQuery.addEventListener('change', syncOrientation);
    visualViewport?.addEventListener('resize', syncOrientation);

    return () => {
      window.removeEventListener('resize', syncOrientation);
      orientationQuery.removeEventListener('change', syncOrientation);
      visualViewport?.removeEventListener('resize', syncOrientation);
    };
  }, []);

  return visible;
}

interface OrientationGateProps {
  locale: Locale;
  visible: boolean;
}

export function OrientationGate({ locale, visible }: OrientationGateProps) {
  if (!visible) {
    return null;
  }

  return (
    <section
      className="orientation-gate ui-font"
      role="status"
      aria-live="polite"
      lang={locale}
    >
      <div className="orientation-gate__content">
        <div className="orientation-gate__visual" aria-hidden="true">
          <div className="orientation-gate__device">
            <Smartphone strokeWidth={1.8} />
          </div>
          <div className="orientation-gate__arrow">
            <RotateCw strokeWidth={1.8} />
          </div>
        </div>
        <p className="orientation-gate__message">
          {UI_COPY[locale].orientationGate.message}
        </p>
      </div>
    </section>
  );
}
