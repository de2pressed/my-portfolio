"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

import { useMusic } from "@/context/MusicContext";
import { DEFAULT_MUSIC_URL } from "@/lib/seed-data";
import { extractYouTubeVideoId, parseYouTubeSource, type ParsedYouTubeSource } from "@/lib/youtube";

declare global {
  interface Window {
    YT?: typeof YT;
    onYouTubeIframeAPIReady?: () => void;
    __youtubeApiReadyPromise__?: Promise<typeof YT>;
  }
}

type ExtendedPlayer = YT.Player & {
  getIframe?: () => HTMLIFrameElement;
  getPlaylist?: () => string[];
  getPlaylistIndex?: () => number;
  getVideoData?: () => {
    title: string;
    video_id: string;
  };
  getVideoUrl?: () => string;
  getVolume?: () => number;
  isMuted?: () => boolean;
  playVideoAt?: (index: number) => void;
  setShuffle?: (shuffle: boolean) => void;
};

function loadYouTubeApi() {
  if (window.YT?.Player) {
    return Promise.resolve(window.YT);
  }

  if (window.__youtubeApiReadyPromise__) {
    return window.__youtubeApiReadyPromise__;
  }

  window.__youtubeApiReadyPromise__ = new Promise<typeof YT>((resolve) => {
    const previousReady = window.onYouTubeIframeAPIReady;

    window.onYouTubeIframeAPIReady = () => {
      previousReady?.();
      resolve(window.YT as typeof YT);
    };

    if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
      const script = document.createElement("script");
      script.src = "https://www.youtube.com/iframe_api";
      script.async = true;
      document.body.appendChild(script);
    }
  });

  return window.__youtubeApiReadyPromise__;
}

function safeRead<T>(reader: () => T, fallback: T) {
  try {
    return reader();
  } catch {
    return fallback;
  }
}

function getPlayerIframe(player: ExtendedPlayer | null) {
  if (!player || typeof player.getIframe !== "function") {
    return null;
  }

  return safeRead(() => player.getIframe?.() ?? null, null);
}

function isPlayerOperational(player: ExtendedPlayer | null, host: HTMLDivElement | null) {
  if (!player || !host) {
    return false;
  }

  const iframe = getPlayerIframe(player);
  return Boolean(iframe && iframe.src && host.contains(iframe) && iframe.ownerDocument?.body?.contains(iframe));
}

function readCurrentTime(player: ExtendedPlayer) {
  return typeof player.getCurrentTime === "function" ? safeRead(() => player.getCurrentTime(), 0) : 0;
}

function readDuration(player: ExtendedPlayer) {
  return typeof player.getDuration === "function" ? safeRead(() => player.getDuration(), 0) : 0;
}

function readPlaylist(player: ExtendedPlayer) {
  return typeof player.getPlaylist === "function" ? safeRead(() => player.getPlaylist?.() ?? [], []) : [];
}

function readPlaylistIndex(player: ExtendedPlayer) {
  return typeof player.getPlaylistIndex === "function" ? safeRead(() => player.getPlaylistIndex?.() ?? -1, -1) : -1;
}

function readVideoData(player: ExtendedPlayer) {
  return typeof player.getVideoData === "function" ? safeRead(() => player.getVideoData?.() ?? null, null) : null;
}

function readVideoUrl(player: ExtendedPlayer) {
  return typeof player.getVideoUrl === "function" ? safeRead(() => player.getVideoUrl?.() ?? "", "") : "";
}

function readTrackSnapshot(player: ExtendedPlayer, source: ParsedYouTubeSource) {
  const playlist = readPlaylist(player);
  const playlistIndex = readPlaylistIndex(player);
  const videoData = readVideoData(player);
  const videoIdFromPlaylist = playlistIndex >= 0 ? playlist[playlistIndex] ?? null : null;
  const videoIdFromUrl = extractYouTubeVideoId(readVideoUrl(player));
  const fallbackVideoId = source.videoId ?? extractYouTubeVideoId(source.rawUrl);

  return {
    title: videoData?.title?.trim() || null,
    videoId: videoData?.video_id || videoIdFromPlaylist || videoIdFromUrl || fallbackVideoId || null,
    currentTime: readCurrentTime(player),
    duration: readDuration(player),
    playlist,
    playlistIndex,
  };
}

