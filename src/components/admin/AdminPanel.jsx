'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './AdminPanel.module.css';
import ContentEditor from './ContentEditor';
import StatsPage from './StatsPage';
import { useAdmin } from '../../context/AdminContext';

export default function AdminPanel() {
  const { logout } = useAdmin();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('content');

  return (
    <section data-component="AdminPanel" className={styles.wrapper}>
      <div className={styles.header}>
        <div>
          <p className="section-label">Admin panel</p>
          <h1>Editable portfolio control room</h1>
        </div>
        <div className={styles.actions}>
          <button type="button" onClick={() => setActiveTab('content')}>
            Content
          </button>
          <button type="button" onClick={() => setActiveTab('stats')}>
            Stats
          </button>
          <button
            type="button"
            onClick={async () => {
              await logout();
              router.replace('/admin-login');
            }}
          >
            Logout
          </button>
        </div>
      </div>

      {activeTab === 'content' ? <ContentEditor /> : <StatsPage />}
    </section>
  );
}
