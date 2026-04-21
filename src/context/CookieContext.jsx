'use client';

import { createContext, useContext, useMemo, useState } from 'react';
import { getCookie, setCookie } from '../utils/cookieHelpers';

const CookieContext = createContext(null);

const VISITED_COOKIE = 'pf_visited';
const CONSENT_COOKIE = 'pf_cookie_consent';
const SHATTER_COOKIE = 'pf_cookie_shatter_seen';

function getInitialCookieState() {
  const consent = getCookie(CONSENT_COOKIE);
  const hasSeenCookieTransition = getCookie(SHATTER_COOKIE) === 'true';
  const hasVisited =
    consent === 'accepted' ||
    consent === 'rejected' ||
    getCookie(VISITED_COOKIE) === 'true';

  return {
    cookieConsented: consent || 'pending',
    hasSeenCookieTransition,
    hasVisited,
    isInitialized: true,
  };
}

export function CookieProvider({ children }) {
  const [cookieState, setCookieState] = useState(getInitialCookieState);

  const value = useMemo(
    () => ({
      ...cookieState,
      requiresConsent: cookieState.cookieConsented === 'pending',
      markCookieTransitionSeen() {
        setCookie(SHATTER_COOKIE, 'true', 365);
        setCookieState((current) => ({
          ...current,
          hasSeenCookieTransition: true,
        }));
      },
      setConsent(value) {
        setCookie(VISITED_COOKIE, 'true', 365);
        setCookie(CONSENT_COOKIE, value, 365);

        setCookieState((current) => ({
          ...current,
          cookieConsented: value,
          hasVisited: true,
          isInitialized: true,
        }));
      },
    }),
    [cookieState],
  );

  return (
    <CookieContext.Provider value={value}>{children}</CookieContext.Provider>
  );
}

export function useCookieContext() {
  const context = useContext(CookieContext);

  if (!context) {
    throw new Error('useCookieContext must be used within CookieProvider.');
  }

  return context;
}

export default CookieProvider;
