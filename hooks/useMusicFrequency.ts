"use client";

import { useEffect, useRef, useState } from "react";

import { useMusic } from "@/context/MusicContext";

function extractDominantColors(thumbnailUrl: string, maxColors: number = 4): string[] {
  // Simple color extraction - in production you'd want more sophisticated clustering
  // For now, we'll return a fallback set and let the user know this needs implementation
  // This is a placeholder - actual implementation would use canvas to sample the image
  const fallbackColors = ["#b93ca7", "#7b5fd1", "#2e7a73", "#f0dcff"];
  return fallbackColors;
}

export function useMusicFrequency() {
  const { visualLevel, isPlaying, currentTime, duration, thumbnail } = useMusic();
  const energy = isPlaying ? visualLevel : 0;
  const [thumbnailColors, setThumbnailColors] = useState<string[]>([]);

  useEffect(() => {
    if (thumbnail) {
      const colors = extractDominantColors(thumbnail);
      setThumbnailColors(colors);
    }
  }, [thumbnail]);

  return {
    visualLevel,
    energy,
    isPlaying,
    currentTime,
    duration,
    thumbnailColors,
  };
}
