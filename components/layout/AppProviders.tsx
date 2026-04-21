"use client";

import type { PropsWithChildren } from "react";

import { CookieProvider } from "@/context/CookieContext";
import { MusicProvider } from "@/context/MusicContext";
import { ThemeProvider } from "@/context/ThemeContext";

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <ThemeProvider>
      <CookieProvider>
        <MusicProvider>{children}</MusicProvider>
      </CookieProvider>
    </ThemeProvider>
  );
}
