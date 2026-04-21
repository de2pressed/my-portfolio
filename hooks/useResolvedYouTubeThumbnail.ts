"use client";

import { useEffect, useState } from "react";

import { getYouTubeThumbnail, getYouTubeThumbnailCandidates } from "@/lib/youtube";

const thumbnailCache = new Map<string, string>();

function preloadImage(url: string) {
  return new Promise<boolean>((resolve) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image.naturalWidth > 0 && image.naturalHeight > 0);
    image.onerror = () => resolve(false);
    image.src = url;
  });
}

export function useResolvedYouTubeThumbnail(videoId: string | null) {
  const [thumbnail, setThumbnail] = useState("");

  useEffect(() => {
    let cancelled = false;

    if (!videoId) {
      setThumbnail("");
      return () => {
        cancelled = true;
      };
    }

    const resolvedVideoId = videoId;
    const cached = thumbnailCache.get(videoId);
    if (cached) {
      setThumbnail(cached);
      return () => {
        cancelled = true;
      };
    }

    setThumbnail("");

    async function resolveThumbnail() {
      for (const candidate of getYouTubeThumbnailCandidates(resolvedVideoId)) {
        if (cancelled) {
          return;
        }

        if (await preloadImage(candidate)) {
          thumbnailCache.set(resolvedVideoId, candidate);
          if (!cancelled) {
            setThumbnail(candidate);
          }
          return;
        }
      }

      const fallback = getYouTubeThumbnail(resolvedVideoId);
      thumbnailCache.set(resolvedVideoId, fallback);
      if (!cancelled) {
        setThumbnail(fallback);
      }
    }

    void resolveThumbnail();

    return () => {
      cancelled = true;
    };
  }, [videoId]);

  return thumbnail;
}
