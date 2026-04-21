"use client";

import { useMusic } from "@/context/MusicContext";

export function useMusicFrequency() {
  const { visualLevel } = useMusic();
  return visualLevel;
}
