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
  const { engineStatus, play } = useMusic();
  const [phase, setPhase] = useState<"loading" | "handoff" | "cookie" | "none">("loading");
  const [revealed, setRevealed] = useState(false);

  const musicReady = engineStatus === "ready" || engineStatus === "error";
  const isPublicRoute = pathname === "/";
  const showCookieHandoff = isPublicRoute && consent === "unknown";

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (!hydrated || !musicReady) {
        return;
      }

      if (showCookieHandoff) {
        setPhase("handoff");
        window.setTimeout(() => setPhase("cookie"), 520);
        return;
      }

      setPhase("none");
      window.setTimeout(() => setRevealed(true), 140);
    }, 2250);

    return () => window.clearTimeout(timer);
  }, [consent, hydrated, isPublicRoute, musicReady, showCookieHandoff]);

  // Hard safety timeout: guarantee the loading screen always dismisses,
  // even if the music engine and cookie context both fail to report readiness.
  useEffect(() => {
    if (phase === "none" || phase === "cookie") {
      return;
    }

    const hardTimeout = window.setTimeout(() => {
      if (phase === "loading" || phase === "handoff") {
        console.warn("Hard timeout reached — forcing site reveal.");
        setPhase("none");
        window.setTimeout(() => setRevealed(true), 140);
      }
    }, 12000);

    return () => window.clearTimeout(hardTimeout);
  }, [phase]);

  useEffect(() => {
    if (phase !== "cookie") {
      return;
    }

    setRevealed(false);
  }, [phase]);

  function handleDecision(decision: "accepted" | "rejected") {
    setConsent(decision);
    play();
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
      {revealed ? <VersionBadge /> : null}

      <AnimatePresence mode="wait">
        {showLoading ? (
          <LoadingScreen
            key="loading"
            handoffToCookie={showCookieHandoff}
            musicReady={musicReady}
            phase={phase === "handoff" ? "handoff" : "loading"}
          />
        ) : null}
        {showCookie ? (
          <CookieConsent
            key="cookie"
            revealFromHandoff={showCookieHandoff}
            onDecision={handleDecision}
            storageAvailable={storageAvailable}
          />
        ) : null}
      </AnimatePresence>
    </div>
  );
}
