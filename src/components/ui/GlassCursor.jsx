'use client';

import { useEffect, useState } from 'react';
import styles from './GlassCursor.module.css';

/**
 * @param {{
 *   size?: number
 * }} props
 */
export default function GlassCursor({ size = 26 }) {
  const [isEnabled, setIsEnabled] = useState(false);
  const [position, setPosition] = useState({ x: -100, y: -100 });

  useEffect(() => {
    const mediaQuery = window.matchMedia('(pointer: coarse)');
    const syncPointerMode = () => setIsEnabled(!mediaQuery.matches);

    syncPointerMode();

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', syncPointerMode);
      return () => mediaQuery.removeEventListener('change', syncPointerMode);
    }

    mediaQuery.addListener(syncPointerMode);
    return () => mediaQuery.removeListener(syncPointerMode);
  }, []);

  useEffect(() => {
    if (!isEnabled) {
      document.body.classList.remove('cursor-hidden');
      return undefined;
    }

    document.body.classList.add('cursor-hidden');

    const handlePointerMove = (event) => {
      setPosition({
        x: event.clientX,
        y: event.clientY,
      });
    };

    const handlePointerLeave = () => {
      setPosition({ x: -100, y: -100 });
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerleave', handlePointerLeave);

    return () => {
      document.body.classList.remove('cursor-hidden');
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerleave', handlePointerLeave);
    };
  }, [isEnabled]);

  if (!isEnabled) {
    return null;
  }

  return (
    <div
      data-component="GlassCursor"
      className={styles.wrapper}
      style={{
        height: size * 1.35,
        transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
        width: size,
      }}
    >
      <div className={styles.cursor}>
        <span className={styles.edge} />
      </div>
    </div>
  );
}
