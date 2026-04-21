"use client";

import { useMusic } from "@/context/MusicContext";

export function useMusicFrequency() {
  const { visualLevel, isPlaying } = useMusic();
  const energy = isPlaying ? visualLevel : 0;
  console.log("[useMusicFrequency] Returning:", { visualLevel, isPlaying, energy });
  return {
    visualLevel,
    energy,
    isPlaying,
  };
}
