"use client";

import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

import { useResolvedYouTubeThumbnail } from "@/hooks/useResolvedYouTubeThumbnail";
import { DEFAULT_MUSIC_URL } from "@/lib/seed-data";
import { useTheme } from "@/context/ThemeContext";
import { extractYouTubeVideoId, parseYouTubeSource, type ParsedYouTubeSource } from "@/lib/youtube";

type EngineStatus = "idle" | "loading" | "ready" | "error";
type LayoutMode = "standalone" | "footer";

type PlayerControls = {
  play: () => void;
  pause: () => void;
  toggle: () => void;
  next: () => void;
  previous: () => void;
  setVolume: (value: number) => void;
  seekTo: (seconds: number) => void;
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
  currentTime: number;
  duration: number;
  engineStatus: EngineStatus;
  errorMessage: string | null;
  visualLevel: number;
  footerTakeover: number;
  layoutMode: LayoutMode;
  musicUrl: string;
  setFooterTakeover: (value: number) => void;
  setPlayerReady: (ready: boolean) => void;
  setPlayerError: (message: string) => void;
  syncTrack: (payload: {
    title?: string;
    videoId?: string | null;
    isPlaying?: boolean;
    currentTime?: number;
    duration?: number;
    isMuted?: boolean;
  }) => void;
  setVisualLevel: (value: number) => void;
  setVolume: (value: number) => void;
  seekTo: (seconds: number) => void;
  setIsPlaying: (playing: boolean) => void;
  setIsMuted: (muted: boolean) => void;
  loadMusicUrl: (url: string) => void;
  togglePlayback: () => void;
  playNext: () => void;
  playPrevious: () => void;
  mute: () => void;
  unmute: () => void;
  play: () => void;
  pause: () => void;
  registerControls: (controls: PlayerControls) => void;
};

const MusicContext = createContext<MusicContextValue | null>(null);

