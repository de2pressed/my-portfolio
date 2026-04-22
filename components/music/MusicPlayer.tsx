"use client";

import Image from "next/image";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion";
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
import { useEffect, useRef, useState } from "react";

import { useMusic } from "@/context/MusicContext";
import { DEFAULT_MUSIC_URL } from "@/lib/seed-data";
import { extractYouTubeVideoId, parseYouTubeSource } from "@/lib/youtube";
import { useMusicFrequency } from "@/hooks/useMusicFrequency";
import { cn } from "@/lib/utils";

declare global {
  interface Window {
    YT?: typeof YT;
    onYouTubeIframeAPIReady?: () => void;
    __youtubeApiReadyPromise__?: Promise<typeof YT>;
    YTConfig?: {
      host?: string;
    };
  }
}

type ExtendedPlayer = YT.Player & {
  getVideoData: () => {
    title: string;
    video_id: string;
  };
  getPlaylist: () => string[];
  getPlaylistIndex: () => number;
  getVideoUrl: () => string;
  getIframe: () => HTMLIFrameElement;
  isMuted: () => boolean;
  getVolume: () => number;
  playVideoAt: (index: number) => void;
  setShuffle: (shufflePlaylist: boolean) => void;
};

const MINIMIZED_KEY = "portfolio-music-player-minimized";
const WAVEFORM_BAR_COUNT = 48;
const WAVEFORM_CENTER = 54;
const WAVEFORM_RING_RADIUS = 40;
const WAVEFORM_PHASES = Array.from(
  { length: WAVEFORM_BAR_COUNT },
  (_, index) => (index / WAVEFORM_BAR_COUNT) * Math.PI * 2
);

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function formatPlaybackTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) {
    return "0:00";
  }

  const totalSeconds = Math.floor(seconds);
  const minutes = Math.floor(totalSeconds / 60);
  const remainingSeconds = totalSeconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

function readStoredPreference() {
  try {
    const stored = window.localStorage.getItem(MINIMIZED_KEY);
    if (stored === null) {
      return null;
    }

    return stored === "1";
  } catch {
    return null;
  }
}

