'use client';

import Link from 'next/link';
import useRevealMotion from '../../hooks/useRevealMotion';
import useSiteContent from '../../hooks/useSiteContent';
import styles from './Gallery.module.css';

export default function Gallery() {
  const ref = useRevealMotion();
  const { works } = useSiteContent();

  return (
    <section data-component="Gallery" ref={ref} className={styles.wrapper} id="works">
      <div className={styles.header}>
        <div>
          <p className="section-label">Works archive</p>
          <h2>Projects and art living in the same glass field.</h2>
        </div>
      </div>

      <div className={styles.grid}>
        {works
          .filter((work) => work.published)
          .map((work) => (
            <Link key={work.id} className={styles.card} href={`/works/${work.slug}`}>
              <img src={work.cover_url || work.coverUrl} alt={work.title} className={styles.image} />
              <div className={styles.cardBody}>
                <span className={styles.type}>{work.type}</span>
                <h3>{work.title}</h3>
                <p>{work.summary}</p>
                <div className={styles.tags}>
                  {work.tags.slice(0, 3).map((tag) => (
                    <span key={tag}>{tag}</span>
                  ))}
                </div>
              </div>
            </Link>
          ))}
      </div>
    </section>
  );
}
