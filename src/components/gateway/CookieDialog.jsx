'use client';

import styles from './CookieDialog.module.css';

export default function CookieDialog({ onAccept, onReject }) {
  return (
    <div data-component="CookieDialog" className={styles.wrapper}>
      <div className={styles.panel}>
        <div className={styles.shards} aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <p className="section-label">Cookie gate</p>
        <h2>Cookies here only exist to improve the atmosphere.</h2>
        <p>
          Accepting allows anonymous data collection for visits, route depth,
          and session time. Rejecting still lets the site run, but analytics stay off.
        </p>
        <div className={styles.actions}>
          <button type="button" onClick={onAccept}>
            Accept cookies
          </button>
          <button type="button" onClick={onReject}>
            Reject cookies
          </button>
        </div>
      </div>
    </div>
  );
}
