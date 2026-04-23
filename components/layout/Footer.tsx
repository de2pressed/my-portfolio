"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Pause, Play, SkipBack, SkipForward } from "lucide-react";
import { useEffect, useRef } from "react";

import { useMusic } from "@/context/MusicContext";
import { usePanelTilt } from "@/hooks/usePanelTilt";
import { cn } from "@/lib/utils";

type FooterProps = {
  name: string;
  email: string;
  note: string;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function smoothstep(value: number) {
  const clamped = clamp(value, 0, 1);
  return clamped * clamped * (3 - 2 * clamped);
}

export function Footer({ name, email, note }: FooterProps) {
  const ref = useRef<HTMLElement | null>(null);
  const frameRef = useRef<number | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const {
    title,
    thumbnail,
    isPlaying,
    engineStatus,
    errorMessage,
    footerTakeover,
    layoutMode,
    setFooterTakeover,
    togglePlayback,
    playNext,
    playPrevious,
  } = useMusic();

  useEffect(() => {
    const updateTakeover = () => {
      frameRef.current = null;

      if (!ref.current) {
        return;
      }

      const rect = ref.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const start = viewportHeight * 0.96;
      const end = viewportHeight * 0.34;
      const progress = clamp((start - rect.top) / Math.max(1, start - end), 0, 1);
      setFooterTakeover(progress);
    };

    const scheduleUpdate = () => {
      if (frameRef.current !== null) {
        return;
      }

      frameRef.current = window.requestAnimationFrame(updateTakeover);
    };

    scheduleUpdate();
    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate);

    return () => {
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);

      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
      }

      setFooterTakeover(0);
    };
  }, [setFooterTakeover]);

  const footerCardReveal = smoothstep((footerTakeover - 0.34) / 0.46);
  const footerCardReady = footerCardReveal > 0.7 || layoutMode === "footer";
  const footerPaneLift = 0.88 + footerCardReveal * 0.12;
  const footerGlowOpacity = 0.1 + footerCardReveal * 0.06;
  const footerSheenOpacity = 0.06 + footerCardReveal * 0.06;

  usePanelTilt(panelRef, {
    enabled: footerCardReady,
    maxRotation: 7,
    perspective: 1600,
    lerpFactor: 0.15,
    easeOutDuration: 180,
  });

  const renderArtwork = () =>
    thumbnail ? (
      <Image
        alt={title}
        fill
        className="object-cover object-[50%_42%] scale-[1.06]"
        sizes="160px"
        src={thumbnail}
        unoptimized
      />
    ) : (
      <div className="h-full w-full bg-[radial-gradient(circle_at_top,rgba(var(--accent-rgb),0.36),rgba(var(--lavender-rgb),0.14))]" />
    );

  return (
    <footer className="section-wrap pb-14 pt-4" ref={ref}>
      <section className="glass-panel relative overflow-hidden rounded-[36px] px-6 py-8 md:px-10 md:py-10" id="footer">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(var(--teal-rgb),0.18),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(var(--accent-rgb),0.18),transparent_28%)]" />

        <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.96fr)] lg:items-center">
          <div className="space-y-5">
            <h2 className="max-w-[12ch] text-3xl font-semibold leading-[0.94] text-ink md:text-5xl">
              Scroll low enough and the soundtrack takes the room.
            </h2>
            <p className="max-w-xl text-sm leading-7 text-ink/72 md:text-base">{note}</p>
            <div className="flex flex-wrap items-center gap-3 text-sm text-ink/68">
              <span>{name}</span>
              <span className="h-1 w-1 rounded-full bg-ink/40" />
              <a className="underline decoration-white/40 underline-offset-4" href={`mailto:${email}`}>
                {email}
              </a>
            </div>
          </div>

          <motion.aside
            className={cn(
              "relative",
              footerCardReady ? "pointer-events-auto" : "pointer-events-none",
            )}
            initial={false}
            animate={{
              opacity: footerCardReveal,
              x: 24 * (1 - footerCardReveal),
              y: 36 * (1 - footerCardReveal),
              scale: 0.9 + footerCardReveal * 0.1,
              rotate: 1.6 - footerCardReveal * 1.6,
              rotateX: 8 - footerCardReveal * 8,
              rotateY: -5 + footerCardReveal * 5,
            }}
            style={{ transformStyle: "preserve-3d" }}
            transition={{ duration: 0.56, ease: [0.22, 1, 0.36, 1] }}
          >
            <div
              ref={panelRef}
              className="relative isolate overflow-hidden rounded-[30px] bg-[rgba(10,10,14,0.58)] p-4 shadow-[0_24px_60px_rgba(5,5,8,0.28)] backdrop-blur-[16px]"
            >
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 rounded-[inherit] shadow-[inset_0_1px_0_rgba(255,255,255,0.12),inset_0_-26px_44px_rgba(0,0,0,0.24)]"
                style={{
                  background: `linear-gradient(145deg, rgba(255,255,255,${footerSheenOpacity.toFixed(3)}) 0%, rgba(255,255,255,0.032) 18%, rgba(255,255,255,0.01) 40%, rgba(6,6,9,0.12) 100%)`,
                }}
              />
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-[1px] rounded-[inherit]"
                style={{
                  transform: `translateZ(${(12 * footerPaneLift).toFixed(2)}px)`,
                  background: `radial-gradient(circle at top left, rgba(255,255,255,${footerSheenOpacity.toFixed(3)}), transparent 34%), radial-gradient(circle at 76% 20%, rgba(var(--accent-rgb),${footerGlowOpacity.toFixed(3)}), transparent 36%), linear-gradient(180deg, rgba(255,255,255,0.022), rgba(255,255,255,0.008) 24%, rgba(8,8,12,0.04) 100%)`,
                }}
              />
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -inset-x-10 -top-10 h-24"
                style={{
                  opacity: 0.12 + footerCardReveal * 0.08,
                  background: "linear-gradient(180deg, rgba(255,255,255,0.12), rgba(255,255,255,0.024) 42%, transparent 100%)",
                  filter: "blur(14px)",
                }}
              />

              <div className="relative z-[1] grid gap-4 sm:grid-cols-[10rem_minmax(0,1fr)] sm:items-center">
                <div className="relative h-40 overflow-hidden rounded-[24px] bg-[rgba(10,10,14,0.34)] sm:h-44">
                  {renderArtwork()}
                </div>

                <div className="min-w-0 space-y-4">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.28em] text-ink/56">Immersive music zone</p>
                    <p className="mt-1 line-clamp-2 text-2xl font-semibold leading-tight text-ink">
                      {engineStatus === "error" ? errorMessage : title}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      className="glass-button-muted h-10 w-10 rounded-full p-0"
                      onClick={playPrevious}
                      type="button"
                    >
                      <SkipBack className="h-4 w-4" />
                    </button>
                    <button
                      className="glass-button h-10 w-10 rounded-full p-0"
                      onClick={togglePlayback}
                      type="button"
                    >
                      {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    </button>
                    <button className="glass-button-muted h-10 w-10 rounded-full p-0" onClick={playNext} type="button">
                      <SkipForward className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.aside>
        </div>
      </section>
    </footer>
  );
}
