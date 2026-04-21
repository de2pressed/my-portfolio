"use client";

import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import { DEFAULT_MUSIC_URL } from "@/lib/seed-data";
import { useTheme } from "@/context/ThemeContext";
import { getYouTubeThumbnail, parseYouTubeSource, type ParsedYouTubeSource } from "@/lib/youtube";

type EngineStatus = "idle" | "loading" | "ready" | "error";

type PlayerControls = {
  play: () => void;
  pause: () => void;
  toggle: () => void;
  next: () => void;
  previous: () => void;
  setVolume: (value: number) => void;
  load: (url: string) => void;
  mute: (mute: boolean) => void;
};

type MusicContextValue = {
  source: ParsedYouTubeSource;
  title: string;
  thumbnail: string;
  isPlaying: boolean;
  isMuted: boolean;
  volume: number;
  engineStatus: EngineStatus;
  errorMessage: string | null;
  visualLevel: number;
  footerTakeover: number;
  musicUrl: string;
  setFooterTakeover: (value: number) => void;
  setPlayerReady: (ready: boolean) => void;
  setPlayerError: (message: string) => void;
  syncTrack: (payload: { title?: string; videoId?: string | null; isPlaying?: boolean }) => void;
  setVisualLevel: (value: number) => void;
  setVolume: (value: number) => void;
  registerControls: (controls: PlayerControls) => void;
  togglePlayback: () => void;
  playNext: () => void;
  playPrevious: () => void;
  play: () => void;
  pause: () => void;
  mute: () => void;
  unmute: () => void;
  loadMusicUrl: (url: string) => void;
};

const MusicContext = createContext<MusicContextValue | null>(null);

export function MusicProvider({ children }: PropsWithChildren) {
  const [musicUrl, setMusicUrl] = useState(DEFAULT_MUSIC_URL);
  const [source, setSource] = useState(() => parseYouTubeSource(DEFAULT_MUSIC_URL));
  const [title, setTitle] = useState("Loading soundtrack...");
  const [thumbnail, setThumbnail] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolumeState] = useState(62);
  const [engineStatus, setEngineStatus] = useState<EngineStatus>("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [visualLevel, setVisualLevelState] = useState(0.2);
  const [footerTakeover, setFooterTakeover] = useState(0);
  const [controls, setControls] = useState<PlayerControls | null>(null);
  const { resetPalette, setPaletteFromThumbnail } = useTheme();

  useEffect(() => {
    let cancelled = false;

    async function loadMusicSetting() {
      try {
        const response = await fetch("/api/content?resource=settings&key=music_url", {
          cache: "no-store",
        });
        const payload = (await response.json()) as { value?: string };
        if (!cancelled && payload.value) {
          setMusicUrl(payload.value);
          setSource(parseYouTubeSource(payload.value));
        }
      } catch (error) {
        console.warn("Using default music URL because the settings request failed.", error);
      }
    }

    loadMusicSetting();

    const handleMusicUrlUpdate = (event: Event) => {
      const customEvent = event as CustomEvent<string>;
      const nextUrl = customEvent.detail;
      if (typeof nextUrl === "string" && nextUrl) {
        setMusicUrl(nextUrl);
        setSource(parseYouTubeSource(nextUrl));
        controls?.load(nextUrl);
      }
    };

    window.addEventListener("portfolio:music-url-updated", handleMusicUrlUpdate);

    return () => {
      cancelled = true;
      window.removeEventListener("portfolio:music-url-updated", handleMusicUrlUpdate);
    };
  }, [controls]);

  useEffect(() => {
    const nextThumbnail = getYouTubeThumbnail(source.videoId);
    setThumbnail(nextThumbnail);

    if (nextThumbnail) {
      void setPaletteFromThumbnail(nextThumbnail);
    } else {
      resetPalette();
    }
  }, [resetPalette, setPaletteFromThumbnail, source.videoId]);

  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "hidden") {
        controls?.pause();
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [controls]);

  const registerControls = useCallback((nextControls: PlayerControls) => {
    setControls(nextControls);
  }, []);

  const syncTrack = useCallback((payload: { title?: string; videoId?: string | null; isPlaying?: boolean }) => {
    if (payload.title) {
      setTitle(payload.title);
    }

    if (typeof payload.videoId !== "undefined") {
      setSource((current) => ({
        ...current,
        videoId: payload.videoId ?? null,
      }));
    }

    if (typeof payload.isPlaying === "boolean") {
      setIsPlaying(payload.isPlaying);
    }
  }, []);

  const setPlayerReady = useCallback((ready: boolean) => {
    setEngineStatus(ready ? "ready" : "loading");
    if (ready) {
      setErrorMessage(null);
    }
  }, []);

  const setPlayerError = useCallback((message: string) => {
    setEngineStatus("error");
    setErrorMessage(message);
    setIsPlaying(false);
    resetPalette();
  }, [resetPalette]);

  const setVisualLevel = useCallback((value: number) => {
    setVisualLevelState(value);
  }, []);

  const setVolume = useCallback((value: number) => {
    setVolumeState(value);
    controls?.setVolume(value);
  }, [controls]);

  const togglePlayback = useCallback(() => {
    controls?.toggle();
  }, [controls]);

  const playNext = useCallback(() => {
    controls?.next();
  }, [controls]);

  const playPrevious = useCallback(() => {
    controls?.previous();
  }, [controls]);

  const play = useCallback(() => {
    controls?.play();
  }, [controls]);

  const pause = useCallback(() => {
    controls?.pause();
  }, [controls]);

  const mute = useCallback(() => {
    setIsMuted(true);
    controls?.mute(true);
  }, [controls]);

  const unmute = useCallback(() => {
    setIsMuted(false);
    controls?.mute(false);
  }, [controls]);

  const loadMusicUrl = useCallback((url: string) => {
    setMusicUrl(url);
    setSource(parseYouTubeSource(url));
    controls?.load(url);
  }, [controls]);

  return (
    <MusicContext.Provider
      value={{
        source,
        title,
        thumbnail,
        isPlaying,
        isMuted,
        volume,
        engineStatus,
        errorMessage,
        visualLevel,
        footerTakeover,
        musicUrl,
        setFooterTakeover,
        setPlayerReady,
        setPlayerError,
        syncTrack,
        setVisualLevel,
        setVolume,
        registerControls,
        togglePlayback,
        playNext,
        playPrevious,
        play,
        pause,
        mute,
        unmute,
        loadMusicUrl,
      }}
    >
      {children}
    </MusicContext.Provider>
  );
}

export function useMusic() {
  const context = useContext(MusicContext);

  if (!context) {
    throw new Error("useMusic must be used inside MusicProvider");
  }

  return context;
}
