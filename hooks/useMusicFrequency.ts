"use client";

import { useMusic } from "@/context/MusicContext";

export function useMusicFrequency() {
  const { visualLevel, isPlaying } = useMusic();
  return {
    visualLevel,
    energy: isPlaying ? visualLevel : 0,
    isPlaying,
  };
}
