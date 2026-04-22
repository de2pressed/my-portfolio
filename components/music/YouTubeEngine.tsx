"use client";

import { useEffect, useRef } from "react";

import { useMusic } from "@/context/MusicContext";
import { DEFAULT_MUSIC_URL } from "@/lib/seed-data";
import { extractYouTubeVideoId, parseYouTubeSource } from "@/lib/youtube";

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

function sendPlayerCommand(player: ExtendedPlayer, func: string, args: unknown[] = []) {
  try {
    const iframe = typeof player.getIframe === "function" ? player.getIframe() : null;
    const targetWindow = iframe?.contentWindow;

    if (!targetWindow) {
      console.warn(`YouTube ${func} command failed: no iframe contentWindow`);
      return false;
    }

    console.warn(`Sending YouTube command: ${func}`, args);
    targetWindow.postMessage(JSON.stringify({ event: "command", func, args }), "https://www.youtube.com");
    return true;
  } catch (error) {
    console.warn(`YouTube ${func} command failed.`, error);
    return false;
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
  const hostRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<YT.Player | null>(null);
  const sourceRef = useRef(source.rawUrl);
  const volumeRef = useRef(volume);
  const previousTimeRef = useRef(0);
  const autoplayUnmutePendingRef = useRef(false);
  const playbackRetryTimerRef = useRef<number | null>(null);
  const playlistFallbackAttemptedRef = useRef(false);
  const defaultFallbackAttemptedRef = useRef(false);
  const smoothedEnergyRef = useRef(0.08);
  const energyHistoryRef = useRef<number[]>([]);
  const isInitializedRef = useRef(false);

  useEffect(() => {
    volumeRef.current = volume;
  }, [volume]);

  useEffect(() => {
    return () => {
      if (playbackRetryTimerRef.current !== null) {
        window.clearTimeout(playbackRetryTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    let pollInterval = 0;
    let resolved = false;

    function markResolved() {
      resolved = true;
    }

    function deriveEnergy(
      currentTime: number,
      isPlaying: boolean,
      currentVolume: number,
      deltaTime: number,
    ) {
      if (!isPlaying) {
        return 0.04;
      }

      // Simple intensity based on volume - visualizer oscillations happen in the canvas at 60fps
      const volumeIntensity = Math.pow(currentVolume / 100, 1.2) * 0.7;
      
      // Slight boost from playback activity (seeking, track changes)
      const activityBump = Math.min(0.15, deltaTime * 1.5);
      
      // Base energy when playing at all
      const baseEnergy = 0.15;
      
      const rawEnergy = Math.min(1.0, baseEnergy + volumeIntensity + activityBump);
      
      // Light smoothing to prevent jitter
      energyHistoryRef.current.push(rawEnergy);
      if (energyHistoryRef.current.length > 3) {
        energyHistoryRef.current.shift();
      }
      const averagedEnergy = energyHistoryRef.current.reduce((sum, val) => sum + val, 0) / energyHistoryRef.current.length;
      
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
          sendPlayerCommand(player, "playVideoAt", [nextIndex]);
          return;
        }

        const previousIndex = (playlistIndex - 1 + playlist.length) % playlist.length;
        sendPlayerCommand(player, "playVideoAt", [previousIndex]);
        return;
      }

      if (source.playlistId) {
        sendPlayerCommand(player, "loadPlaylist", [
          {
            list: source.playlistId,
            listType: "playlist",
            index: 0,
          },
        ]);
        disableShuffle(player);

        if (step > 0) {
          startPlayback(player);
        } else {
          sendPlayerCommand(player, "seekTo", [0, true]);
        }

        return;
      }

      if (step > 0) {
        sendPlayerCommand(player, "nextVideo");
      } else {
        sendPlayerCommand(player, "previousVideo");
      }
    }

    function applySource(player: YT.Player, rawUrl: string) {
      const parsed = parseYouTubeSource(rawUrl);

      if (parsed.playlistId) {
        sendPlayerCommand(player as ExtendedPlayer, "loadPlaylist", [
          {
            list: parsed.playlistId,
            listType: "playlist",
          },
        ]);
        disableShuffle(player as ExtendedPlayer);
        return;
      }

      if (parsed.videoId) {
        sendPlayerCommand(player as ExtendedPlayer, "loadVideoById", [parsed.videoId]);
      }
    }

    function restoreAudio(player: ExtendedPlayer) {
      try {
        if (!player.isMuted() && player.getVolume() > 0 && !autoplayUnmutePendingRef.current) {
          return;
        }

        sendPlayerCommand(player, "unMute");
        sendPlayerCommand(player, "setVolume", [volumeRef.current]);
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

          sendPlayerCommand(player, "playVideo");
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

    // Safety timeout: if the YouTube player never fires onReady or onError
    // (ad blockers, network issues, autoplay restrictions, etc.), force the
    // engine to "ready" so the loading screen doesn't block the site forever.
    const safetyTimeout = window.setTimeout(() => {
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
          origin: window.location.origin,
          widget_referrer: window.location.href,
        } as YT.PlayerOptions["playerVars"] & { widget_referrer?: string };

        // Ensure origin is set correctly for YouTube IFrame API
        if (playerVars.origin && typeof playerVars.origin === 'string') {
          // YouTube expects the origin to be the full URL including protocol
          // Remove trailing slash if present
          playerVars.origin = playerVars.origin.replace(/\/$/, '');
        }

        const playerConfig: YT.PlayerOptions = {
          height: "200",
          width: "200",
          playerVars,
          events: {
            onReady: () => {
              if (cancelled) {
                return;
              }

              console.warn("YouTube player ready");
              markResolved();
              playerRef.current = player;
              previousTimeRef.current = player.getCurrentTime();
              const activePlayer = player as ExtendedPlayer;
              const shouldRestoreAudio = () =>
                autoplayUnmutePendingRef.current || activePlayer.isMuted() || activePlayer.getVolume() === 0;

              if (source.playlistId) {
                disableShuffle(activePlayer);

                if (readPlaylist(activePlayer).length === 0) {
                  sendPlayerCommand(activePlayer, "loadPlaylist", [
                    {
                      list: source.playlistId,
                      listType: "playlist",
                      index: 0,
                    },
                  ]);
                  disableShuffle(activePlayer);
                }
              }

              autoplayUnmutePendingRef.current = true;

              try {
                sendPlayerCommand(activePlayer, "setVolume", [0]);
                sendPlayerCommand(activePlayer, "mute");
              } catch (error) {
                console.warn("YouTube mute bootstrap failed.", error);
              }

              console.warn("Registering YouTube player controls");
              registerControls({
                play: () => {
                  console.warn("Play command called");
                  if (shouldRestoreAudio()) {
                    restoreAudio(activePlayer);
                  }

                  sendPlayerCommand(activePlayer, "playVideo");
                },
                pause: () => {
                  console.warn("Pause command called");
                  sendPlayerCommand(activePlayer, "pauseVideo");
                },
                toggle: () => {
                  console.warn("Toggle command called");
                  const state = player.getPlayerState();
                  console.warn("Current player state:", state);
                  if (state === window.YT?.PlayerState.PLAYING) {
                    if (shouldRestoreAudio()) {
                      restoreAudio(activePlayer);
                      return;
                    }

                    sendPlayerCommand(activePlayer, "pauseVideo");
                    return;
                  }

                  if (shouldRestoreAudio()) {
                    restoreAudio(activePlayer);
                  }

                  sendPlayerCommand(activePlayer, "playVideo");
                },
                next: () => movePlaylist(activePlayer, 1),
                previous: () => movePlaylist(activePlayer, -1),
                setVolume: (nextVolume) => {
                  sendPlayerCommand(activePlayer, "setVolume", [nextVolume]);
                },
                seekTo: (seconds) => {
                  sendPlayerCommand(activePlayer, "seekTo", [seconds, true]);
                },
                load: (url) => applySource(player, url),
                mute: (mute) => {
                  if (mute) {
                    sendPlayerCommand(activePlayer, "mute");
                    return;
                  }
                  sendPlayerCommand(activePlayer, "unMute");
                },
              });

              setPlayerReady(true);

              const snapshot = readCurrentTrack(activePlayer);

              syncTrack({
                title: snapshot.title ?? undefined,
                videoId: snapshot.videoId,
                currentTime: snapshot.currentTime,
                duration: snapshot.duration,
                isMuted: true,
              });

              startPlayback(activePlayer);
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
                  sendPlayerCommand(player, "seekTo", [0, true]);
                  sendPlayerCommand(player, "playVideo");
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
                    deriveEnergy(snapshot.currentTime, playing, volumeRef.current, Math.max(0, snapshot.currentTime - previousTimeRef.current)),
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
                  sendPlayerCommand(player as ExtendedPlayer, "loadVideoById", [fallbackVideoId]);
                  sendPlayerCommand(player as ExtendedPlayer, "mute");
                  sendPlayerCommand(player as ExtendedPlayer, "setVolume", [0]);
                  autoplayUnmutePendingRef.current = true;
                  startPlayback(player as ExtendedPlayer);
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

        const player = new api.Player(hostRef.current, playerConfig);

        pollInterval = window.setInterval(() => {
          // Poll at 250ms to match YouTube's getCurrentTime() update rate for better sync
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
            
            // Faster interpolation for better sync — energy now responds in ~0.7s instead of ~1.7s
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
        }, 250);
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
      window.clearTimeout(safetyTimeout);
      if (pollInterval) {
        window.clearInterval(pollInterval);
      }
      if (playbackRetryTimerRef.current !== null) {
        window.clearTimeout(playbackRetryTimerRef.current);
        playbackRetryTimerRef.current = null;
      }
      playerRef.current?.destroy();
      playerRef.current = null;
    };
  }, [
    source.playlistId,
    source.rawUrl,
  ]);

  useEffect(() => {
    if (!playerRef.current || sourceRef.current === source.rawUrl) {
      return;
    }

    sourceRef.current = source.rawUrl;
    const player = playerRef.current;

    if (source.playlistId) {
      sendPlayerCommand(player as ExtendedPlayer, "loadPlaylist", [
        {
          list: source.playlistId,
          listType: "playlist",
        },
      ]);
      return;
    }

    if (source.videoId) {
      sendPlayerCommand(player as ExtendedPlayer, "loadVideoById", [source.videoId]);
    }
  }, [source.playlistId, source.rawUrl]);

  return (
    <div
      ref={hostRef}
      className="pointer-events-none absolute left-0 top-0 h-[200px] w-[200px] opacity-0"
      style={{ position: 'absolute', zIndex: -1 }}
    />
  );
}