function loadYouTubeApi() {
  if (window.YT?.Player) {
    return Promise.resolve(window.YT);
  }

  if (window.__youtubeApiReadyPromise__) {
    return window.__youtubeApiReadyPromise__;
  }

  window.__youtubeApiReadyPromise__ = new Promise<typeof YT>((resolve) => {
    window.YTConfig = {
      ...(window.YTConfig ?? {}),
      host: "https://www.youtube.com",
    };

    const previousReady = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => resolve(window.YT as typeof YT);

    if (typeof previousReady === "function") {
      const chainedReady = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        previousReady();
        chainedReady?.();
      };
    }

    if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
      const script = document.createElement("script");
      script.src = "https://www.youtube.com/iframe_api";
      script.async = true;
      document.body.appendChild(script);
    }
  });

  return window.__youtubeApiReadyPromise__;
}

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
    engineStatus,
    errorMessage,
    registerControls,
    loadMusicUrl,
    setPlayerReady,
    setPlayerError,
    syncTrack,
    setVisualLevel,
    togglePlayback,
    playNext,
    playPrevious,
    setVolume,
    seekTo,
    mute,
    unmute,
  } = useMusic();

  const hostRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<YT.Player | null>(null);
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

  const [isMinimized, setIsMinimized] = useState(true);
  const [hydrated, setHydrated] = useState(false);
  const musicEnergyRef = useRef(0.08);
  const waveformBarRefs = useRef<(SVGLineElement | null)[]>([]);

  // 3D hover effect refs
  const hoverRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const rotateX = useSpring(
    useTransform(mouseY, [-0.5, 0.5], [5, -5]),
    { stiffness: 150, damping: 25 }
  );
  const rotateY = useSpring(
    useTransform(mouseX, [-0.5, 0.5], [-5, 5]),
    { stiffness: 150, damping: 25 }
  );

  useEffect(() => {
    volumeRef.current = volume;
  }, [volume]);

  useEffect(() => {
    const storedPreference = readStoredPreference();
    if (storedPreference !== null) {
      setIsMinimized(storedPreference);
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    try {
      window.localStorage.setItem(MINIMIZED_KEY, isMinimized ? "1" : "0");
    } catch {
      // Ignore storage failures
    }
  }, [hydrated, isMinimized]);

  useEffect(() => {
    musicEnergyRef.current = smoothedEnergyRef.current;
  }, [smoothedEnergyRef.current]);

  // Waveform animation
  useEffect(() => {
    if (!isMinimized) {
      return;
    }

    let frame = 0;
    let displayEnergy = musicEnergyRef.current;

    const tick = (time: number) => {
      const targetEnergy = clamp(musicEnergyRef.current, 0, 1);
      displayEnergy += (targetEnergy - displayEnergy) * (targetEnergy > displayEnergy ? 0.16 : 0.08);

      for (let index = 0; index < WAVEFORM_BAR_COUNT; index += 1) {
        const bar = waveformBarRefs.current[index];
        if (!bar) {
          continue;
        }

        const phase = WAVEFORM_PHASES[index] ?? 0;
        const shimmer = (Math.sin(time * 0.0026 + phase * 1.9) + 1) / 2;
        const ripple = (Math.cos(time * 0.0018 - phase * 0.75) + 1) / 2;
        const height = 2 + displayEnergy * 12 + shimmer * (displayEnergy * 8 + 2) + ripple * displayEnergy * 4;
        const alpha = clamp(0.18 + displayEnergy * 0.5 + shimmer * 0.16 + ripple * 0.08, 0.12, 0.96);

        bar.setAttribute("y1", String(WAVEFORM_CENTER - WAVEFORM_RING_RADIUS));
        bar.setAttribute("y2", String(WAVEFORM_CENTER - WAVEFORM_RING_RADIUS - height));
        bar.setAttribute("stroke", `rgba(var(--accent-rgb), ${alpha.toFixed(3)})`);
      }

      frame = window.requestAnimationFrame(tick);
    };

    frame = window.requestAnimationFrame(tick);

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [isMinimized]);

  // 3D hover effect handler
  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!hoverRef.current) return;

    const rect = hoverRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseXVal = (event.clientX - rect.left) / width - 0.5;
    const mouseYVal = (event.clientY - rect.top) / height - 0.5;

    mouseX.set(mouseXVal * 0.6);
    mouseY.set(mouseYVal * 0.6);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  // Main player initialization effect
  useEffect(() => {
    let cancelled = false;
    let resolved = false;

    function markResolved() {
      resolved = true;
    }

    function deriveEnergy(
      currentTime: number,
      isPlaying: boolean,
      currentVolume: number,
      deltaTime: number
    ) {
      if (!isPlaying) {
        return 0.04;
      }

      const volumeIntensity = Math.pow(currentVolume / 100, 1.2) * 0.7;
      const activityBump = Math.min(0.15, deltaTime * 1.5);
      const baseEnergy = 0.15;
      const rawEnergy = Math.min(1.0, baseEnergy + volumeIntensity + activityBump);

      energyHistoryRef.current.push(rawEnergy);
      if (energyHistoryRef.current.length > 3) {
        energyHistoryRef.current.shift();
      }
      const averagedEnergy =
        energyHistoryRef.current.reduce((sum, val) => sum + val, 0) / energyHistoryRef.current.length;

      return averagedEnergy;
    }

    function readPlaylist(player: ExtendedPlayer) {
      try {
        return typeof player.getPlaylist === "function" ? player.getPlaylist() : [];
      } catch {
        return [];
      }
    }

    function readPlaylistIndex(player: ExtendedPlayer) {
      try {
        return typeof player.getPlaylistIndex === "function" ? player.getPlaylistIndex() : -1;
      } catch {
        return -1;
      }
    }

    function readVideoData(player: ExtendedPlayer) {
      try {
        return player.getVideoData();
      } catch {
        return null;
      }
    }

    function readCurrentTrack(player: ExtendedPlayer) {
      const playlist = readPlaylist(player);
      const playlistIndex = readPlaylistIndex(player);
      const videoData = readVideoData(player);

      let videoUrl = "";
      try {
        videoUrl = player.getVideoUrl();
      } catch {
        videoUrl = "";
      }

      const videoIdFromPlaylist = playlistIndex >= 0 ? playlist[playlistIndex] ?? null : null;
      const videoIdFromUrl = extractYouTubeVideoId(videoUrl);
      const title = videoData?.title?.trim() || null;
      const videoId = videoData?.video_id || videoIdFromPlaylist || videoIdFromUrl || source.videoId || null;

      return {
        title,
        videoId,
        currentTime: player.getCurrentTime(),
        duration: player.getDuration(),
        playlist,
        playlistIndex,
      };
    }

    function resolvePlaylistPosition(player: ExtendedPlayer) {
      const snapshot = readCurrentTrack(player);

      if (snapshot.playlistIndex >= 0) {
        return snapshot;
      }

      const resolvedIndex =
        snapshot.videoId && snapshot.playlist.length > 0
          ? snapshot.playlist.findIndex((entry) => entry === snapshot.videoId)
          : -1;

      if (resolvedIndex < 0) {
        return snapshot;
      }

      return {
        ...snapshot,
        playlistIndex: resolvedIndex,
      };
    }

    function disableShuffle(player: ExtendedPlayer) {
      try {
        player.setShuffle(false);
      } catch (error) {
        console.warn("YouTube playlist shuffle could not be disabled.", error);
      }
    }

    function movePlaylist(player: ExtendedPlayer, step: 1 | -1) {
      const snapshot = resolvePlaylistPosition(player);
      const { playlist, playlistIndex } = snapshot;

      if (playlistIndex >= 0 && playlist.length > 0) {
        if (step > 0) {
          const nextIndex = (playlistIndex + 1) % playlist.length;
          player.playVideoAt(nextIndex);
          return;
        }

        const previousIndex = (playlistIndex - 1 + playlist.length) % playlist.length;
        player.playVideoAt(previousIndex);
        return;
      }

      if (source.playlistId) {
        player.loadPlaylist({
          list: source.playlistId,
          listType: "playlist",
          index: 0,
        });
        disableShuffle(player);

        if (step > 0) {
          startPlayback(player);
        } else {
          player.seekTo(0, true);
        }

        return;
      }

      if (step > 0) {
        player.nextVideo();
      } else {
        player.previousVideo();
      }
    }

    function applySource(player: YT.Player, rawUrl: string) {
      const parsed = parseYouTubeSource(rawUrl);

      if (parsed.playlistId) {
        player.loadPlaylist({
          list: parsed.playlistId,
          listType: "playlist",
        });
        disableShuffle(player as ExtendedPlayer);
        return;
      }

      if (parsed.videoId) {
        player.loadVideoById(parsed.videoId);
      }
    }

    function restoreAudio(player: ExtendedPlayer) {
      try {
        if (!player.isMuted() && player.getVolume() > 0 && !autoplayUnmutePendingRef.current) {
          return;
        }

        player.unMute();
        player.setVolume(volumeRef.current);
        autoplayUnmutePendingRef.current = false;
        syncTrack({ isMuted: false });
      } catch (error) {
        console.warn("YouTube player could not restore audio.", error);
      }
    }

    function startPlayback(player: ExtendedPlayer) {
      let attempts = 0;
      let longRetryQueued = false;

      const attempt = () => {
        if (cancelled || !playerRef.current) {
          return;
        }

        try {
          const state = player.getPlayerState();
          if (state === window.YT?.PlayerState.PLAYING) {
            if (playbackRetryTimerRef.current !== null) {
              window.clearTimeout(playbackRetryTimerRef.current);
              playbackRetryTimerRef.current = null;
            }
            return;
          }

          player.playVideo();
          attempts += 1;

          if (attempts < 6 && !cancelled) {
            playbackRetryTimerRef.current = window.setTimeout(attempt, 220);
            return;
          }

          if (!longRetryQueued && !cancelled) {
            longRetryQueued = true;
            playbackRetryTimerRef.current = window.setTimeout(attempt, 3000);
          }
        } catch (error) {
          console.warn("YouTube playback bootstrap failed.", error);
        }
      };

      if (playbackRetryTimerRef.current !== null) {
        window.clearTimeout(playbackRetryTimerRef.current);
      }

      attempt();
    }

    // Safety timeout
    safetyTimeoutRef.current = window.setTimeout(() => {
      if (!cancelled && !resolved) {
        console.warn("YouTube engine timed out — proceeding without music.");
        setPlayerReady(true);
        markResolved();
      }
    }, 8000);

    async function boot() {
      if (isInitializedRef.current) {
        return;
      }

      isInitializedRef.current = true;

      try {
        const api = await loadYouTubeApi();
        if (cancelled || !hostRef.current) {
          isInitializedRef.current = false;
          return;
        }

        playlistFallbackAttemptedRef.current = false;
        defaultFallbackAttemptedRef.current = false;

        const playerVars = {
          autoplay: 1,
          controls: 0,
          disablekb: 1,
          fs: 0,
          enablejsapi: 1,
          modestbranding: 1,
          playsinline: 1,
          rel: 0,
          iv_load_policy: 3,
          origin: window.location.origin.replace(/\/$/, ""),
          widget_referrer: window.location.href,
        } as YT.PlayerOptions["playerVars"] & { widget_referrer?: string };

        const playerConfig: YT.PlayerOptions = {
          height: "200",
          width: "200",
          playerVars,
          events: {
            onReady: (event) => {
              if (cancelled) {
                return;
              }

              const player = event.target as ExtendedPlayer;
              console.warn("YouTube player ready");
              markResolved();
              playerRef.current = player;
              previousTimeRef.current = player.getCurrentTime();

              const shouldRestoreAudio = () =>
                autoplayUnmutePendingRef.current || player.isMuted() || player.getVolume() === 0;

              if (source.playlistId) {
                disableShuffle(player);

                if (readPlaylist(player).length === 0) {
                  player.loadPlaylist({
                    list: source.playlistId,
                    listType: "playlist",
                    index: 0,
                  });
                  disableShuffle(player);
                }
              }

              autoplayUnmutePendingRef.current = true;

              try {
                player.setVolume(0);
                player.mute();
              } catch (error) {
                console.warn("YouTube mute bootstrap failed.", error);
              }

              console.warn("Registering YouTube player controls");
              registerControls({
                play: () => {
                  console.warn("Play command called");
                  if (shouldRestoreAudio()) {
                    restoreAudio(player);
                  }

                  player.playVideo();
                },
                pause: () => {
                  console.warn("Pause command called");
                  player.pauseVideo();
                },
                toggle: () => {
                  console.warn("Toggle command called");
                  const state = player.getPlayerState();
                  console.warn("Current player state:", state);
                  if (state === window.YT?.PlayerState.PLAYING) {
                    if (shouldRestoreAudio()) {
                      restoreAudio(player);
                      return;
                    }

                    player.pauseVideo();
                    return;
                  }

                  if (shouldRestoreAudio()) {
                    restoreAudio(player);
                  }

                  player.playVideo();
                },
                next: () => movePlaylist(player, 1),
                previous: () => movePlaylist(player, -1),
                setVolume: (nextVolume) => {
                  player.setVolume(nextVolume);
                },
                seekTo: (seconds) => {
                  player.seekTo(seconds, true);
                },
                load: (url) => applySource(player, url),
                mute: (mute) => {
                  if (mute) {
                    player.mute();
                    return;
                  }
                  player.unMute();
                },
              });

              setPlayerReady(true);

              const snapshot = readCurrentTrack(player);

              syncTrack({
                title: snapshot.title ?? undefined,
                videoId: snapshot.videoId,
                currentTime: snapshot.currentTime,
                duration: snapshot.duration,
                isMuted: true,
              });

              startPlayback(player);
              sourceRef.current = source.rawUrl;
            },
            onStateChange: (event) => {
              const player = event.target as ExtendedPlayer;
              try {
                const playing = event.data === window.YT?.PlayerState.PLAYING;

                if (playbackRetryTimerRef.current !== null && playing) {
                  window.clearTimeout(playbackRetryTimerRef.current);
                  playbackRetryTimerRef.current = null;
                }

                if (event.data === window.YT?.PlayerState.ENDED) {
                  if (source.playlistId) {
                    movePlaylist(player, 1);
                    return;
                  }

                  previousTimeRef.current = 0;
                  syncTrack({
                    isPlaying: true,
                    currentTime: 0,
                  });
                  player.seekTo(0, true);
                  player.playVideo();
                  return;
                }

                if (playing && autoplayUnmutePendingRef.current && playerRef.current) {
                  restoreAudio(playerRef.current as ExtendedPlayer);
                }

                if (event.data === window.YT?.PlayerState.PLAYING || event.data === window.YT?.PlayerState.BUFFERING) {
                  const snapshot = readCurrentTrack(player);
                  syncTrack({
                    title: snapshot.title ?? undefined,
                    videoId: snapshot.videoId,
                    currentTime: snapshot.currentTime,
                    duration: snapshot.duration,
                    isPlaying: playing,
                  });
                  setVisualLevel(
                    deriveEnergy(snapshot.currentTime, playing, volumeRef.current, Math.max(0, snapshot.currentTime - previousTimeRef.current))
                  );
                  previousTimeRef.current = snapshot.currentTime;
                  return;
                }

                syncTrack({ isPlaying: playing });
              } catch (error) {
                console.warn("YouTube state change handling failed.", error);
              }
            },
            onError: () => {
              markResolved();
              autoplayUnmutePendingRef.current = false;
              if (playbackRetryTimerRef.current !== null) {
                window.clearTimeout(playbackRetryTimerRef.current);
                playbackRetryTimerRef.current = null;
              }

              const fallbackVideoId = extractYouTubeVideoId(source.rawUrl);
              if (source.playlistId && fallbackVideoId && !playlistFallbackAttemptedRef.current) {
                playlistFallbackAttemptedRef.current = true;
                try {
                  playerRef.current?.loadVideoById(fallbackVideoId);
                  playerRef.current?.mute();
                  playerRef.current?.setVolume(0);
                  autoplayUnmutePendingRef.current = true;
                  startPlayback(playerRef.current as ExtendedPlayer);
                  return;
                } catch (error) {
                  console.warn("YouTube playlist fallback failed.", error);
                }
              }

              if (source.rawUrl !== DEFAULT_MUSIC_URL && !defaultFallbackAttemptedRef.current) {
                defaultFallbackAttemptedRef.current = true;
                try {
                  loadMusicUrl(DEFAULT_MUSIC_URL);
                  return;
                } catch (error) {
                  console.warn("YouTube default-track fallback failed.", error);
                }
              }

              setPlayerError("Music unavailable");
            },
          },
        };

        if (source.playlistId) {
          playerConfig.playerVars = {
            ...playerConfig.playerVars,
            list: source.playlistId,
            listType: "playlist",
          };
        } else if (source.videoId) {
          playerConfig.videoId = source.videoId;
        }

        playerRef.current = new api.Player(hostRef.current, playerConfig);

        // Progress tracking interval
        pollIntervalRef.current = window.setInterval(() => {
          if (!playerRef.current) {
            return;
          }

          try {
            const player = playerRef.current as ExtendedPlayer;
            const state = player.getPlayerState();
            const snapshot = readCurrentTrack(player);
            const deltaTime = Math.max(0, snapshot.currentTime - previousTimeRef.current);
            previousTimeRef.current = snapshot.currentTime;
            const isPlaying = state === window.YT?.PlayerState.PLAYING;
            const targetEnergy = deriveEnergy(snapshot.currentTime, isPlaying, volumeRef.current, deltaTime);

            const smoothingFactor = 0.35;
            smoothedEnergyRef.current = smoothedEnergyRef.current + (targetEnergy - smoothedEnergyRef.current) * smoothingFactor;

            syncTrack({
              title: snapshot.title ?? undefined,
              videoId: snapshot.videoId,
              isPlaying,
              currentTime: snapshot.currentTime,
              duration: snapshot.duration,
            });
            setVisualLevel(smoothedEnergyRef.current);
          } catch (error) {
            console.warn("YouTube poll loop failed.", error);
          }
        }, 1000);
      } catch (error) {
        console.warn("YouTube IFrame API failed to initialize.", error);
        markResolved();
        autoplayUnmutePendingRef.current = false;
        setPlayerError("Music unavailable");
      }
    }

    boot();

    return () => {
      cancelled = true;
      isInitializedRef.current = false;
      if (safetyTimeoutRef.current !== null) {
        window.clearTimeout(safetyTimeoutRef.current);
      }
      if (pollIntervalRef.current) {
        window.clearInterval(pollIntervalRef.current);
      }
      if (playbackRetryTimerRef.current !== null) {
        window.clearTimeout(playbackRetryTimerRef.current);
        playbackRetryTimerRef.current = null;
      }
      playerRef.current?.destroy();
      playerRef.current = null;
    };
  }, [source.playlistId, source.rawUrl, registerControls, loadMusicUrl, setPlayerReady, setPlayerError, syncTrack, setVisualLevel]);

  // Source change handler
  useEffect(() => {
    if (!playerRef.current || sourceRef.current === source.rawUrl) {
      return;
    }

    sourceRef.current = source.rawUrl;
    const player = playerRef.current;

    if (source.playlistId) {
      player.loadPlaylist({
        list: source.playlistId,
        listType: "playlist",
      });
      return;
    }

    if (source.videoId) {
      player.loadVideoById(source.videoId);
    }
  }, [source.playlistId, source.rawUrl]);

  const progress = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;
  const takeoverFade = clamp((footerTakeover - 0.52) / 0.26, 0, 1);
  const takeoverDepth = footerTakeover * footerTakeover;
  const takeoverBlur = takeoverFade * 8;
  const takeoverFilter = `blur(${takeoverBlur}px)`;
  const cardProgress = clamp((footerTakeover - 0.64) / 0.36, 0, 1);

  const renderArtwork = () =>
    thumbnail ? (
      <Image
        alt={title}
        fill
        className="object-cover object-[50%_42%] scale-[1.06]"
        sizes="96px"
        src={thumbnail}
        unoptimized
      />
    ) : (
      <div className="h-full w-full bg-[radial-gradient(circle_at_top,rgba(var(--accent-rgb),0.34),rgba(var(--lavender-rgb),0.12))]" />
    );

  // Standalone layout
  const renderStandaloneLayout = () => (
    <motion.div
      ref={hoverRef}
      className="relative"
      style={{
        perspective: "900px",
        transformStyle: "preserve-3d",
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <motion.div
        className="overflow-hidden bg-[rgba(10,10,14,0.42)] shadow-[0_18px_60px_rgba(5,5,8,0.3),0_0_0_1px_rgba(var(--glass-border-rgb),0.1)] backdrop-blur-2xl"
        style={{
          rotateX,
          rotateY,
          transformStyle: "preserve-3d",
        }}
      >
        <button
          aria-label={isMinimized ? "Expand player" : "Minimize player"}
          className="glass-button-muted absolute right-3 top-3 z-10 h-9 w-9 rounded-full p-0 pointer-events-auto"
          onClick={() => setIsMinimized((current) => !current)}
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
              <motion.div
                className="animate-spin relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-[rgba(10,10,14,0.42)] shadow-[0_18px_50px_rgba(5,5,8,0.24)] sm:h-[5.5rem] sm:w-[5.5rem]"
                style={{
                  animationDuration: "14s",
                  animationPlayState: isPlaying ? "running" : "paused",
                }}
              >
                <div className="absolute inset-[-14px] pointer-events-none">
                  <svg aria-hidden="true" className="h-full w-full overflow-visible" viewBox="0 0 108 108">
                    {Array.from({ length: WAVEFORM_BAR_COUNT }, (_, index) => {
                      const angle = (index / WAVEFORM_BAR_COUNT) * 360;

                      return (
                        <line
                          key={angle}
                          ref={(node) => {
                            waveformBarRefs.current[index] = node;
                          }}
                          stroke="rgba(var(--accent-rgb), 0.28)"
                          strokeLinecap="round"
                          strokeWidth="1.8"
                          transform={`rotate(${angle} ${WAVEFORM_CENTER} ${WAVEFORM_CENTER})`}
                          x1={WAVEFORM_CENTER}
                          x2={WAVEFORM_CENTER}
                          y1={WAVEFORM_CENTER - WAVEFORM_RING_RADIUS}
                          y2={WAVEFORM_CENTER - WAVEFORM_RING_RADIUS - 2}
                        />
                      );
                    })}
                  </svg>
                </div>
                <div className="absolute inset-2 overflow-hidden rounded-full">{renderArtwork()}</div>
                <div className="absolute inset-[2px] rounded-full shadow-[inset_0_1px_0_rgba(255,255,255,0.16)]" />
                <div className="absolute inset-[38%] rounded-full bg-[rgba(255,255,255,0.12)] shadow-[inset_0_1px_0_rgba(255,255,255,0.24)]" />
              </motion.div>

              <div className="flex items-center gap-1.5">
                <button className="glass-button-muted h-8 w-8 rounded-full p-0 pointer-events-auto" onClick={playPrevious} type="button">
                  <SkipBack className="h-3.5 w-3.5" />
                </button>
                <button className="glass-button h-9 w-9 rounded-full p-0 pointer-events-auto" onClick={togglePlayback} type="button">
                  {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </button>
                <button className="glass-button-muted h-8 w-8 rounded-full p-0 pointer-events-auto" onClick={playNext} type="button">
                  <SkipForward className="h-3.5 w-3.5" />
                </button>
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
              <div className="flex items-center gap-3">
                <div className="relative h-16 w-16 overflow-hidden rounded-[22px] bg-[rgba(10,10,14,0.34)] sm:h-20 sm:w-20">
                  {renderArtwork()}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-[10px] uppercase tracking-[0.28em] text-ink/50">Powered by YouTube</p>
                  <p className="mt-1 line-clamp-2 text-sm font-semibold text-ink">
                    {engineStatus === "error" ? errorMessage : title}
                  </p>
                  <div className="mt-3 flex items-center gap-2">
                    <button className="glass-button-muted h-9 w-9 rounded-full p-0 pointer-events-auto sm:h-10 sm:w-10" onClick={playPrevious} type="button">
                      <SkipBack className="h-4 w-4" />
                    </button>
                    <button className="glass-button h-9 w-9 rounded-full p-0 pointer-events-auto sm:h-10 sm:w-10" onClick={togglePlayback} type="button">
                      {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    </button>
                    <button className="glass-button-muted h-9 w-9 rounded-full p-0 pointer-events-auto sm:h-10 sm:w-10" onClick={playNext} type="button">
                      <SkipForward className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-3 space-y-2">
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
                  onChange={(event) => seekTo(Number(event.target.value))}
                  style={{
                    background: `linear-gradient(90deg, rgb(var(--accent-rgb)) 0%, rgb(var(--accent-rgb)) ${progress}%, rgba(255,255,255,0.22) ${progress}%, rgba(255,255,255,0.22) 100%)`,
                  }}
                  step={0.1}
                  type="range"
                  value={duration > 0 ? Math.min(currentTime, duration) : 0}
                />
              </div>

              <div className="mt-3 flex items-center gap-3">
                <button
                  className="glass-button-muted h-9 w-9 rounded-full p-0 pointer-events-auto sm:h-10 sm:w-10"
                  onClick={() => {
                    if (isMuted || volume === 0) {
                      unmute();
                      if (volume === 0) {
                        setVolume(50);
                      }
                      return;
                    }
                    mute();
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
                  onChange={(event) => setVolume(Number(event.target.value))}
                  style={{
                    background: `linear-gradient(90deg, rgb(var(--accent-rgb)) 0%, rgb(var(--accent-rgb)) ${volume}%, rgba(255,255,255,0.22) ${volume}%, rgba(255,255,255,0.22) 100%)`,
                  }}
                  type="range"
                  value={volume}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );

  // Footer-merged layout
  const renderFooterLayout = () => {
    const { energy } = useMusicFrequency();

    return (
      <motion.div
        ref={hoverRef}
        className="relative"
        style={{
          perspective: "725px",
          transformStyle: "preserve-3d",
        }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <motion.div
          className="relative overflow-hidden rounded-[30px] border border-white/10 bg-[rgba(10,10,14,0.4)] p-4 shadow-[0_24px_90px_rgba(5,5,8,0.28)] backdrop-blur-2xl"
          style={{
            rotateX: useSpring(useTransform(mouseY, [-0.5, 0.5], [8, -8]), { stiffness: 240, damping: 24 }),
            rotateY: useSpring(useTransform(mouseX, [-0.5, 0.5], [-8, 8]), { stiffness: 260, damping: 24 }),
            transformStyle: "preserve-3d",
          }}
        >
          <div className="grid gap-4 md:grid-cols-[1.1fr_1fr]">
            <div className="relative min-h-[260px] overflow-hidden rounded-[24px] bg-[rgba(10,10,14,0.34)]">
              {renderArtwork()}
            </div>

            <div className="flex flex-col justify-between gap-6 rounded-[24px] bg-[rgba(10,10,14,0.32)] p-5">
              <div>
                <p className="text-[10px] uppercase tracking-[0.28em] text-ink/56">Immersive music zone</p>
                <h3 className="mt-2 text-2xl font-semibold text-ink">{title}</h3>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button className="glass-button-muted h-12 w-12 rounded-full p-0 pointer-events-auto" onClick={playPrevious} type="button">
                  <SkipBack className="h-4 w-4" />
                </button>
                <button className="glass-button h-12 w-12 rounded-full p-0 pointer-events-auto" onClick={togglePlayback} type="button">
                  {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </button>
                <button className="glass-button-muted h-12 w-12 rounded-full p-0 pointer-events-auto" onClick={playNext} type="button">
                  <SkipForward className="h-4 w-4" />
                </button>
              </div>

              {/* Visualizer bar */}
              <div className="flex items-end gap-[3px] h-8">
                {Array.from({ length: 24 }).map((_, i) => {
                  const phase = (i / 24) * Math.PI * 2;
                  const barEnergy = isPlaying ? energy * (0.3 + Math.sin(phase + performance.now() / 200) * 0.7) : 0.05;
                  const height = 4 + barEnergy * 28;
                  return (
                    <div
                      key={i}
                      className="w-1.5 rounded-full bg-gradient-to-t from-[rgba(var(--accent-rgb),0.4)] to-[rgba(var(--teal-rgb),0.6)]"
                      style={{
                        height: `${Math.min(32, Math.max(4, height))}px`,
                        opacity: 0.3 + barEnergy * 0.7,
                        transition: 'height 0.1s ease-out',
                      }}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    );
  };

  return (
    <>
      {/* Hidden YouTube iframe */}
      <div
        ref={hostRef}
        className="pointer-events-none absolute left-0 top-0 h-[200px] w-[200px] opacity-0"
        style={{ position: 'absolute', zIndex: -1 }}
      />

      {/* Conditional rendering based on footer takeover */}
      {footerTakeover <= 0.72 ? (
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
            x: footerTakeover * (isMinimized ? -22 : -34),
            y: takeoverDepth * (isMinimized ? 360 : 480),
            scale: 1 + takeoverDepth * 0.24,
            rotate: takeoverDepth * -3,
          }}
          style={{ filter: takeoverFilter }}
          transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
        >
          {renderStandaloneLayout()}
        </motion.div>
      ) : (
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
          {renderFooterLayout()}
        </motion.div>
      )}
    </>
  );
}
