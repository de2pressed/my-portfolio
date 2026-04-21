'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
} from 'react';
import { usePathname } from 'next/navigation';
import useCookieConsent from '../hooks/useCookieConsent';

const AnalyticsContext = createContext(null);
const STORAGE_KEY = 'portfolio_analytics_session';

function readSession() {
  if (typeof window === 'undefined') {
    return null;
  }

  const stored = window.sessionStorage.getItem(STORAGE_KEY);

  if (!stored) {
    return null;
  }

  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

function writeSession(value) {
  window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(value));
}

async function post(pathname, payload) {
  try {
    await fetch(pathname, {
      body: JSON.stringify(payload),
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      keepalive: true,
      method: 'POST',
    });
  } catch {
    // Analytics should never break the UI.
  }
}

export function AnalyticsProvider({ children }) {
  const pathname = usePathname();
  const { cookieConsented } = useCookieConsent();
  const routeStartedAtRef = useRef(Date.now());
  const sessionRef = useRef(readSession());

  const ensureSession = useCallback(() => {
    if (cookieConsented !== 'accepted') {
      return null;
    }

    if (!sessionRef.current) {
      sessionRef.current = {
        pageViews: 0,
        routes: [],
        sessionId: crypto.randomUUID(),
        startedAt: Date.now(),
      };
      writeSession(sessionRef.current);
    }

    return sessionRef.current;
  }, [cookieConsented]);

  const syncSession = useCallback(
    async (action = 'heartbeat') => {
      const session = ensureSession();

      if (!session) {
        return;
      }

      const totalDuration = Date.now() - session.startedAt;

      await post('/api/stats/session', {
        action,
        consentState: cookieConsented,
        durationMs: totalDuration,
        pageViews: session.pageViews,
        currentPath: pathname,
        routes: session.routes,
        sessionId: session.sessionId,
      });
    },
    [cookieConsented, ensureSession, pathname],
  );

  useEffect(() => {
    if (cookieConsented !== 'accepted') {
      return undefined;
    }

    const session = ensureSession();

    if (!session) {
      return undefined;
    }

    const previousDuration = Date.now() - routeStartedAtRef.current;
    routeStartedAtRef.current = Date.now();

    session.pageViews += 1;
    session.routes = [...new Set([...session.routes, pathname])];
    writeSession(session);

    void syncSession('heartbeat');

    if (previousDuration > 0) {
      void post('/api/stats/event', {
        consentState: cookieConsented,
        durationMs: previousDuration,
        eventType: 'route_view',
        currentPath: pathname,
        payload: {
          routeCount: session.routes.length,
        },
        sessionId: session.sessionId,
      });
    }

    const intervalId = window.setInterval(() => {
      void syncSession('heartbeat');
    }, 15000);

    const handlePageHide = () => {
      const current = sessionRef.current;

      if (!current) {
        return;
      }

      const durationMs = Date.now() - current.startedAt;
      void post('/api/stats/session', {
        action: 'end',
        consentState: cookieConsented,
        durationMs,
        pageViews: current.pageViews,
        currentPath: pathname,
        routes: current.routes,
        sessionId: current.sessionId,
      });
    };

    window.addEventListener('pagehide', handlePageHide);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('pagehide', handlePageHide);
    };
  }, [cookieConsented, ensureSession, pathname, syncSession]);

  const trackEvent = useCallback(
    async (eventType, payload = {}, pathOverride) => {
      const session = ensureSession();

      if (!session) {
        return;
      }

      await post('/api/stats/event', {
        consentState: cookieConsented,
        eventType,
        currentPath: pathOverride || pathname,
        payload,
        sessionId: session.sessionId,
      });
    },
    [cookieConsented, ensureSession, pathname],
  );

  const value = useMemo(
    () => ({
      trackEvent,
    }),
    [trackEvent],
  );

  return (
    <AnalyticsContext.Provider value={value}>
      {children}
    </AnalyticsContext.Provider>
  );
}

export function useAnalytics() {
  const context = useContext(AnalyticsContext);

  if (!context) {
    throw new Error('useAnalytics must be used within AnalyticsProvider.');
  }

  return context;
}

export default AnalyticsProvider;
