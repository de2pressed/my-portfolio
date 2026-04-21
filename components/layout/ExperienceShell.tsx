"use client";

import type { PropsWithChildren } from "react";

import { AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { AmbientBackground } from "@/components/background/AmbientBackground";
import { CookieConsent } from "@/components/loading/CookieConsent";
import { LoadingScreen } from "@/components/loading/LoadingScreen";
import { PageTransition } from "@/components/layout/PageTransition";
import { MusicPlayer } from "@/components/music/MusicPlayer";
import { YouTubeEngine } from "@/components/music/YouTubeEngine";
import { GlassCursor } from "@/components/ui/GlassCursor";
import { VersionBadge } from "@/components/ui/VersionBadge";
import { useCookie } from "@/context/CookieContext";
import { useMusic } from "@/context/MusicContext";

export function ExperienceShell({ children }: PropsWithChildren) {
  const pathname = usePathname();
  const { consent, hydrated, setConsent, storageAvailable } = useCookie();
  const { engineStatus } = useMusic();
  const [phase, setPhase] = useState<"loading" | "handoff" | "cookie" | "none">("loading");
  const [revealed, setRevealed] = useState(false);

  const musicReady = engineStatus === "ready" || engineStatus === "error";
  const isPublicRoute = pathname === "/";

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (!hydrated || !musicReady) {
        return;
      }

      if (isPublicRoute && consent === "unknown") {
        setPhase("handoff");
        window.setTimeout(() => setPhase("cookie"), 520);
        return;
      }

      setPhase("none");
      window.setTimeout(() => setRevealed(true), 140);
    }, 2250);

    return () => window.clearTimeout(timer);
  }, [consent, hydrated, isPublicRoute, musicReady]);

  useEffect(() => {
    if (phase !== "cookie") {
      return;
    }

    setRevealed(false);
  }, [phase]);

  function handleDecision(decision: "accepted" | "rejected") {
    setConsent(decision);
    setPhase("none");
    window.setTimeout(() => setRevealed(true), 160);
  }

  const showLoading = phase === "loading" || phase === "handoff";
  const showCookie = phase === "cookie";
  const hideContent = !revealed && (showLoading || showCookie || (isPublicRoute && consent === "unknown"));

  return (
    <div className="relative min-h-screen">
      <AmbientBackground />
      <YouTubeEngine />
      <GlassCursor />

      <div className={hideContent ? "pointer-events-none opacity-0 transition-opacity duration-700" : "transition-opacity duration-[1200ms] opacity-100"}>
        <PageTransition>{children}</PageTransition>
      </div>

      {revealed ? <MusicPlayer /> : null}
      {isPublicRoute && revealed ? <VersionBadge /> : null}

      <AnimatePresence mode="wait">
        {showLoading ? <LoadingScreen key="loading" musicReady={musicReady} phase={phase === "handoff" ? "handoff" : "loading"} /> : null}
        {showCookie ? (
          <CookieConsent
            key="cookie"
            onDecision={handleDecision}
            storageAvailable={storageAvailable}
          />
        ) : null}
      </AnimatePresence>
    </div>
  );
}
