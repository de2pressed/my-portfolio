'use client';

import useRevealMotion from '../../hooks/useRevealMotion';
import useSiteContent from '../../hooks/useSiteContent';
import styles from './Hero.module.css';

export default function Hero() {
  const ref = useRevealMotion({ start: 'top 90%' });
  const { siteSettings, works } = useSiteContent();
  const featuredWork = works.find((work) => work.featured);

  return (
    <section data-component="Hero" ref={ref} className={styles.wrapper} id="top">
      <div className={styles.left}>
        <p className="section-label">Aura</p>
        <h1>{siteSettings?.name}</h1>
        <p className={styles.tagline}>{siteSettings?.tagline}</p>
        <p className={styles.bio}>{siteSettings?.bio}</p>
        <a href="#works" className={styles.cta}>
          {siteSettings?.heroCta || 'Enter the atmosphere'}
        </a>
      </div>

      <div className={styles.right}>
        <div className={styles.orbit} />
        <div className={styles.glassName}>{siteSettings?.name}</div>
        {featuredWork ? (
          <div className={styles.featured}>
            <span>Featured now</span>
            <strong>{featuredWork.title}</strong>
          </div>
        ) : null}
      </div>
    </section>
  );
}
