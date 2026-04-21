"use client";

import { useMusic } from "@/context/MusicContext";

export function useMusicFrequency() {
  const { visualLevel, isPlaying, currentTime, duration } = useMusic();
  const energy = isPlaying ? visualLevel : 0;
  return {
    visualLevel,
    energy,
    isPlaying,
    currentTime,
    duration,
  };
}