function resolvePlaylistPosition(player: ExtendedPlayer, source: ParsedYouTubeSource) {
  const snapshot = readTrackSnapshot(player, source);

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

function getFallbackTitle(source: ParsedYouTubeSource) {
  return source.playlistId ? "Playlist soundtrack" : "Untitled soundtrack";
}

function clearHostElement(host: HTMLDivElement | null) {
  if (!host) {
    return;
  }

  while (host.firstChild) {
    host.removeChild(host.firstChild);
  }
}

export function YouTubeEngine() {
  const {
    source,
    registerControls,
    loadMusicUrl,
    setPlayerReady,
    setPlayerError,
    syncTrack,
    setVisualLevel,
    volume,
  } = useMusic();
  const pathname = usePathname();
  const hostRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<ExtendedPlayer | null>(null);
  const sourceRef = useRef(source.rawUrl);
  const parsedSourceRef = useRef(source);
  const volumeRef = useRef(volume);
  const previousTimeRef = useRef(0);
  const autoplayUnmutePendingRef = useRef(false);
  const playbackRetryTimerRef = useRef<number | null>(null);
  const playlistFallbackAttemptedRef = useRef(false);
  const defaultFallbackAttemptedRef = useRef(false);
  const smoothedEnergyRef = useRef(0.08);
  const energyHistoryRef = useRef<number[]>([]);
  const loadSourceRef = useRef<(rawUrl: string) => void>(() => {});

  useEffect(() => {
    parsedSourceRef.current = source;
  }, [source]);

  useEffect(() => {
    volumeRef.current = volume;
  }, [volume]);

  useEffect(() => {
    let cancelled = false;
    let pollInterval = 0;
    let resolved = false;

    function markResolved() {
      resolved = true;
    }

    function clearPlaybackRetry() {
      if (playbackRetryTimerRef.current !== null) {
        window.clearTimeout(playbackRetryTimerRef.current);
        playbackRetryTimerRef.current = null;
      }
    }

    function destroyActivePlayer() {
      clearPlaybackRetry();
      autoplayUnmutePendingRef.current = false;

      const activePlayer = playerRef.current;
      playerRef.current = null;

      if (activePlayer) {
        try {
          activePlayer.destroy();
        } catch (error) {
          console.warn("Failed to destroy YouTube player.", error);
        }
      }

      clearHostElement(hostRef.current);
    }

    function syncSnapshot(player: ExtendedPlayer, isPlaying: boolean) {
      const currentSource = parsedSourceRef.current;
      const snapshot = readTrackSnapshot(player, currentSource);

      syncTrack({
        title: snapshot.title ?? getFallbackTitle(currentSource),
        videoId: snapshot.videoId,
        currentTime: snapshot.currentTime,
        duration: snapshot.duration,
        isPlaying,
        isMuted:
          typeof player.isMuted === "function"
            ? safeRead(() => player.isMuted?.() ?? false, false)
            : false,
      });
    }

    function disableShuffle(player: ExtendedPlayer) {
      if (!isPlayerOperational(player, hostRef.current) || typeof player.setShuffle !== "function") {
        return;
      }

      try {
        player.setShuffle(false);
      } catch (error) {
        console.warn("Failed to disable playlist shuffle.", error);
      }
    }

    function primePlayerForAutoplay(player: ExtendedPlayer) {
      if (!isPlayerOperational(player, hostRef.current)) {
        return;
      }

      try {
        player.setVolume(0);
        player.mute();
        autoplayUnmutePendingRef.current = true;
        syncTrack({ isMuted: true });
      } catch (error) {
        console.warn("YouTube mute bootstrap failed.", error);
      }
    }

    function shouldRestoreAudio(player: ExtendedPlayer) {
      if (autoplayUnmutePendingRef.current) {
        return true;
      }

      if (!isPlayerOperational(player, hostRef.current)) {
        return false;
      }

      const muted = typeof player.isMuted === "function" ? safeRead(() => player.isMuted?.() ?? false, false) : false;
      const currentVolume = typeof player.getVolume === "function" ? safeRead(() => player.getVolume?.() ?? 0, 0) : 0;
      return muted || currentVolume === 0;
    }

    function restoreAudio(player: ExtendedPlayer) {
      if (!isPlayerOperational(player, hostRef.current)) {
        return;
      }

      try {
        const nextVolume = volumeRef.current > 0 ? volumeRef.current : 62;
        player.unMute();
        player.setVolume(nextVolume);
        autoplayUnmutePendingRef.current = false;
        syncTrack({ isMuted: false });
      } catch (error) {
        console.warn("Failed to restore audio.", error);
      }
    }

    function startPlayback(player: ExtendedPlayer) {
      clearPlaybackRetry();

      let attempts = 0;
      let longRetryQueued = false;

      const attempt = () => {
        if (cancelled || playerRef.current !== player || !isPlayerOperational(player, hostRef.current)) {
          return;
        }

        const state = safeRead(() => player.getPlayerState(), -1);
        if (state === window.YT?.PlayerState.PLAYING) {
          clearPlaybackRetry();
          return;
        }

        try {
          player.playVideo();
        } catch (error) {
          console.warn("YouTube playback bootstrap failed.", error);
        }

        attempts += 1;

        if (attempts < 6 && !cancelled) {
          playbackRetryTimerRef.current = window.setTimeout(attempt, 220);
          return;
        }

        if (!longRetryQueued && !cancelled) {
          longRetryQueued = true;
          playbackRetryTimerRef.current = window.setTimeout(attempt, 3000);
        }
      };

      attempt();
    }

    function loadParsedSource(player: ExtendedPlayer, parsed: ParsedYouTubeSource, rawUrl: string) {
      if (!isPlayerOperational(player, hostRef.current)) {
        return;
      }

      playlistFallbackAttemptedRef.current = false;
      defaultFallbackAttemptedRef.current = false;
      previousTimeRef.current = 0;

      const fallbackVideoId = parsed.videoId ?? extractYouTubeVideoId(rawUrl);
      syncTrack({
        title: parsed.playlistId ? "Loading playlist..." : "Loading soundtrack...",
        videoId: fallbackVideoId ?? null,
        currentTime: 0,
        duration: 0,
        isPlaying: false,
      });

      try {
        if (parsed.playlistId) {
          player.loadPlaylist({
            list: parsed.playlistId,
            listType: "playlist",
            index: 0,
          });
          disableShuffle(player);
          primePlayerForAutoplay(player);
          startPlayback(player);
          return;
        }

        if (fallbackVideoId) {
          player.loadVideoById(fallbackVideoId);
          primePlayerForAutoplay(player);
          startPlayback(player);
          return;
        }

        setPlayerError("Invalid YouTube URL");
      } catch (error) {
        console.warn("Failed to load YouTube source.", error);
        setPlayerError("Music unavailable");
      }
    }

    function movePlaylist(player: ExtendedPlayer, step: 1 | -1) {
      if (!isPlayerOperational(player, hostRef.current)) {
        return;
      }

      const currentSource = parsedSourceRef.current;
      const snapshot = resolvePlaylistPosition(player, currentSource);
      const { playlist, playlistIndex } = snapshot;

      if (playlistIndex >= 0 && playlist.length > 0 && typeof player.playVideoAt === "function") {
        const targetIndex =
          step > 0
            ? (playlistIndex + 1) % playlist.length
            : (playlistIndex - 1 + playlist.length) % playlist.length;

        try {
          player.playVideoAt(targetIndex);
          return;
        } catch (error) {
          console.warn("Failed to move within playlist.", error);
        }
      }

      if (currentSource.playlistId) {
        try {
          player.loadPlaylist({
            list: currentSource.playlistId,
            listType: "playlist",
            index: step > 0 ? 0 : undefined,
          });
          disableShuffle(player);

          if (step < 0) {
            player.seekTo(0, true);
          }

          startPlayback(player);
          return;
        } catch (error) {
          console.warn("Failed to recover playlist queue.", error);
        }
      }

      try {
        if (step > 0) {
          player.nextVideo();
        } else {
          player.previousVideo();
        }
      } catch (error) {
        console.warn("Failed to change track.", error);
      }
    }

    loadSourceRef.current = (rawUrl: string) => {
      const player = playerRef.current;
      if (!player) {
        return;
      }

      const parsed = parseYouTubeSource(rawUrl);
      parsedSourceRef.current = parsed;
      sourceRef.current = rawUrl;
      loadParsedSource(player, parsed, rawUrl);
    };

    const safetyTimeout = window.setTimeout(() => {
      if (cancelled || resolved) {
        return;
      }

      markResolved();
      setPlayerReady(true);
    }, 8000);

    async function boot() {
      try {
        const api = await loadYouTubeApi();
        if (cancelled || !hostRef.current || !document.body.contains(hostRef.current)) {
          return;
        }

        destroyActivePlayer();

        const currentSource = parsedSourceRef.current;
        const bootSourceRawUrl = currentSource.rawUrl;
        const fallbackVideoId = currentSource.videoId ?? extractYouTubeVideoId(currentSource.rawUrl);

        if (!currentSource.playlistId && !fallbackVideoId) {
          markResolved();
          setPlayerError("Invalid YouTube URL");
          return;
        }

        const playerVars: YT.PlayerVars = {
          autoplay: 1,
          controls: 0,
          disablekb: 1,
          enablejsapi: 1,
          fs: 0,
          iv_load_policy: 3,
          modestbranding: 1,
          origin: window.location.origin,
          playsinline: 1,
          rel: 0,
        };

        if (currentSource.playlistId) {
          playerVars.list = currentSource.playlistId;
          playerVars.listType = "playlist";
        }

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
              playerRef.current = player;
              sourceRef.current = parsedSourceRef.current.rawUrl;
              previousTimeRef.current = readCurrentTime(player);
              markResolved();

              registerControls({
                play: () => {
                  const activePlayer = playerRef.current;
                  if (!activePlayer || !isPlayerOperational(activePlayer, hostRef.current)) {
                    return;
                  }

                  if (shouldRestoreAudio(activePlayer)) {
                    restoreAudio(activePlayer);
                  }

                  try {
                    activePlayer.playVideo();
                  } catch (error) {
                    console.warn("Failed to play video.", error);
                  }
                },
                pause: () => {
                  const activePlayer = playerRef.current;
                  if (!activePlayer || !isPlayerOperational(activePlayer, hostRef.current)) {
                    return;
                  }

                  try {
                    activePlayer.pauseVideo();
                  } catch (error) {
                    console.warn("Failed to pause video.", error);
                  }
                },
                toggle: () => {
                  const activePlayer = playerRef.current;
                  if (!activePlayer || !isPlayerOperational(activePlayer, hostRef.current)) {
                    return;
                  }

                  const state = safeRead(() => activePlayer.getPlayerState(), -1);
                  if (state === window.YT?.PlayerState.PLAYING) {
                    if (shouldRestoreAudio(activePlayer)) {
                      restoreAudio(activePlayer);
                      return;
                    }

                    try {
                      activePlayer.pauseVideo();
                    } catch (error) {
                      console.warn("Failed to toggle pause.", error);
                    }
                    return;
                  }

                  if (shouldRestoreAudio(activePlayer)) {
                    restoreAudio(activePlayer);
                  }

                  try {
                    activePlayer.playVideo();
                  } catch (error) {
                    console.warn("Failed to toggle playback.", error);
                  }
                },
                next: () => {
                  const activePlayer = playerRef.current;
                  if (!activePlayer) {
                    return;
                  }

                  movePlaylist(activePlayer, 1);
                },
                previous: () => {
                  const activePlayer = playerRef.current;
                  if (!activePlayer) {
                    return;
                  }

                  movePlaylist(activePlayer, -1);
                },
                setVolume: (nextVolume) => {
                  const activePlayer = playerRef.current;
                  if (!activePlayer || !isPlayerOperational(activePlayer, hostRef.current)) {
                    return;
                  }

                  try {
                    if (nextVolume <= 0) {
                      activePlayer.setVolume(0);
                      activePlayer.mute();
                      syncTrack({ isMuted: true });
                      return;
                    }

                    activePlayer.unMute();
                    activePlayer.setVolume(nextVolume);
                    autoplayUnmutePendingRef.current = false;
                    syncTrack({ isMuted: false });
                  } catch (error) {
                    console.warn("Failed to update volume.", error);
                  }
                },
                seekTo: (seconds) => {
                  const activePlayer = playerRef.current;
                  if (!activePlayer || !isPlayerOperational(activePlayer, hostRef.current)) {
                    return;
                  }

                  try {
                    activePlayer.seekTo(seconds, true);
                  } catch (error) {
                    console.warn("Failed to seek track.", error);
                  }
                },
                load: (rawUrl) => {
                  loadSourceRef.current(rawUrl);
                },
                mute: (mutePlayer) => {
                  const activePlayer = playerRef.current;
                  if (!activePlayer || !isPlayerOperational(activePlayer, hostRef.current)) {
                    return;
                  }

                  try {
                    if (mutePlayer) {
                      activePlayer.mute();
                      syncTrack({ isMuted: true });
                      return;
                    }

                    restoreAudio(activePlayer);
                  } catch (error) {
                    console.warn("Failed to update mute state.", error);
                  }
                },
              });

              setPlayerReady(true);
              syncSnapshot(player, false);

              if (parsedSourceRef.current.rawUrl !== bootSourceRawUrl) {
                loadParsedSource(player, parsedSourceRef.current, parsedSourceRef.current.rawUrl);
                return;
              }

              if (parsedSourceRef.current.playlistId) {
                disableShuffle(player);

                if (readPlaylist(player).length === 0) {
                  loadParsedSource(player, parsedSourceRef.current, parsedSourceRef.current.rawUrl);
                  return;
                }
              }

              primePlayerForAutoplay(player);
              startPlayback(player);
            },
            onStateChange: (event) => {
              if (cancelled) {
                return;
              }

              const player = event.target as ExtendedPlayer;
              const isPlaying = event.data === window.YT?.PlayerState.PLAYING;

              if (isPlaying) {
                clearPlaybackRetry();
              }

              if (event.data === window.YT?.PlayerState.ENDED) {
                if (parsedSourceRef.current.playlistId) {
                  movePlaylist(player, 1);
                  return;
                }

                previousTimeRef.current = 0;
                syncTrack({
                  currentTime: 0,
                  isPlaying: true,
                });

                if (isPlayerOperational(player, hostRef.current)) {
                  try {
                    player.seekTo(0, true);
                    player.playVideo();
                  } catch (error) {
                    console.warn("Failed to loop current video.", error);
                  }
                }

                return;
              }

              if (isPlaying && autoplayUnmutePendingRef.current) {
                restoreAudio(player);
              }

              if (
                event.data === window.YT?.PlayerState.PLAYING ||
                event.data === window.YT?.PlayerState.BUFFERING ||
                event.data === window.YT?.PlayerState.PAUSED
              ) {
                syncSnapshot(player, isPlaying);
              }
            },
            onError: () => {
              if (cancelled) {
                return;
              }

              clearPlaybackRetry();
              autoplayUnmutePendingRef.current = false;
              markResolved();

              const activePlayer = playerRef.current;
              const currentSource = parsedSourceRef.current;
              const fallbackVideoId = extractYouTubeVideoId(currentSource.rawUrl);

              if (activePlayer && currentSource.playlistId && fallbackVideoId && !playlistFallbackAttemptedRef.current) {
                playlistFallbackAttemptedRef.current = true;

                try {
                  activePlayer.loadVideoById(fallbackVideoId);
                  primePlayerForAutoplay(activePlayer);
                  startPlayback(activePlayer);
                  return;
                } catch (error) {
                  console.warn("Playlist fallback failed.", error);
                }
              }

              if (currentSource.rawUrl !== DEFAULT_MUSIC_URL && !defaultFallbackAttemptedRef.current) {
                defaultFallbackAttemptedRef.current = true;
                loadMusicUrl(DEFAULT_MUSIC_URL);
                return;
              }

              setPlayerError("Music unavailable");
            },
          },
        };

        if (!currentSource.playlistId && fallbackVideoId) {
          playerConfig.videoId = fallbackVideoId;
        }

        playerRef.current = new api.Player(hostRef.current, playerConfig) as ExtendedPlayer;

        pollInterval = window.setInterval(() => {
          const activePlayer = playerRef.current;
          if (!activePlayer || !isPlayerOperational(activePlayer, hostRef.current)) {
            return;
          }

          const state = safeRead(() => activePlayer.getPlayerState(), -1);
          const snapshot = readTrackSnapshot(activePlayer, parsedSourceRef.current);
          const deltaTime = Math.max(0, snapshot.currentTime - previousTimeRef.current);
          previousTimeRef.current = snapshot.currentTime;

          syncTrack({
            title: snapshot.title ?? getFallbackTitle(parsedSourceRef.current),
            videoId: snapshot.videoId,
            currentTime: snapshot.currentTime,
            duration: snapshot.duration,
            isPlaying: state === window.YT?.PlayerState.PLAYING,
            isMuted:
              typeof activePlayer.isMuted === "function"
                ? safeRead(() => activePlayer.isMuted?.() ?? false, false)
                : false,
          });

          const progress = snapshot.duration > 0 ? snapshot.currentTime / snapshot.duration : 0;
          const bass = Math.abs(Math.sin(progress * Math.PI * 2));
          const mid = Math.abs(Math.sin(progress * Math.PI * 5));
          const high = Math.abs(Math.cos(progress * Math.PI * 10));
          const volumeFactor = Math.pow(Math.max(0, volumeRef.current) / 100, 1.5) * 0.4;
          const deltaFactor = Math.min(0.18, deltaTime * 0.1);
          const rawEnergy = state === window.YT?.PlayerState.PLAYING ? 0.12 + bass * 0.22 + mid * 0.16 + high * 0.1 + volumeFactor + deltaFactor : 0.06;

          energyHistoryRef.current.push(rawEnergy);
          if (energyHistoryRef.current.length > 5) {
            energyHistoryRef.current.shift();
          }

          const averagedEnergy =
            energyHistoryRef.current.reduce((sum, sample) => sum + sample, 0) / Math.max(1, energyHistoryRef.current.length);
          smoothedEnergyRef.current += (averagedEnergy - smoothedEnergyRef.current) * 0.05;
          setVisualLevel(Math.max(0.06, Math.min(0.94, smoothedEnergyRef.current)));
        }, 400);
      } catch (error) {
        markResolved();
        setPlayerError("Music unavailable");
        console.warn("YouTube IFrame API failed to initialize.", error);
      }
    }

    void boot();

    return () => {
      cancelled = true;
      window.clearTimeout(safetyTimeout);

      if (pollInterval) {
        window.clearInterval(pollInterval);
      }

      destroyActivePlayer();
    };
  }, [loadMusicUrl, registerControls, setPlayerError, setPlayerReady, setVisualLevel, syncTrack]);

  useEffect(() => {
    if (!playerRef.current || sourceRef.current === source.rawUrl) {
      return;
    }

    loadSourceRef.current(source.rawUrl);
  }, [source.rawUrl]);

  useEffect(() => {
    const player = playerRef.current;
    if (!player || pathname === "/" || !isPlayerOperational(player, hostRef.current)) {
      return;
    }

    try {
      player.pauseVideo();
    } catch (error) {
      console.warn("Failed to pause player off the public route.", error);
    }
  }, [pathname]);

  return (
    <div
      ref={hostRef}
      className="pointer-events-none fixed left-[-9999px] top-[-9999px] h-[200px] w-[200px] opacity-0"
    />
  );
}
