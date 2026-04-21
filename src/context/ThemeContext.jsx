'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const DEFAULT_THEME = {
  primary: '#a78bfa',
  secondary: '#60a5fa',
  accent: '#f472b6',
};

const ThemeContext = createContext(null);

function hexToRgba(hex, alpha = 0.18) {
  const normalized = hex.replace('#', '');
  const fullHex =
    normalized.length === 3
      ? normalized
          .split('')
          .map((value) => `${value}${value}`)
          .join('')
      : normalized;

  const numeric = Number.parseInt(fullHex, 16);
  const red = (numeric >> 16) & 255;
  const green = (numeric >> 8) & 255;
  const blue = numeric & 255;

  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(DEFAULT_THEME);

  useEffect(() => {
    const root = document.documentElement;

    root.style.setProperty('--ambient-primary', theme.primary);
    root.style.setProperty('--ambient-secondary', theme.secondary);
    root.style.setProperty('--ambient-accent', theme.accent);
    root.style.setProperty('--ambient-bg-glow', hexToRgba(theme.primary));
  }, [theme]);

  const value = useMemo(
    () => ({
      ambientColors: [theme.primary, theme.secondary, theme.accent],
      theme,
      setAmbientColors(colors = []) {
        const [primary, secondary, accent] = colors;

        setTheme({
          primary: primary || DEFAULT_THEME.primary,
          secondary: secondary || DEFAULT_THEME.secondary,
          accent: accent || DEFAULT_THEME.accent,
        });
      },
    }),
    [theme],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider.');
  }

  return context;
}

export default ThemeProvider;
