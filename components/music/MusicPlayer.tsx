"use client";

import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import {
  Maximize2,
  Minimize2,
  Pause,
  Play,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { useMusic } from "@/context/MusicContext";
import { createYouTubePlayer, type ExtendedPlayer } from "@/lib/youtube-player";
import { createTiltEffect, type TiltConfig, type TiltHandle } from "@/lib/tilt-effect";
import { DEFAULT_MUSIC_URL } from "@/lib/seed-data";
import { extractYouTubeVideoId, parseYouTubeSource } from "@/lib/youtube";
import { cn } from "@/lib/utils";

const MINIMIZED_KEY = "portfolio-music-player-minimized";
const WAVEFORM_BAR_COUNT = 48;
const WAVEFORM_CENTER = 54;
const WAVEFORM_RING_RADIUS = 40;
const WAVEFORM_PHASES = Array.from(
  { length: WAVEFORM_BAR_COUNT },
  (_, i) => (i / WAVEFORM_BAR_COUNT) * Math.PI * 2,
);

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function formatPlaybackTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const total = Math.floor(seconds);
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function readStoredPreference(): boolean | null {
  try {
    const stored = window.localStorage.getItem(MINIMIZED_KEY);
    return stored === null ? null : stored === "1";
  } catch {
    return null;
  }
}

const STANDALONE_TILT: TiltConfig = {
  maxRotation: 5,
  perspective: 900,
  lerpFactor: 0.08,
  easeOutDuration: 450,
};

const FOOTER_TILT: TiltConfig = {
  maxRotation: 8,
  perspective: 725,
  lerpFactor: 0.1,
  easeOutDuration: 400,
  enableSpecular: true,
  maxSpecularOpacity: 0.15,
};

export function MusicPlayer() {
  const {
    source,
    title,
    thumbnail,
    isPlaying,
    isMuted,
    volume,
    currentTime,
    duration,
    footerTakeover,
    layoutMode,
    engineStatus,
    errorMessage,
    setPlayerReady,
    setPlayerError,
    syncTrack,
    setVisualLevel,
    setVolume,
    seekTo,
    setIsPlaying,
    setIsMuted,
    loadMusicUrl,
  } = useMusic();

  const playerHostRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<ExtendedPlayer | null>(null);
  const isInitializedRef = useRef(false);
  const sourceRef = useRef(source.rawUrl);
  const volumeRef = useRef(volume);
  const previousTimeRef = useRef(0);
  const autoplayUnmutePendingRef = useRef(false);
  const playbackRetryTimerRef = useRef<number | null>(null);
  const playlistFallbackAttemptedRef = useRef(false);
  const defaultFallbackAttemptedRef = useRef(false);
  const smoothedEnergyRef = useRef(0.08);
  const energyHistoryRef = useRef<number[]>([]);
  const pollIntervalRef = useRef<number | null>(null);
  const safetyTimeoutRef = useRef<number | null>(null);
  const tiltSurfaceRef = useRef<HTMLDivElement>(null);
  const tiltHandleRef = useRef<TiltHandle | null>(null);
  const waveformBarRefs = useRef<(SVGLineElement | null)[]>([]);
  const musicEnergyRef = useRef(0.08);
  const waveformRafRef = useRef(0);

  const [isMinimized, setIsMinimized] = useState(true);
  const [hydrated, setHydrated] = useState(false);

  const isFooter = layoutMode === "footer";
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  // ── Control Methods ──────────────────────────────────────────────

  const play = useCallback(() => {
    const player = playerRef.current;
    if (!player) return;

    if (autoplayUnmutePendingRef.current || player.isMuted() || player.getVolume() === 0) {
      player.unMute();
      player.setVolume(volumeRef.current);
      autoplayUnmutePendingRef.current = false;
      setIsMuted(false);
    }

    player.playVideo();
    setIsPlaying(true);
  }, [setIsPlaying, setIsMuted]);

  const pause = useCallback(() => {
    const player = playerRef.current;
    if (!player) return;
    player.pauseVideo();
    setIsPlaying(false);
  }, [setIsPlaying]);

  const toggle = useCallback(() => {
    const player = playerRef.current;
    if (!player) return;
    const state = player.getPlayerState();
    if (state === window.YT?.PlayerState.PLAYING) {
      pause();
    } else {
      play();
    }
  }, [play, pause]);

  const next = useCallback(() => {
    const player = playerRef.current;
    if (!player) return;

    const playlist = typeof player.getPlaylist === "function" ? player.getPlaylist() : [];
    const playlistIndex = typeof player.getPlaylistIndex === "function" ? player.getPlaylistIndex() : -1;

    if (playlistIndex >= 0 && playlist.length > 0) {
      player.playVideoAt((playlistIndex + 1) % playlist.length);
      return;
    }

    if (source.playlistId) {
      player.loadPlaylist({ list: source.playlistId, listType: "playlist", index: 0 });
      try { player.setShuffle(false); } catch { /* ignore */ }
      play();
      return;
    }

    player.nextVideo();
  }, [source.playlistId, play]);

  const previous = useCallback(() => {
    const player = playerRef.current;
    if (!player) return;

    const playlist = typeof player.getPlaylist === "function" ? player.getPlaylist() : [];
    const playlistIndex = typeof player.getPlaylistIndex === "function" ? player.getPlaylistIndex() : -1;

    if (playlistIndex >= 0 && playlist.length > 0) {
      player.playVideoAt((playlistIndex - 1 + playlist.length) % playlist.length);
      return;
    }

    if (source.playlistId) {
      player.loadPlaylist({ list: source.playlistId, listType: "playlist", index: 0 });
      try { player.setShuffle(false); } catch { /* ignore */ }
      player.seekTo(0, true);
      return;
    }

    player.previousVideo();
  }, [source.playlistId]);

  const handleSetVolume = useCallback((nextVolume: number) => {
    const player = playerRef.current;
    if (!player) return;
    volumeRef.current = nextVolume;
    player.setVolume(nextVolume);
    setVolume(nextVolume);
  }, [setVolume]);

  const handleSeekTo = useCallback((seconds: number) => {
    const player = playerRef.current;
    if (!player) return;
    player.seekTo(seconds, true);
    seekTo(seconds);
  }, [seekTo]);

  const handleMute = useCallback((mute: boolean) => {
    const player = playerRef.current;
    if (!player) return;
    if (mute) { player.mute(); } else { player.unMute(); }
    setIsMuted(mute);
  }, [setIsMuted]);

  // ── Hydration & Persistence ──────────────────────────────────────

  useEffect(() => {
    const stored = readStoredPreference();
    if (stored !== null) setIsMinimized(stored);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try { window.localStorage.setItem(MINIMIZED_KEY, isMinimized ? "1" : "0"); } catch { /* ignore */ }
  }, [hydrated, isMinimized]);

  useEffect(() => { volumeRef.current = volume; }, [volume]);

  // ── Tilt Effect ──────────────────────────────────────────────────

  useEffect(() => {
    if (!tiltSurfaceRef.current || !hydrated) return;

    const config = isFooter ? FOOTER_TILT : STANDALONE_TILT;

    // Always destroy and recreate — the DOM element changes when layout switches
    tiltHandleRef.current?.destroy();
    tiltHandleRef.current = createTiltEffect(tiltSurfaceRef.current, config);

    return () => {
      tiltHandleRef.current?.destroy();
      tiltHandleRef.current = null;
    };
  }, [isFooter, hydrated]);

  // ── Waveform Animation ───────────────────────────────────────────

  useEffect(() => {
    if (!isMinimized || isFooter) {
      if (waveformRafRef.current) {
        cancelAnimationFrame(waveformRafRef.current);
        waveformRafRef.current = 0;
      }
      return;
    }

    let displayEnergy = musicEnergyRef.current;

    const tick = (time: number) => {
      const targetEnergy = clamp(musicEnergyRef.current, 0, 1);
      displayEnergy += (targetEnergy - displayEnergy) * (targetEnergy > displayEnergy ? 0.16 : 0.08);

      for (let i = 0; i < WAVEFORM_BAR_COUNT; i++) {
        const bar = waveformBarRefs.current[i];
        if (!bar) continue;

        const phase = WAVEFORM_PHASES[i] ?? 0;
        const shimmer = (Math.sin(time * 0.0026 + phase * 1.9) + 1) / 2;
        const ripple = (Math.cos(time * 0.0018 - phase * 0.75) + 1) / 2;
        const height = 2 + displayEnergy * 12 + shimmer * (displayEnergy * 8 + 2) + ripple * displayEnergy * 4;
        const alpha = clamp(0.18 + displayEnergy * 0.5 + shimmer * 0.16 + ripple * 0.08, 0.12, 0.96);

        bar.setAttribute("y1", String(WAVEFORM_CENTER - WAVEFORM_RING_RADIUS));
        bar.setAttribute("y2", String(WAVEFORM_CENTER - WAVEFORM_RING_RADIUS - height));
        bar.setAttribute("stroke", `rgba(var(--accent-rgb), ${alpha.toFixed(3)})`);
      }

      waveformRafRef.current = requestAnimationFrame(tick);
    };

    waveformRafRef.current = requestAnimationFrame(tick);

    return () => {
      if (waveformRafRef.current) {
        cancelAnimationFrame(waveformRafRef.current);
        waveformRafRef.current = 0;
      }
    };
  }, [isMinimized, isFooter]);

  // ── Player Initialization ───────────────────────────────────────

  useEffect(() => {
    let cancelled = false;
    let resolved = false;

    const markResolved = () => { resolved = true; };

    function deriveEnergy(time: number, playing: boolean, vol: number, delta: number) {
      if (!playing) return 0.04;
      const volIntensity = Math.pow(vol / 100, 1.2) * 0.7;
      const activityBump = Math.min(0.15, delta * 1.5);
      const raw = Math.min(1.0, 0.15 + volIntensity + activityBump);
      energyHistoryRef.current.push(raw);
      if (energyHistoryRef.current.length > 3) energyHistoryRef.current.shift();
      return energyHistoryRef.current.reduce((s, v) => s + v, 0) / energyHistoryRef.current.length;
    }

    function readCurrentTrack(player: ExtendedPlayer) {
      let videoData: { title: string; video_id: string } | null = null;
      try { videoData = player.getVideoData(); } catch { /* ignore */ }

      let videoUrl = "";
      try { videoUrl = player.getVideoUrl(); } catch { /* ignore */ }

      let playlist: string[] = [];
      try { if (typeof player.getPlaylist === "function") playlist = player.getPlaylist(); } catch { /* ignore */ }

      let playlistIndex = -1;
      try { if (typeof player.getPlaylistIndex === "function") playlistIndex = player.getPlaylistIndex(); } catch { /* ignore */ }

      const videoIdFromPlaylist = playlistIndex >= 0 ? playlist[playlistIndex] ?? null : null;
      const videoIdFromUrl = extractYouTubeVideoId(videoUrl);
      const trackTitle = videoData?.title?.trim() || null;
      const videoId = videoData?.video_id || videoIdFromPlaylist || videoIdFromUrl || source.videoId || null;

      return { title: trackTitle, videoId, currentTime: player.getCurrentTime(), duration: player.getDuration(), playlist, playlistIndex };
    }

    function startPlayback(player: ExtendedPlayer) {
      let attempts = 0;
      let longRetryQueued = false;

      const attempt = () => {
        if (cancelled || !playerRef.current) return;
        try {
          const state = player.getPlayerState();
          if (state === window.YT?.PlayerState.PLAYING) {
            if (playbackRetryTimerRef.current !== null) {
              clearTimeout(playbackRetryTimerRef.current);
              playbackRetryTimerRef.current = null;
            }
            return;
          }
          player.playVideo();
          attempts++;
          if (attempts < 6 && !cancelled) {
            playbackRetryTimerRef.current = window.setTimeout(attempt, 220);
            return;
          }
          if (!longRetryQueued && !cancelled) {
            longRetryQueued = true;
            playbackRetryTimerRef.current = window.setTimeout(attempt, 3000);
          }
        } catch (err) {
          console.warn("YouTube playback bootstrap failed.", err);
        }
      };

      if (playbackRetryTimerRef.current !== null) clearTimeout(playbackRetryTimerRef.current);
      attempt();
    }

    safetyTimeoutRef.current = window.setTimeout(() => {
      if (!cancelled && !resolved) {
        console.warn("YouTube engine timed out — proceeding without music.");
        setPlayerReady(true);
        markResolved();
      }
    }, 8000);

    async function boot() {
      if (isInitializedRef.current) return;
      isInitializedRef.current = true;

      if (!playerHostRef.current) {
        isInitializedRef.current = false;
        return;
      }

      playlistFallbackAttemptedRef.current = false;
      defaultFallbackAttemptedRef.current = false;

      try {
        const player = await createYouTubePlayer({
          hostElement: playerHostRef.current,
          source: { videoId: source.videoId, playlistId: source.playlistId, rawUrl: source.rawUrl },
          handlers: {
            onReady: (event) => {
              if (cancelled) return;
              const p = event.target as ExtendedPlayer;
              markResolved();
              playerRef.current = p;
              previousTimeRef.current = p.getCurrentTime();

              if (source.playlistId) {
                try { p.setShuffle(false); } catch { /* ignore */ }
              }

              p.mute();
              p.setVolume(0);
              autoplayUnmutePendingRef.current = true;
              startPlayback(p);
              setPlayerReady(true);
            },
            onStateChange: (event) => {
              if (cancelled) return;
              const p = event.target as ExtendedPlayer;
              const state = event.data;

              if (state === window.YT?.PlayerState.PLAYING) {
                if (autoplayUnmutePendingRef.current) {
                  p.unMute();
                  p.setVolume(volumeRef.current);
                  autoplayUnmutePendingRef.current = false;
                  setIsMuted(false);
                }
                setIsPlaying(true);

                const track = readCurrentTrack(p);
                syncTrack({
                  title: track.title ?? undefined,
                  videoId: track.videoId ?? undefined,
                  isPlaying: true,
                  currentTime: track.currentTime,
                  duration: track.duration,
                });
              } else if (state === window.YT?.PlayerState.PAUSED) {
                setIsPlaying(false);
              } else if (state === window.YT?.PlayerState.ENDED) {
                setIsPlaying(false);
              }
            },
            onError: () => {
              if (cancelled) return;

              if (source.playlistId && !playlistFallbackAttemptedRef.current) {
                playlistFallbackAttemptedRef.current = true;
                const p = playerRef.current;
                if (p) {
                  try { p.loadPlaylist({ list: source.playlistId, listType: "playlist" }); } catch { /* ignore */ }
                  return;
                }
              }

              if (!defaultFallbackAttemptedRef.current && source.rawUrl !== DEFAULT_MUSIC_URL) {
                defaultFallbackAttemptedRef.current = true;
                loadMusicUrl(DEFAULT_MUSIC_URL);
                return;
              }

              setPlayerError("Music unavailable");
              markResolved();
            },
          },
        });

        if (cancelled) {
          try { player.destroy(); } catch { /* ignore */ }
          return;
        }

        playerRef.current = player as ExtendedPlayer;

        pollIntervalRef.current = window.setInterval(() => {
          const p = playerRef.current;
          if (!p || cancelled) return;

          try {
            const time = p.getCurrentTime();
            const dur = p.getDuration();
            const playing = p.getPlayerState() === window.YT?.PlayerState.PLAYING;
            const delta = Math.abs(time - previousTimeRef.current);
            previousTimeRef.current = time;

            const energy = deriveEnergy(time, playing, volumeRef.current, delta);
            smoothedEnergyRef.current = energy;
            musicEnergyRef.current = energy;
            setVisualLevel(energy);

            const track = readCurrentTrack(p as ExtendedPlayer);
            syncTrack({
              title: track.title ?? undefined,
              videoId: track.videoId ?? undefined,
              currentTime: time,
              duration: dur,
              isMuted: p.isMuted(),
            });
          } catch { /* ignore poll errors */ }
        }, 1000);
      } catch (err) {
        console.warn("YouTube IFrame API failed to initialize.", err);
        markResolved();
        autoplayUnmutePendingRef.current = false;
        setPlayerError("Music unavailable");
      }
    }

    boot();

    return () => {
      cancelled = true;
      // NOTE: isInitializedRef is intentionally NOT reset here.
      // This prevents StrictMode double-invoke from re-initializing
      // the player on the same host element.
      if (safetyTimeoutRef.current !== null) clearTimeout(safetyTimeoutRef.current);
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      if (playbackRetryTimerRef.current !== null) {
        clearTimeout(playbackRetryTimerRef.current);
        playbackRetryTimerRef.current = null;
      }
      playerRef.current?.destroy();
      playerRef.current = null;
    };
  }, [source.playlistId, source.rawUrl, source.videoId, setPlayerReady, setPlayerError, syncTrack, setVisualLevel, setIsPlaying, setIsMuted, loadMusicUrl]);

  // ── Source Change Handler ─────────────────────────────────────────

  useEffect(() => {
    if (sourceRef.current === source.rawUrl) return;
    sourceRef.current = source.rawUrl;

    const player = playerRef.current;
    if (!player) return;

    const parsed = parseYouTubeSource(source.rawUrl);
    if (parsed.playlistId) {
      player.loadPlaylist({ list: parsed.playlistId, listType: "playlist" });
      try { player.setShuffle(false); } catch { /* ignore */ }
    } else if (parsed.videoId) {
      player.loadVideoById(parsed.videoId);
    }
  }, [source.rawUrl]);

  // ── Render Helpers ───────────────────────────────────────────────

  const renderArtwork = () => {
    if (!thumbnail) {
      return (
        <div className="flex h-full w-full items-center justify-center bg-canvas/34">
          <Play className="h-5 w-5 text-ink/30" />
        </div>
      );
    }

    return (
      <Image
        alt={title}
        className="object-cover"
        fill
        sizes="80px"
        src={thumbnail}
      />
    );
  };

  const renderSeekBar = (compact = false) => (
    <div className={compact ? "mt-2 space-y-1" : "mt-3 space-y-2"}>
      <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.22em] text-ink/48">
        <span>{formatPlaybackTime(currentTime)}</span>
        <span>{duration > 0 ? formatPlaybackTime(duration) : "0:00"}</span>
      </div>
      <input
        aria-label="Track progress"
        className="h-2 w-full cursor-pointer appearance-none rounded-full accent-[rgb(var(--accent-rgb))] pointer-events-auto"
        disabled={duration <= 0}
        max={Math.max(duration, 1)}
        min={0}
        onChange={(e) => handleSeekTo(Number(e.target.value))}
        style={{
          background: `linear-gradient(90deg, rgb(var(--accent-rgb)) 0%, rgb(var(--accent-rgb)) ${progress}%, rgba(255,255,255,0.22) ${progress}%, rgba(255,255,255,0.22) 100%)`,
        }}
        step={0.1}
        type="range"
        value={duration > 0 ? Math.min(currentTime, duration) : 0}
      />
    </div>
  );

  const renderVolumeRow = () => (
    <div className="mt-3 flex items-center gap-3">
      <button
        className="glass-button-muted h-9 w-9 rounded-full p-0 pointer-events-auto"
        onClick={() => {
          if (isMuted || volume === 0) {
            handleMute(false);
            if (volume === 0) handleSetVolume(50);
            return;
          }
          handleMute(true);
        }}
        type="button"
      >
        {isMuted || volume === 0 ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
      </button>
      <input
        aria-label="Volume"
        className="h-2 w-full cursor-pointer appearance-none rounded-full accent-[rgb(var(--accent-rgb))] pointer-events-auto"
        max={100}
        min={0}
        onChange={(e) => handleSetVolume(Number(e.target.value))}
        style={{
          background: `linear-gradient(90deg, rgb(var(--accent-rgb)) 0%, rgb(var(--accent-rgb)) ${volume}%, rgba(255,255,255,0.22) ${volume}%, rgba(255,255,255,0.22) 100%)`,
        }}
        type="range"
        value={volume}
      />
    </div>
  );

  const renderTransport = (size: "sm" | "md" = "md") => {
    const btnSize = size === "sm" ? "h-8 w-8" : "h-9 w-9 sm:h-10 sm:w-10";
    const mainBtnSize = size === "sm" ? "h-9 w-9" : "h-9 w-9 sm:h-10 sm:w-10";
    const iconSize = "h-4 w-4";
    const gap = size === "sm" ? "gap-1.5" : "gap-2";

    return (
      <div className={`flex items-center ${gap}`}>
        <button className={`glass-button-muted ${btnSize} rounded-full p-0 pointer-events-auto`} onClick={previous} type="button">
          <SkipBack className={iconSize} />
        </button>
        <button className={`glass-button ${mainBtnSize} rounded-full p-0 pointer-events-auto`} onClick={toggle} type="button">
          {isPlaying ? <Pause className={iconSize} /> : <Play className={iconSize} />}
        </button>
        <button className={`glass-button-muted ${btnSize} rounded-full p-0 pointer-events-auto`} onClick={next} type="button">
          <SkipForward className={iconSize} />
        </button>
      </div>
    );
  };

  const renderWaveform = () => (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full"
      viewBox={`0 0 ${WAVEFORM_CENTER * 2} ${WAVEFORM_CENTER * 2}`}
    >
      {Array.from({ length: WAVEFORM_BAR_COUNT }, (_, i) => (
        <line
          key={i}
          ref={(el) => { waveformBarRefs.current[i] = el; }}
          x1={WAVEFORM_CENTER + Math.cos(WAVEFORM_PHASES[i]!) * WAVEFORM_RING_RADIUS}
          y1={WAVEFORM_CENTER - WAVEFORM_RING_RADIUS}
          x2={WAVEFORM_CENTER + Math.cos(WAVEFORM_PHASES[i]!) * WAVEFORM_RING_RADIUS}
          y2={WAVEFORM_CENTER - WAVEFORM_RING_RADIUS - 2}
          stroke={`rgba(var(--accent-rgb), 0.18)`}
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      ))}
    </svg>
  );

  // ── Standalone Layout ─────────────────────────────────────────────

  const takeoverFade = clamp((footerTakeover - 0.12) / 0.6, 0, 1);
  const takeoverDepth = clamp((footerTakeover - 0.12) / 0.88, 0, 1);
  const takeoverFilter = `blur(${takeoverDepth * 8}px)`;

  const renderStandalone = () => (
    <motion.div
      className={cn(
        "fixed bottom-4 right-4 z-40 md:bottom-6 md:right-6",
        isMinimized
          ? "h-[11rem] w-[11rem] sm:h-[11.5rem] sm:w-[11.5rem]"
          : "w-[calc(100vw-2rem)] max-w-[28rem] sm:max-w-[30rem]",
      )}
      layout
      animate={{
        opacity: 1 - takeoverFade,
        y: takeoverDepth * (isMinimized ? 360 : 480),
        scale: 1 + takeoverDepth * 0.24,
        rotate: takeoverDepth * -3,
      }}
      style={{ filter: takeoverFilter }}
      transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
    >
      <div ref={tiltSurfaceRef} style={{ pointerEvents: "none" }}>
        <div className="overflow-hidden bg-[rgba(10,10,14,0.42)] shadow-[0_18px_60px_rgba(5,5,8,0.3),0_0_0_1px_rgba(var(--glass-border-rgb),0.1)] backdrop-blur-2xl">
          <button
            aria-label={isMinimized ? "Expand player" : "Minimize player"}
            className="glass-button-muted absolute right-3 top-3 z-10 h-9 w-9 rounded-full p-0 pointer-events-auto"
            onClick={() => setIsMinimized((c) => !c)}
            type="button"
          >
            {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
          </button>

          <AnimatePresence mode="wait" initial={false}>
            {isMinimized ? (
              <motion.div
                key="minimized"
                className="flex h-full flex-col items-center justify-start gap-2 pt-7"
                initial={{ opacity: 0, scale: 0.94, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.94, y: 8 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className="relative h-20 w-20 overflow-hidden rounded-full bg-[rgba(10,10,14,0.34)]"
                  style={{ animation: "spin 14s linear infinite", animationPlayState: isPlaying ? "running" : "paused" }}>
                  {renderArtwork()}
                </div>
                {renderWaveform()}
                <div className="mt-1">
                  {renderTransport("sm")}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="expanded"
                className="pr-10"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className="flex items-start gap-4">
                  <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-[22px] bg-[rgba(10,10,14,0.34)] sm:h-20 sm:w-20">
                    {renderArtwork()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] uppercase tracking-[0.28em] text-ink/50">Powered by YouTube</p>
                    <p className="mt-1 line-clamp-2 text-sm font-semibold text-ink">
                      {engineStatus === "error" ? errorMessage : title}
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-center">
                  {renderTransport()}
                </div>
                {renderSeekBar()}
                {renderVolumeRow()}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );

  // ── Footer Layout ─────────────────────────────────────────────────

  const cardProgress = clamp((footerTakeover - 0.64) / 0.36, 0, 1);

  const renderFooter = () => (
    <motion.div
      className="relative"
      animate={{
        opacity: cardProgress,
        y: 22 - cardProgress * 26,
        scale: 0.88 + cardProgress * 0.12,
        rotateX: (2 - cardProgress * 2) * 0.5,
        rotate: 2 - cardProgress * 2,
        boxShadow: `0 24px 90px rgba(5,5,8,${0.28 + cardProgress * 0.08}), 0 0 0 1px rgba(var(--accent-rgb), ${0.1 + cardProgress * 0.04}), 0 0 ${28 + cardProgress * 14}px rgba(var(--accent-rgb), ${0.05 + cardProgress * 0.08})`,
      }}
      transition={{
        opacity: { duration: 0.18, ease: "easeOut" },
        y: { type: "spring", stiffness: 240, damping: 26, mass: 0.9 },
        scale: { type: "spring", stiffness: 240, damping: 24, mass: 0.9 },
        rotate: { type: "spring", stiffness: 260, damping: 24, mass: 0.8 },
        rotateX: { type: "spring", stiffness: 220, damping: 25, mass: 0.85 },
        boxShadow: { duration: 0.22, ease: "easeOut" },
      }}
    >
      <div ref={isFooter ? tiltSurfaceRef : undefined} style={{ pointerEvents: "none" }}>
        <div className="relative overflow-hidden rounded-[30px] border border-white/10 bg-[rgba(10,10,14,0.4)] p-4 shadow-[0_24px_90px_rgba(5,5,8,0.28)] backdrop-blur-2xl">
          <div className="flex items-center gap-4">
            <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-[22px] bg-[rgba(10,10,14,0.34)]">
              {renderArtwork()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] uppercase tracking-[0.28em] text-ink/50">Powered by YouTube</p>
              <p className="mt-1 line-clamp-2 text-sm font-semibold text-ink">
                {engineStatus === "error" ? errorMessage : title}
              </p>
            </div>
            <div className="pointer-events-auto">
              {renderTransport("sm")}
            </div>
          </div>
          {renderSeekBar(true)}
          {renderVolumeRow()}
        </div>
      </div>
    </motion.div>
  );

  // ── Main Render ───────────────────────────────────────────────────

  if (!hydrated) return null;

  return (
    <>
      <div
        ref={playerHostRef}
        className="pointer-events-none absolute left-0 top-0 h-0 w-0 overflow-hidden opacity-0"
        aria-hidden="true"
      />

      {isFooter ? renderFooter() : renderStandalone()}
    </>
  );
}
