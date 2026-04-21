'use client';

import { useEffect, useMemo, useState } from 'react';
import styles from './LoadingScreen.module.css';

function getLoadingCopy(mode, ready) {
  if (mode === 'cookie-transition') {
    return 'Preparing consent panel.';
  }

  if (mode === 'cookie') {
    return 'Loading the consent gate.';
  }

  if (ready) {
    return 'Loading music controls.';
  }

  return 'Loading music, ambient gradients, and route content.';
}

export default function LoadingScreen({
  detail = '',
  label = 'Loading gateway',
  mode = 'loading',
  onEnter,
  ready = false,
}) {
  const [progress, setProgress] = useState(14);

  useEffect(() => {
    if (ready) {
      setProgress(100);
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      setProgress((current) => (current >= 92 ? current : current + 6));
    }, 170);

    return () => window.clearInterval(intervalId);
  }, [ready]);

  const loadingCopy = useMemo(() => getLoadingCopy(mode, ready), [mode, ready]);

  return (
    <div
      data-component="LoadingScreen"
      className={`${styles.wrapper} ${mode === 'cookie-transition' ? styles.transition : ''}`.trim()}
    >
      <div className={styles.backdrop} aria-hidden="true">
        <span className={styles.orbA} />
        <span className={styles.orbB} />
        <span className={styles.grid} />
      </div>

      <div className={styles.overlay}>
        <p className="section-label">Gateway</p>
        <h2>{label}</h2>
        <p className={styles.detail}>{detail || loadingCopy}</p>
        <div className={styles.trackShell}>
          <div className={styles.trackFill} style={{ width: `${progress}%` }} />
        </div>
        <div className={styles.statusRow}>
          <span>{loadingCopy}</span>
          <span>{progress}%</span>
        </div>
        {ready ? (
          <button type="button" onClick={onEnter} className={styles.enter}>
            Enter with sound
          </button>
        ) : null}
      </div>
    </div>
  );
}
