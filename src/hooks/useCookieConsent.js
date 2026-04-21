'use client';

import { useCookieContext } from '../context/CookieContext';

export default function useCookieConsent() {
  return useCookieContext();
}
