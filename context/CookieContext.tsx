"use client";

import {
  createContext,
  type PropsWithChildren,
  useContext,
  useEffect,
  useState,
} from "react";

type ConsentState = "unknown" | "accepted" | "rejected";

type CookieContextValue = {
  consent: ConsentState;
  hydrated: boolean;
  storageAvailable: boolean;
  analyticsEnabled: boolean;
  setConsent: (decision: Exclude<ConsentState, "unknown">) => void;
};

const CookieContext = createContext<CookieContextValue | null>(null);
const CONSENT_KEY = "portfolio-cookie-consent";

function canUseStorage() {
  try {
    localStorage.setItem("__portfolio_storage__", "1");
    localStorage.removeItem("__portfolio_storage__");
    return true;
  } catch {
    return false;
  }
}

export function CookieProvider({ children }: PropsWithChildren) {
  const [consent, setConsentState] = useState<ConsentState>("unknown");
  const [hydrated, setHydrated] = useState(false);
  const [storageAvailable, setStorageAvailable] = useState(true);

  useEffect(() => {
    const canPersist = canUseStorage();
    setStorageAvailable(canPersist);

    if (canPersist) {
      const existing = localStorage.getItem(CONSENT_KEY) as ConsentState | null;
      setConsentState(existing ?? "unknown");
    } else {
      setConsentState("unknown");
    }

    setHydrated(true);
  }, []);

  function setConsent(decision: Exclude<ConsentState, "unknown">) {
    if (storageAvailable) {
      try {
        localStorage.setItem(CONSENT_KEY, decision);
      } catch {
        setStorageAvailable(false);
      }
    }

    setConsentState(decision);
  }

  return (
    <CookieContext.Provider
      value={{
        consent,
        hydrated,
        storageAvailable,
        analyticsEnabled: storageAvailable && consent === "accepted",
        setConsent,
      }}
    >
      {children}
    </CookieContext.Provider>
  );
}

export function useCookie() {
  const context = useContext(CookieContext);

  if (!context) {
    throw new Error("useCookie must be used inside CookieProvider");
  }

  return context;
}
