'use client';

import styles from './AmbientBackground.module.css';
import useMusic from '../../hooks/useMusic';

export default function AmbientBackground() {
  const { ambientColors, bassEnergy, energyLevel, highEnergy } = useMusic();
  const [primary, secondary, accent] = ambientColors;

  return (
    <div
      className={styles.wrapper}
      aria-hidden="true"
      style={{
        '--bg-accent': accent,
        '--bg-bass': `${0.2 + bassEnergy * 0.6}`,
        '--bg-energy': `${0.9 + energyLevel * 0.45}`,
        '--bg-high': `${0.2 + highEnergy * 0.7}`,
        '--bg-primary': primary,
        '--bg-secondary': secondary,
      }}
    >
      <div className={styles.mesh} />
      <div className={styles.orbOne} />
      <div className={styles.orbTwo} />
      <div className={styles.grain} />
    </div>
  );
}
