"use client";

import Image from "next/image";
import {
  AnimatePresence,
  motion,
} from "framer-motion";
import {
  Maximize2,
  Minimize2,
  Pause,
  Play,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { useMusic } from "@/context/MusicContext";
import { useMusicFrequency } from "@/hooks/useMusicFrequency";
import { GlassHover, MINIMAL_CONFIG } from "@/components/ui/GlassHover";
import { cn } from "@/lib/utils";

const MINIMIZED_KEY = "portfolio-music-player-minimized";
const WAVEFORM_BAR_COUNT = 48;
const WAVEFORM_CENTER = 54;
const WAVEFORM_RING_RADIUS = 40;
const WAVEFORM_PHASES = Array.from({ length: WAVEFORM_BAR_COUNT }, (_, index) => (index / WAVEFORM_BAR_COUNT) * Math.PI * 2);

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function formatPlaybackTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) {
    return "0:00";
  }

  const totalSeconds = Math.floor(seconds);
  const minutes = Math.floor(totalSeconds / 60);
  const remainingSeconds = totalSeconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

function readStoredPreference() {
  try {
    const stored = window.localStorage.getItem(MINIMIZED_KEY);
    if (stored === null) {
      return null;
    }

    return stored === "1";
  } catch {
    return null;
  }
}

