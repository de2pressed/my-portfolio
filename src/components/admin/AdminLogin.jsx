'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './AdminLogin.module.css';
import { useAdmin } from '../../context/AdminContext';

export default function AdminLogin() {
  const router = useRouter();
  const { login } = useAdmin();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const nextPath = '/admin';

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/admin/login', {
        body: JSON.stringify({ password }),
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        method: 'POST',
      });

      const payload = await response.json();

      if (!response.ok || !payload.token) {
        throw new Error(payload.message || 'Access denied.');
      }

      login();
      router.replace(nextPath);
    } catch (nextError) {
      setError(nextError.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section data-component="AdminLogin" className={styles.wrapper}>
      <div className={styles.panes} aria-hidden="true" />
      <form className={styles.form} onSubmit={handleSubmit}>
        <p className="section-label">Obsidian dimension</p>
        <h1>Private control surface</h1>
        <p>
          The public shell folds away here. Only the approved Supabase account
          unlocks the dashboard.
        </p>
        <input
          type="password"
          placeholder="Admin password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
        <button type="submit">{isSubmitting ? 'Unlocking...' : 'Enter admin panel'}</button>
        {error ? <p className={styles.error}>{error}</p> : null}
      </form>
    </section>
  );
}
