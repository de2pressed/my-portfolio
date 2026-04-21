'use client';

import styles from './Header.module.css';
import useSiteContent from '../../hooks/useSiteContent';

export default function Header() {
  const { siteSettings } = useSiteContent();

  return (
    <header data-component="Header" className={styles.wrapper}>
      <a href="#top" className={styles.brand}>
        <span className={styles.dot} />
        {siteSettings?.name || 'Portfolio'}
      </a>

      <nav className={styles.nav} aria-label="Primary">
        <a href="#works">Works</a>
        <a href="#skills">Skills</a>
        <a href="#guestbook">Guestbook</a>
      </nav>
    </header>
  );
}