export function MusicProvider({ children }: PropsWithChildren) {
  const [musicUrl, setMusicUrl] = useState(DEFAULT_MUSIC_URL);
  const [source, setSource] = useState(() => parseYouTubeSource(DEFAULT_MUSIC_URL));
  const [title, setTitle] = useState("Loading soundtrack...");
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolumeState] = useState(62);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [engineStatus, setEngineStatus] = useState<EngineStatus>("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [visualLevel, setVisualLevelState] = useState(0.2);
  const [footerTakeover, setFooterTakeover] = useState(0);
  const layoutModeRef = useRef<LayoutMode>("standalone");
  const layoutMode: LayoutMode =
    footerTakeover >= 0.72 ? "footer" : footerTakeover < 0.68 ? "standalone" : layoutModeRef.current;

  useEffect(() => {
    layoutModeRef.current = layoutMode;
  }, [layoutMode]);
  const thumbnailSourceId = source.videoId ?? extractYouTubeVideoId(source.rawUrl);
  const thumbnail = useResolvedYouTubeThumbnail(thumbnailSourceId);
  const { resetPalette, setPaletteFromThumbnail } = useTheme();

  useEffect(() => {
    let cancelled = false;

    async function loadMusicSetting() {
      try {
        const response = await fetch("/api/content?resource=settings&key=music_url", {
          cache: "no-store",
        });
        const payload = (await response.json()) as { value?: string };
        if (!cancelled && payload.value && payload.value !== musicUrl) {
          setMusicUrl(payload.value);
          setSource(parseYouTubeSource(payload.value));
          setTitle("Loading soundtrack...");
          setCurrentTime(0);
          setDuration(0);
        }
      } catch (error) {
        console.warn("Using default music URL because the settings request failed.", error);
      }
    }

    loadMusicSetting();

    const handleMusicUrlUpdate = (event: Event) => {
      const customEvent = event as CustomEvent<string>;
      const nextUrl = customEvent.detail;
      if (typeof nextUrl === "string" && nextUrl && nextUrl !== musicUrl) {
        setMusicUrl(nextUrl);
        setSource(parseYouTubeSource(nextUrl));
        setTitle("Loading soundtrack...");
        setCurrentTime(0);
        setDuration(0);
      }
    };

    window.addEventListener("portfolio:music-url-updated", handleMusicUrlUpdate);

    return () => {
      cancelled = true;
      window.removeEventListener("portfolio:music-url-updated", handleMusicUrlUpdate);
    };
  }, []);

  useEffect(() => {
    if (thumbnail) {
      void setPaletteFromThumbnail(thumbnail);
      return;
    }

    resetPalette();
  }, [resetPalette, setPaletteFromThumbnail, thumbnail]);

  const syncTrack = useCallback((payload: {
    title?: string | null;
    videoId?: string | null;
    isPlaying?: boolean;
    currentTime?: number;
    duration?: number;
    isMuted?: boolean;
  }) => {
    const nextTitle = payload.title;
    if (nextTitle) {
      setTitle((currentTitle) => (currentTitle === nextTitle ? currentTitle : nextTitle));
    }

    if (typeof payload.videoId !== "undefined") {
      const nextVideoId = payload.videoId ?? null;
      setSource((current) =>
        current.videoId === nextVideoId
          ? current
          : {
              ...current,
              videoId: nextVideoId,
            },
      );
    }

    if (typeof payload.isPlaying === "boolean") {
      setIsPlaying(payload.isPlaying);
    }

    if (typeof payload.currentTime === "number" && Number.isFinite(payload.currentTime)) {
      setCurrentTime(Math.max(0, payload.currentTime));
    }

    if (typeof payload.duration === "number" && Number.isFinite(payload.duration)) {
      setDuration(Math.max(0, payload.duration));
    }

    if (typeof payload.isMuted === "boolean") {
      setIsMuted(payload.isMuted);
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
    setIsMuted(false);
    setCurrentTime(0);
    setDuration(0);
    resetPalette();
  }, [resetPalette]);

  const setVisualLevel = useCallback((value: number) => {
    setVisualLevelState(value);
  }, []);

  const setVolume = useCallback((value: number) => {
    setVolumeState(value);
  }, []);

  const seekTo = useCallback((seconds: number) => {
    const nextSeconds = Math.max(0, duration > 0 ? Math.min(duration, seconds) : seconds);
    setCurrentTime(nextSeconds);
  }, [duration]);

  const loadMusicUrl = useCallback((url: string) => {
    if (url === musicUrl) {
      return;
    }

    setMusicUrl(url);
    setSource(parseYouTubeSource(url));
    setTitle("Loading soundtrack...");
    setCurrentTime(0);
    setDuration(0);
  }, [musicUrl]);

  const controlsRef = useRef<PlayerControls | null>(null);
  const pendingPlayRef = useRef(false);

  const registerControls = useCallback((nextControls: PlayerControls) => {
    controlsRef.current = nextControls;

    if (pendingPlayRef.current) {
      nextControls.play();
      pendingPlayRef.current = false;
    }
  }, []);

  const togglePlayback = useCallback(() => {
    controlsRef.current?.toggle();
  }, []);

  const playNext = useCallback(() => {
    controlsRef.current?.next();
  }, []);

  const playPrevious = useCallback(() => {
    controlsRef.current?.previous();
  }, []);

  const play = useCallback(() => {
    if (controlsRef.current) {
      controlsRef.current.play();
      return;
    }

    pendingPlayRef.current = true;
  }, []);

  const pause = useCallback(() => {
    controlsRef.current?.pause();
    pendingPlayRef.current = false;
  }, []);

  const mute = useCallback(() => {
    setIsMuted(true);
    controlsRef.current?.mute(true);
  }, []);

  const unmute = useCallback(() => {
    setIsMuted(false);
    controlsRef.current?.mute(false);
  }, []);

  return (
    <MusicContext.Provider
      value={{
        source,
        title,
        thumbnail,
        isPlaying,
        isMuted,
        volume,
        currentTime,
        duration,
        engineStatus,
        errorMessage,
        visualLevel,
        footerTakeover,
        layoutMode,
        musicUrl,
        setFooterTakeover,
        setPlayerReady,
        setPlayerError,
        syncTrack,
        setVisualLevel,
        setVolume,
        seekTo,
        setIsPlaying,
        setIsMuted,
        loadMusicUrl,
        togglePlayback,
        playNext,
        playPrevious,
        mute,
        unmute,
        play,
        pause,
        registerControls,
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
