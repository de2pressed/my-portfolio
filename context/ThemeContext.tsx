"use client";

import {
  createContext,
  type PropsWithChildren,
  useContext,
  useCallback,
  useEffect,
  useState,
} from "react";

import { extractPaletteFromImage, getFallbackPalette } from "@/lib/colorExtractor";

type ThemeContextValue = {
  palette: string[];
  setPaletteFromThumbnail: (thumbnailUrl: string) => Promise<void>;
  resetPalette: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function hexToRgb(hex: string) {
  const normalized = hex.replace("#", "");
  const value = normalized.length === 3 ? normalized.split("").map((part) => part + part).join("") : normalized;
  const red = Number.parseInt(value.slice(0, 2), 16);
  const green = Number.parseInt(value.slice(2, 4), 16);
  const blue = Number.parseInt(value.slice(4, 6), 16);
  return `${red} ${green} ${blue}`;
}

function applyPalette(palette: string[]) {
  const root = document.documentElement;
  const [warm, accent, lavender, teal] = palette;
  const ink = "#f8f2ea";
  const canvas = "#020203";

  root.style.setProperty("--warm-rgb", hexToRgb(warm ?? "#e8bc8a"));
  root.style.setProperty("--accent-rgb", hexToRgb(accent ?? "#de8a75"));
  root.style.setProperty("--lavender-rgb", hexToRgb(lavender ?? "#c1b4cf"));
  root.style.setProperty("--teal-rgb", hexToRgb(teal ?? "#2e7a73"));
  root.style.setProperty("--ink-rgb", hexToRgb(ink));
  root.style.setProperty("--canvas-rgb", hexToRgb(canvas));
  root.style.setProperty("--glass-border-rgb", "255 255 255");
}

export function ThemeProvider({ children }: PropsWithChildren) {
  const [palette, setPalette] = useState<string[]>(() => getFallbackPalette());

  useEffect(() => {
    applyPalette(palette);
  }, [palette]);

  const setPaletteFromThumbnail = useCallback(async (thumbnailUrl: string) => {
    const colors = await extractPaletteFromImage(thumbnailUrl);
    setPalette(colors);
  }, []);

  const resetPalette = useCallback(() => {
    setPalette(getFallbackPalette());
  }, []);

  return (
    <ThemeContext.Provider
      value={{
        palette,
        setPaletteFromThumbnail,
        resetPalette,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme must be used inside ThemeProvider");
  }

  return context;
}
