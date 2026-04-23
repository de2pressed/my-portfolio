"use client";

import { useEffect, useState } from "react";

import { useMusic } from "@/context/MusicContext";
import { extractPaletteFromImage } from "@/lib/colorExtractor";

function hexToRgb(hex: string) {
  const normalized = hex.replace("#", "");
  const expanded =
    normalized.length === 3 ? normalized.split("").map((part) => `${part}${part}`).join("") : normalized;
  return {
    red: Number.parseInt(expanded.slice(0, 2), 16),
    green: Number.parseInt(expanded.slice(2, 4), 16),
    blue: Number.parseInt(expanded.slice(4, 6), 16),
  };
}

function rgbToHsl(red: number, green: number, blue: number) {
  const r = red / 255;
  const g = green / 255;
  const b = blue / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const lightness = (max + min) / 2;

  if (max === min) {
    return { hue: 0, saturation: 0, lightness };
  }

  const delta = max - min;
  const saturation = lightness > 0.5 ? delta / (2 - max - min) : delta / (max + min);
  let hue = 0;

  switch (max) {
    case r:
      hue = (g - b) / delta + (g < b ? 6 : 0);
      break;
    case g:
      hue = (b - r) / delta + 2;
      break;
    default:
      hue = (r - g) / delta + 4;
      break;
  }

  return { hue: hue / 6, saturation, lightness };
}

function hslToRgb(hue: number, saturation: number, lightness: number) {
  if (saturation === 0) {
    const value = lightness * 255;
    return { red: value, green: value, blue: value };
  }

  const hueToRgb = (p: number, q: number, t: number) => {
    let nextT = t;
    if (nextT < 0) {
      nextT += 1;
    }
    if (nextT > 1) {
      nextT -= 1;
    }
    if (nextT < 1 / 6) {
      return p + (q - p) * 6 * nextT;
    }
    if (nextT < 1 / 2) {
      return q;
    }
    if (nextT < 2 / 3) {
      return p + (q - p) * (2 / 3 - nextT) * 6;
    }
    return p;
  };

  const q = lightness < 0.5 ? lightness * (1 + saturation) : lightness + saturation - lightness * saturation;
  const p = 2 * lightness - q;
  const red = hueToRgb(p, q, hue + 1 / 3) * 255;
  const green = hueToRgb(p, q, hue) * 255;
  const blue = hueToRgb(p, q, hue - 1 / 3) * 255;
  return { red, green, blue };
}

function rgbToHex(red: number, green: number, blue: number) {
  return `#${[red, green, blue]
    .map((value) => Math.round(Math.max(0, Math.min(255, value))).toString(16).padStart(2, "0"))
    .join("")}`;
}

function boostColor(hex: string): string {
  const { red, green, blue } = hexToRgb(hex);
  const { hue, saturation, lightness } = rgbToHsl(red, green, blue);
  // Boost saturation by 20% and lightness by 10% for more vibrant colors
  const boostedSaturation = Math.min(1, saturation * 1.2);
  const boostedLightness = Math.min(1, lightness * 1.1);
  const boosted = hslToRgb(hue, boostedSaturation, boostedLightness);
  return rgbToHex(boosted.red, boosted.green, boosted.blue);
}

export function useMusicFrequency() {
  const { visualLevel, isPlaying, currentTime, duration, thumbnail } = useMusic();
  const energy = isPlaying ? visualLevel : 0;
  const [thumbnailColors, setThumbnailColors] = useState<string[]>([]);

  useEffect(() => {
    if (!thumbnail) {
      setThumbnailColors([]);
      return;
    }

    extractPaletteFromImage(thumbnail)
      .then((colors) => {
        const boostedColors = colors.slice(0, 4).map(boostColor);
        setThumbnailColors(boostedColors);
      })
      .catch((error) => {
        console.warn("Failed to extract thumbnail colors:", error);
        setThumbnailColors([]);
      });
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
