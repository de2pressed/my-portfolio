'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import useRevealMotion from '../../hooks/useRevealMotion';
import useAnalytics from '../../hooks/useAnalytics';
import styles from './WorkDetail.module.css';

export default function WorkDetailPage({ work }) {
  const ref = useRevealMotion();
  const { trackEvent } = useAnalytics();

  useEffect(() => {
    if (!work) {
      return;
    }

    void trackEvent(
      'work_view',
      { slug: work.slug, type: work.type },
      `/works/${work.slug}`,
    );
  }, [trackEvent, work]);

  if (!work) {
    return (
      <main className={styles.wrapper}>
        <section className={styles.card}>
          <p className="section-label">Missing work</p>
          <h1>This piece is not in the archive.</h1>
          <Link href="/" className={styles.back}>
            Return to the main scroll
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main ref={ref} className={styles.wrapper}>
      <section className={styles.card}>
        <p className="section-label">{work.type}</p>
        <Link href="/" className={styles.back}>
          Back to portfolio
        </Link>
        <h1>{work.title}</h1>
        <p className={styles.summary}>{work.summary}</p>
        <div className={styles.tags}>
          {(work.tags || []).map((tag) => (
            <span key={tag}>{tag}</span>
          ))}
        </div>
        <img src={work.coverUrl || work.cover_url} alt={work.title} className={styles.cover} />
        <div className={styles.body}>{work.body}</div>
        <div className={styles.gallery}>
          {(work.galleryUrls || work.gallery_urls || []).map((image) => (
            <img key={image} src={image} alt={work.title} />
          ))}
        </div>
        <div className={styles.links}>
          {work.externalUrl || work.external_url ? (
            <a href={work.externalUrl || work.external_url} target="_blank" rel="noreferrer">
              Visit live link
            </a>
          ) : null}
          {work.repoUrl || work.repo_url ? (
            <a href={work.repoUrl || work.repo_url} target="_blank" rel="noreferrer">
              Open repository
            </a>
          ) : null}
        </div>
      </section>
    </main>
  );
}
