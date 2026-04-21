"use client";

import Image from "next/image";
import { Pause, Play, SkipBack, SkipForward, Volume2, VolumeX } from "lucide-react";
import { motion } from "framer-motion";

import { useMusic } from "@/context/MusicContext";
import { cn } from "@/lib/utils";

function formatPlaybackTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) {
    return "0:00";
  }

  const totalSeconds = Math.floor(seconds);
  const minutes = Math.floor(totalSeconds / 60);
  const remainingSeconds = totalSeconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
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

  const progress = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;

  return (
    <motion.aside
      className={cn(
        "fixed bottom-4 right-4 z-40 w-[calc(100vw-2rem)] max-w-sm overflow-hidden rounded-[28px] border border-white/30 bg-white/16 p-3 shadow-[0_18px_60px_rgba(53,37,21,0.16)] backdrop-blur-2xl md:bottom-6 md:right-6",
        footerTakeover > 0.84 && "pointer-events-none",
      )}
      animate={{
        opacity: 1 - Math.min(footerTakeover * 1.25, 1),
        x: footerTakeover * -34,
        y: footerTakeover * 88,
        scale: 1 + footerTakeover * 0.08,
        rotate: footerTakeover * -1.2,
      }}
      transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="flex items-center gap-3">
        <div className="relative h-20 w-20 overflow-hidden rounded-[22px] bg-white/20">
          {thumbnail ? (
            <Image
              src={thumbnail}
              alt={title}
              fill
              className="object-cover"
              sizes="80px"
              unoptimized
            />
          ) : (
            <div className="h-full w-full bg-[radial-gradient(circle_at_top,rgba(var(--warm-rgb),0.48),rgba(var(--accent-rgb),0.16))]" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-[10px] uppercase tracking-[0.28em] text-ink/50">Powered by YouTube</p>
          <p className="mt-1 line-clamp-2 text-sm font-semibold text-ink">
            {engineStatus === "error" ? errorMessage : title}
          </p>
          <div className="mt-3 flex items-center gap-2">
            <button className="glass-button-muted h-10 w-10 rounded-full p-0" onClick={playPrevious} type="button">
              <SkipBack className="h-4 w-4" />
            </button>
            <button className="glass-button h-10 w-10 rounded-full p-0" onClick={togglePlayback} type="button">
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </button>
            <button className="glass-button-muted h-10 w-10 rounded-full p-0" onClick={playNext} type="button">
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
          className="h-2 w-full cursor-pointer appearance-none rounded-full border border-white/25 accent-[rgb(var(--accent-rgb))]"
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
          className="glass-button-muted h-10 w-10 rounded-full p-0"
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
          className="h-2 w-full accent-[rgb(var(--accent-rgb))]"
          max={100}
          min={0}
          onChange={(event) => setVolume(Number(event.target.value))}
          type="range"
          value={volume}
        />
      </div>
    </motion.aside>
  );
}
