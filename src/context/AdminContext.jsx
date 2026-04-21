'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

const AdminContext = createContext(null);

export function AdminProvider({ children }) {
  const [sessionToken, setSessionToken] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isValidating, setIsValidating] = useState(false);

  const clearSession = useCallback(() => {
    setSessionToken('');
    setIsAuthenticated(false);
  }, []);

  const login = useCallback(() => {
    setSessionToken('authenticated');
    setIsAuthenticated(true);
  }, []);

  const logout = useCallback(async () => {
    clearSession();

    try {
      await fetch('/api/admin/logout', {
        credentials: 'include',
        method: 'POST',
      });
    } catch {
      // Silent by design for the protected admin flow.
    }
  }, [clearSession]);

  const validateSession = useCallback(async () => {
    setIsValidating(true);

    try {
      const response = await fetch('/api/auth/session', {
        credentials: 'include',
      });

      if (!response.ok) {
        clearSession();
        return false;
      }

      const payload = await response.json().catch(() => ({}));

      if (!payload?.authenticated) {
        clearSession();
        return false;
      }

      setSessionToken(payload.user?.id || 'authenticated');
      setIsAuthenticated(true);
      return true;
    } catch {
      clearSession();
      return false;
    } finally {
      setIsValidating(false);
    }
  }, [clearSession]);

  useEffect(() => {
    void validateSession();
  }, [validateSession]);

  const value = useMemo(
    () => ({
      isAuthenticated,
      isValidating,
      login,
      logout,
      sessionToken,
      validateSession,
    }),
    [isAuthenticated, isValidating, login, logout, sessionToken, validateSession],
  );

  return (
    <AdminContext.Provider value={value}>{children}</AdminContext.Provider>
  );
}

export function useAdmin() {
  const context = useContext(AdminContext);

  if (!context) {
    throw new Error('useAdmin must be used within AdminProvider.');
  }

  return context;
}

export default AdminProvider;
