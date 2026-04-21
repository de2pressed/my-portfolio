'use client';

import styles from './AdminRevealOverlay.module.css';

export default function AdminRevealOverlay({ active = false }) {
  if (!active) {
    return null;
  }

  return (
    <div
      data-component="AdminRevealOverlay"
      className={styles.wrapper}
      aria-hidden="true"
    >
      <div className={styles.paneGrid}>
        {Array.from({ length: 12 }).map((_, index) => (
          <span
            key={index}
            className={styles.pane}
            style={{ '--delay': `${index * 45}ms` }}
          />
        ))}
      </div>
      <div className={styles.flash} />
    </div>
  );
}
