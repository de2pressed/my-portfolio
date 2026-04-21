'use client';

import styles from './Footer.module.css';
import useSiteContent from '../../hooks/useSiteContent';

export default function Footer() {
  const { siteSettings } = useSiteContent();

  return (
    <footer data-component="Footer" className={styles.wrapper} id="site-footer">
      <div className={styles.content}>
        <p className="section-label">Immersive footer</p>
        <h2>The player settles into the footer.</h2>
        <p>
          Built to stay alive and editable as the work evolves. Last updated{' '}
          {siteSettings?.lastUpdated || siteSettings?.last_updated}.
        </p>
      </div>
      <div className={styles.aside}>
        <div className={styles.playerDock} id="player-dock" />
        <div className={styles.links}>
          <a href={siteSettings?.github} target="_blank" rel="noreferrer">
            GitHub
          </a>
          <a href={`mailto:${siteSettings?.email}`}>Email</a>
        </div>
      </div>
    </footer>
  );
}
