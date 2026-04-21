'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

const SiteContentContext = createContext(null);

async function requestJson(pathname, options = {}) {
  const response = await fetch(pathname, {
    headers: {
      Accept: 'application/json',
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(options.headers || {}),
    },
    credentials: 'include',
    ...options,
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.message || `Request failed for ${pathname}`);
  }

  return payload;
}

export function SiteContentProvider({ children, initialContent = null }) {
  const [content, setContent] = useState({
    experience: initialContent?.experience || [],
    reviews: initialContent?.reviews || [],
    siteSettings: initialContent?.siteSettings || null,
    skills: initialContent?.skills || [],
    tracks: initialContent?.tracks || [],
    works: initialContent?.works || [],
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const refreshAll = useCallback(async () => {
    setIsLoading(true);

    try {
      const [contentPayload, reviewsPayload] = await Promise.all([
        requestJson('/api/content'),
        requestJson('/api/reviews'),
      ]);
      setContent({
        ...contentPayload,
        reviews: reviewsPayload.reviews || [],
      });
      setError('');
      return {
        ...contentPayload,
        reviews: reviewsPayload.reviews || [],
      };
    } catch (nextError) {
      setError(nextError.message);
      throw nextError;
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!initialContent) {
      void refreshAll();
    }
  }, [initialContent, refreshAll]);

  const createAdminRequest = useCallback(
    async (pathname, options = {}) =>
      requestJson(pathname, {
        ...options,
      }),
    [],
  );

  const value = useMemo(
    () => ({
      ...content,
      error,
      isLoading,
      refreshAll,
      async deleteExperience(id) {
        await createAdminRequest(`/api/experience/${id}`, {
          method: 'DELETE',
        });
        return refreshAll();
      },
      async deleteReview(id) {
        await createAdminRequest(`/api/reviews/${id}`, {
          method: 'DELETE',
        });
        return refreshAll();
      },
      async deleteSkill(id) {
        await createAdminRequest(`/api/skills/${id}`, {
          method: 'DELETE',
        });
        return refreshAll();
      },
      async deleteTrack(id) {
        await createAdminRequest(`/api/tracks/${id}`, {
          method: 'DELETE',
        });
        return refreshAll();
      },
      async deleteWork(id) {
        await createAdminRequest(`/api/works/${id}`, {
          method: 'DELETE',
        });
        return refreshAll();
      },
      findTrackById(id) {
        return content.tracks.find((track) => track.id === id) || null;
      },
      findWorkBySlug(slug) {
        return content.works.find((work) => work.slug === slug) || null;
      },
      async saveExperience(entry) {
        const method = entry.id ? 'PUT' : 'POST';
        const pathname = entry.id ? `/api/experience/${entry.id}` : '/api/experience';

        await createAdminRequest(pathname, {
          body: JSON.stringify(entry),
          method,
        });

        return refreshAll();
      },
      async saveReview(review) {
        const payload = await requestJson('/api/reviews', {
          body: JSON.stringify(review),
          method: 'POST',
        });

        await refreshAll();
        return payload;
      },
      async saveSiteSettings(settings) {
        const payload = await createAdminRequest('/api/content/site-settings', {
          body: JSON.stringify(settings),
          method: 'PUT',
        });

        setContent((current) => ({
          ...current,
          siteSettings: payload.siteSettings,
        }));

        return payload.siteSettings;
      },
      async saveSkill(skill) {
        const method = skill.id ? 'PUT' : 'POST';
        const pathname = skill.id ? `/api/skills/${skill.id}` : '/api/skills';

        await createAdminRequest(pathname, {
          body: JSON.stringify(skill),
          method,
        });

        return refreshAll();
      },
      async saveTrack(track) {
        const method = track.id ? 'PUT' : 'POST';
        const pathname = track.id ? `/api/tracks/${track.id}` : '/api/tracks';

        await createAdminRequest(pathname, {
          body: JSON.stringify(track),
          method,
        });

        return refreshAll();
      },
      async saveWork(work) {
        const method = work.id ? 'PUT' : 'POST';
        const pathname = work.id ? `/api/works/${work.id}` : '/api/works';

        await createAdminRequest(pathname, {
          body: JSON.stringify(work),
          method,
        });

        return refreshAll();
      },
    }),
    [content, createAdminRequest, error, isLoading, refreshAll],
  );

  return (
    <SiteContentContext.Provider value={value}>
      {children}
    </SiteContentContext.Provider>
  );
}

export function useSiteContent() {
  const context = useContext(SiteContentContext);

  if (!context) {
    throw new Error('useSiteContent must be used within SiteContentProvider.');
  }

  return context;
}

export default SiteContentProvider;
