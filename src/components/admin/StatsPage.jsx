'use client';

import { useEffect, useState } from 'react';
import styles from './StatsPage.module.css';
import { useAdmin } from '../../context/AdminContext';

export default function StatsPage() {
  const { isAuthenticated } = useAdmin();
  const [stats, setStats] = useState(null);
  const [status, setStatus] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    let isMounted = true;

    void fetch('/api/stats', {
      credentials: 'include',
    })
      .then(async (response) => {
        const payload = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(payload.message || 'Unable to load stats.');
        }

        return payload;
      })
      .then((payload) => {
        if (isMounted) {
          setStats(payload.stats);
          setStatus('');
        }
      })
      .catch((error) => {
        if (isMounted) {
          setStatus(error.message);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated]);

  return (
    <section data-component="StatsPage" className={styles.wrapper}>
      <div className={styles.grid}>
        <article>
          <span>Visits</span>
          <strong>{stats?.visits ?? 0}</strong>
        </article>
        <article>
          <span>Average stay</span>
          <strong>{stats?.averageStaySeconds ?? 0}s</strong>
        </article>
        <article>
          <span>Average views</span>
          <strong>{stats?.averageViewsPerSession ?? 0}</strong>
        </article>
        <article>
          <span>Reviews</span>
          <strong>{stats?.reviewCount ?? 0}</strong>
        </article>
      </div>

      <div className={styles.columns}>
        <div className={styles.panel}>
          <p className="section-label">Top routes</p>
          {(stats?.topRoutes || []).map((route) => (
            <div key={route.path} className={styles.row}>
              <span>{route.path}</span>
              <strong>{route.views}</strong>
            </div>
          ))}
        </div>

        <div className={styles.panel}>
          <p className="section-label">Work views</p>
          {(stats?.workViews || []).map((item) => (
            <div key={item.path} className={styles.row}>
              <span>{item.path}</span>
              <strong>{item.views}</strong>
            </div>
          ))}
        </div>

        <div className={styles.panel}>
          <p className="section-label">Event counts</p>
          {(stats?.eventCounts || []).map((item) => (
            <div key={item.event_type} className={styles.row}>
              <span>{item.event_type}</span>
              <strong>{item.count}</strong>
            </div>
          ))}
        </div>
      </div>
      {status ? <p className={styles.status}>{status}</p> : null}
    </section>
  );
}
