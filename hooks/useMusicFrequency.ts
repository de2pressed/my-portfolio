"use client";

import { useMusic } from "@/context/MusicContext";

export function useMusicFrequency() {
  const { visualLevel, isPlaying } = useMusic();
  const energy = isPlaying ? visualLevel : 0;
  return {
    visualLevel,
    energy,
    isPlaying,
  };
}
