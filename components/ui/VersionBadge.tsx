"use client";

import { useEffect, useState } from "react";

import { DEFAULT_SITE_VERSION } from "@/lib/seed-data";

export function VersionBadge() {
  const [version, setVersion] = useState(DEFAULT_SITE_VERSION);

  useEffect(() => {
    let cancelled = false;

    async function loadVersion() {
      try {
        const response = await fetch("/api/content?resource=settings&key=site_version", {
          cache: "no-store",
        });
        const payload = (await response.json()) as { value?: string };
        if (!cancelled && payload.value) {
          setVersion(payload.value);
        }
      } catch (error) {
        console.warn("Using the fallback site version because settings lookup failed.", error);
      }
    }

    loadVersion();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="pointer-events-none fixed bottom-4 left-4 z-40 rounded-full bg-[rgba(10,10,14,0.5)] px-3 py-1.5 text-xs uppercase tracking-[0.28em] text-ink/78 shadow-glass backdrop-blur-xl">
      {version}
    </div>
  );
}
