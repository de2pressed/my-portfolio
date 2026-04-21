'use client';

import { useState } from 'react';
import useRevealMotion from '../../hooks/useRevealMotion';
import useSiteContent from '../../hooks/useSiteContent';
import styles from './Reviews.module.css';

export default function Reviews() {
  const ref = useRevealMotion();
  const { reviews, saveReview } = useSiteContent();
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [name, setName] = useState('');
  const [status, setStatus] = useState('');
  const [hasUnlockedMessage, setHasUnlockedMessage] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus('Sending your note into the guestbook...');

    try {
      await saveReview({ email, message, name });
      setEmail('');
      setMessage('');
      setName('');
      setHasUnlockedMessage(false);
      setStatus('Review submitted.');
    } catch (error) {
      setStatus(error.message);
    }
  };

  return (
    <section data-component="Reviews" ref={ref} className={styles.wrapper} id="guestbook">
      <div className={styles.card}>
        <div className={styles.copy}>
          <p className="section-label">Guestbook</p>
          <h2>Leave a trace on the glass.</h2>
          <p>
            Email is required before the message appears so the guestbook stays
            human and deliberate.
          </p>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Your name (optional)"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
          <div className={styles.emailGate}>
            <input
              type="email"
              placeholder="Email required"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
            <button type="button" onClick={() => setHasUnlockedMessage(Boolean(email))}>
              Unlock ink
            </button>
          </div>
          {hasUnlockedMessage ? (
            <textarea
              rows="5"
              placeholder="Write your review here"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
            />
          ) : null}
          <button type="submit" className={styles.submit}>
            Submit review
          </button>
          {status ? <p className={styles.status}>{status}</p> : null}
        </form>

        <div className={styles.notes}>
          {(reviews || []).slice(0, 4).map((review) => (
            <article key={review.id} className={styles.note}>
              <strong>{review.name}</strong>
              <p>{review.message}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
