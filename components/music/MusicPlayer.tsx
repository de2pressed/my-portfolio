"use client";

import Image from "next/image";
import { Pause, Play, SkipBack, SkipForward, Volume2, VolumeX } from "lucide-react";
import { motion } from "framer-motion";

import { useMusic } from "@/context/MusicContext";
import { cn } from "@/lib/utils";

export function MusicPlayer() {
  const {
    title,
    thumbnail,
    isPlaying,
    isMuted,
    volume,
    footerTakeover,
    engineStatus,
    errorMessage,
    togglePlayback,
    playNext,
    playPrevious,
    setVolume,
    mute,
    unmute,
  } = useMusic();

  return (
    <motion.aside
      className={cn(
        "fixed bottom-4 right-4 z-40 w-[calc(100vw-2rem)] max-w-sm overflow-hidden rounded-[28px] border border-white/30 bg-white/16 p-3 shadow-[0_18px_60px_rgba(53,37,21,0.16)] backdrop-blur-2xl md:bottom-6 md:right-6",
        footerTakeover > 0.84 && "pointer-events-none",
      )}
      animate={{
        opacity: 1 - Math.min(footerTakeover * 1.25, 1),
        y: footerTakeover * 64,
        scale: 1 - footerTakeover * 0.12,
      }}
      transition={{ duration: 0.35, ease: "easeOut" }}
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