export function MusicPlayer() {
  const {
    title,
    thumbnail,
    isPlaying,
    isMuted,
    volume,
    currentTime,
    duration,
    footerTakeover,
    engineStatus,
    errorMessage,
    togglePlayback,
    playNext,
    playPrevious,
    setVolume,
    seekTo,
    mute,
    unmute,
  } = useMusic();
  const { energy: musicEnergy } = useMusicFrequency();
  const [isMinimized, setIsMinimized] = useState(true);
  const [hydrated, setHydrated] = useState(false);
  const musicEnergyRef = useRef(musicEnergy);
  const waveformBarRefs = useRef<(SVGLineElement | null)[]>([]);

  useEffect(() => {
    const storedPreference = readStoredPreference();
    if (storedPreference !== null) {
      setIsMinimized(storedPreference);
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    try {
      window.localStorage.setItem(MINIMIZED_KEY, isMinimized ? "1" : "0");
    } catch {
      // Ignore storage failures and keep the current in-memory preference.
    }
  }, [hydrated, isMinimized]);

  useEffect(() => {
    musicEnergyRef.current = musicEnergy;
  }, [musicEnergy]);

  useEffect(() => {
    if (!isMinimized) {
      return;
    }

    let frame = 0;
    let displayEnergy = musicEnergyRef.current;

    const tick = (time: number) => {
      const targetEnergy = clamp(musicEnergyRef.current, 0, 1);
      displayEnergy += (targetEnergy - displayEnergy) * (targetEnergy > displayEnergy ? 0.16 : 0.08);

      for (let index = 0; index < WAVEFORM_BAR_COUNT; index += 1) {
        const bar = waveformBarRefs.current[index];
        if (!bar) {
          continue;
        }

        const phase = WAVEFORM_PHASES[index] ?? 0;
        const shimmer = (Math.sin(time * 0.0026 + phase * 1.9) + 1) / 2;
        const ripple = (Math.cos(time * 0.0018 - phase * 0.75) + 1) / 2;
        const height = 2 + displayEnergy * 12 + shimmer * (displayEnergy * 8 + 2) + ripple * displayEnergy * 4;
        const alpha = clamp(0.18 + displayEnergy * 0.5 + shimmer * 0.16 + ripple * 0.08, 0.12, 0.96);

        bar.setAttribute("y1", String(WAVEFORM_CENTER - WAVEFORM_RING_RADIUS));
        bar.setAttribute("y2", String(WAVEFORM_CENTER - WAVEFORM_RING_RADIUS - height));
        bar.setAttribute("stroke", `rgba(var(--accent-rgb), ${alpha.toFixed(3)})`);
      }

      frame = window.requestAnimationFrame(tick);
    };

    frame = window.requestAnimationFrame(tick);

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [isMinimized]);

  const progress = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;
  const takeoverFade = clamp((footerTakeover - 0.52) / 0.26, 0, 1);
  const takeoverDepth = footerTakeover * footerTakeover;
  const takeoverBlur = takeoverFade * 8;
  const takeoverFilter = `blur(${takeoverBlur}px)`;

  const renderArtwork = () =>
    thumbnail ? (
      <Image
        alt={title}
        fill
        className="object-cover object-[50%_42%] scale-[1.06]"
        sizes="96px"
        src={thumbnail}
        unoptimized
      />
    ) : (
      <div className="h-full w-full bg-[radial-gradient(circle_at_top,rgba(var(--accent-rgb),0.34),rgba(var(--lavender-rgb),0.12))]" />
    );

  return (
    <>
      {footerTakeover <= 0.72 && (
        <GlassHover 
          className={cn(
            "fixed bottom-4 right-4 z-40 md:bottom-6 md:right-6",
            isMinimized
              ? "h-[11rem] w-[11rem] sm:h-[11.5rem] sm:w-[11.5rem]"
              : "w-[calc(100vw-2rem)] max-w-[28rem] sm:max-w-[30rem]",
          )} 
          config={MINIMAL_CONFIG}
          disabled={footerTakeover > 0.52 && footerTakeover < 0.72}
        >
      <motion.aside
        className={cn(
          "overflow-hidden bg-[rgba(10,10,14,0.42)] shadow-[0_18px_60px_rgba(5,5,8,0.3),0_0_0_1px_rgba(var(--glass-border-rgb),0.1)] backdrop-blur-2xl",
          isMinimized
            ? "h-full w-full rounded-[28px] p-3"
            : "h-full w-full rounded-[30px] p-3 sm:p-4 z-50",
        )}
        layout
        animate={{
          opacity: 1 - takeoverFade,
          x: footerTakeover * (isMinimized ? -22 : -34),
          y: takeoverDepth * (isMinimized ? 360 : 480),
          scale: 1 + takeoverDepth * 0.24,
          rotate: takeoverDepth * -3,
        }}
        style={{ filter: takeoverFilter }}
        transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
      >
      <button
        aria-label={isMinimized ? "Expand player" : "Minimize player"}
        className="glass-button-muted absolute right-3 top-3 z-10 h-9 w-9 rounded-full p-0"
        onClick={() => setIsMinimized((current) => !current)}
        type="button"
      >
        {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
      </button>

      <AnimatePresence mode="wait" initial={false}>
        {isMinimized ? (
          <motion.div
            key="minimized"
            className="flex h-full flex-col items-center justify-start gap-2 pt-7"
            initial={{ opacity: 0, scale: 0.94, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 8 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            <motion.div
              className="animate-spin relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-[rgba(10,10,14,0.42)] shadow-[0_18px_50px_rgba(5,5,8,0.24)] sm:h-[5.5rem] sm:w-[5.5rem]"
              style={{
                animationDuration: "14s",
                animationPlayState: isPlaying ? "running" : "paused",
              }}
            >
              <div className="absolute inset-[-14px] pointer-events-none">
                <svg aria-hidden="true" className="h-full w-full overflow-visible" viewBox="0 0 108 108">
                  {Array.from({ length: WAVEFORM_BAR_COUNT }, (_, index) => {
                    const angle = (index / WAVEFORM_BAR_COUNT) * 360;

                    return (
                      <line
                        key={angle}
                        ref={(node) => {
                          waveformBarRefs.current[index] = node;
                        }}
                        stroke="rgba(var(--accent-rgb), 0.28)"
                        strokeLinecap="round"
                        strokeWidth="1.8"
                        transform={`rotate(${angle} ${WAVEFORM_CENTER} ${WAVEFORM_CENTER})`}
                        x1={WAVEFORM_CENTER}
                        x2={WAVEFORM_CENTER}
                        y1={WAVEFORM_CENTER - WAVEFORM_RING_RADIUS}
                        y2={WAVEFORM_CENTER - WAVEFORM_RING_RADIUS - 2}
                      />
                    );
                  })}
                </svg>
              </div>
              <div className="absolute inset-2 overflow-hidden rounded-full">{renderArtwork()}</div>
              <div className="absolute inset-[2px] rounded-full shadow-[inset_0_1px_0_rgba(255,255,255,0.16)]" />
              <div className="absolute inset-[38%] rounded-full bg-[rgba(255,255,255,0.12)] shadow-[inset_0_1px_0_rgba(255,255,255,0.24)]" />
            </motion.div>

            <div className="flex items-center gap-1.5">
              <button className="glass-button-muted h-8 w-8 rounded-full p-0" onClick={playPrevious} type="button">
                <SkipBack className="h-3.5 w-3.5" />
              </button>
              <button className="glass-button h-9 w-9 rounded-full p-0" onClick={togglePlayback} type="button">
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </button>
              <button className="glass-button-muted h-8 w-8 rounded-full p-0" onClick={playNext} type="button">
                <SkipForward className="h-3.5 w-3.5" />
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="expanded"
            className="pr-10"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="flex items-center gap-3">
              <div className="relative h-16 w-16 overflow-hidden rounded-[22px] bg-[rgba(10,10,14,0.34)] sm:h-20 sm:w-20">
                {renderArtwork()}
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-[10px] uppercase tracking-[0.28em] text-ink/50">Powered by YouTube</p>
                <p className="mt-1 line-clamp-2 text-sm font-semibold text-ink">
                  {engineStatus === "error" ? errorMessage : title}
                </p>
                <div className="mt-3 flex items-center gap-2">
                  <button className="glass-button-muted h-9 w-9 rounded-full p-0 sm:h-10 sm:w-10" onClick={playPrevious} type="button">
                    <SkipBack className="h-4 w-4" />
                  </button>
                  <button className="glass-button h-9 w-9 rounded-full p-0 sm:h-10 sm:w-10" onClick={togglePlayback} type="button">
                    {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  </button>
                  <button className="glass-button-muted h-9 w-9 rounded-full p-0 sm:h-10 sm:w-10" onClick={playNext} type="button">
                    <SkipForward className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-3 space-y-2">
              <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.22em] text-ink/48">
                <span>{formatPlaybackTime(currentTime)}</span>
                <span>{duration > 0 ? formatPlaybackTime(duration) : "0:00"}</span>
              </div>
              <input
                aria-label="Track progress"
                className="h-2 w-full cursor-pointer appearance-none rounded-full accent-[rgb(var(--accent-rgb))]"
                disabled={duration <= 0}
                max={Math.max(duration, 1)}
                min={0}
                onChange={(event) => seekTo(Number(event.target.value))}
                style={{
                  background: `linear-gradient(90deg, rgb(var(--accent-rgb)) 0%, rgb(var(--accent-rgb)) ${progress}%, rgba(255,255,255,0.22) ${progress}%, rgba(255,255,255,0.22) 100%)`,
                }}
                step={0.1}
                type="range"
                value={duration > 0 ? Math.min(currentTime, duration) : 0}
              />
            </div>

            <div className="mt-3 flex items-center gap-3">
              <button
                className="glass-button-muted h-9 w-9 rounded-full p-0 sm:h-10 sm:w-10"
                onClick={() => {
                  if (isMuted || volume === 0) {
                    unmute();
                    if (volume === 0) {
                      setVolume(50);
                    }
                    return;
                  }
                  mute();
                }}
                type="button"
              >
                {isMuted || volume === 0 ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </button>
              <input
                aria-label="Volume"
                className="h-2 w-full cursor-pointer appearance-none rounded-full accent-[rgb(var(--accent-rgb))]"
                max={100}
                min={0}
                onChange={(event) => setVolume(Number(event.target.value))}
                style={{
                  background: `linear-gradient(90deg, rgb(var(--accent-rgb)) 0%, rgb(var(--accent-rgb)) ${volume}%, rgba(255,255,255,0.22) ${volume}%, rgba(255,255,255,0.22) 100%)`,
                }}
                type="range"
                value={volume}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      </motion.aside>
    </GlassHover>
      )}
    </>
  );
}
