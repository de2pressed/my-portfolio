"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

import { useMusic } from "@/context/MusicContext";
import { extractYouTubeVideoId, parseYouTubeSource } from "@/lib/youtube";

type ExtendedPlayer = YT.Player & {
  isMuted: () => boolean;
  getVolume: () => number;
};

function sendPlayerCommand(player: ExtendedPlayer, func: string, args: unknown[] = []) {
  try {
    const iframe = typeof player.getIframe === "function" ? player.getIframe() : null;
    const targetWindow = iframe?.contentWindow;

    if (!targetWindow) {
      console.warn(`YouTube ${func} command failed: no iframe contentWindow`);
      return false;
    }

    console.warn(`Sending YouTube command: ${func}`, args);
    targetWindow.postMessage(JSON.stringify({ event: "command", func, args }), "*");
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
  const smoothedEnergyRef = useRef(0.08);
  const energyHistoryRef = useRef<number[]>([]);
  const pathname = usePathname();

  volumeRef.current = volume;

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.YT === "undefined") {
      return;
    }

    if (sourceRef.current !== source.rawUrl) {
      sourceRef.current = source.rawUrl;
      const videoId = source.videoId || extractYouTubeVideoId(source.rawUrl);
      if (videoId) {
        playerRef.current?.loadVideoById(videoId);
      }
    }
  }, [source.rawUrl, source.videoId]);

  useEffect(() => {
    if (!playerRef.current) {
      return;
    }

    playerRef.current.setVolume(volume);
  }, [volume]);

  useEffect(() => {
    if (!playerRef.current) {
      return;
    }

    if (pathname !== "/") {
      playerRef.current.pauseVideo();
    }
  }, [pathname]);

  useEffect(() => {
    let cancelled = false;

    function loadYouTubeAPI() {
      if (cancelled) {
        return;
      }

      if (typeof window.YT !== "undefined" && typeof window.YT.Player !== "undefined") {
        initializePlayer();
        return;
      }

      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName("script")[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

      const onYouTubeIframeAPIReady = () => {
        if (cancelled) {
          return;
        }
        initializePlayer();
      };

      (window as unknown as { onYouTubeIframeAPIReady?: () => void }).onYouTubeIframeAPIReady = onYouTubeIframeAPIReady;
    }

    function initializePlayer() {
      if (cancelled || !hostRef.current) {
        return;
      }

      const videoId = source.videoId || extractYouTubeVideoId(source.rawUrl);
      if (!videoId) {
        setPlayerError("Invalid YouTube URL");
        return;
      }

      const playerVars: YT.PlayerVars = {
        autoplay: 0,
        controls: 0,
        disablekb: 1,
        fs: 0,
        modestbranding: 1,
        playsinline: 1,
        rel: 0,
        origin: window.location.origin,
      };

      if (source.playlistId) {
        playerVars.list = source.playlistId;
        playerVars.listType = "playlist";
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

              try {
                sendPlayerCommand(activePlayer, "setVolume", [0]);
                sendPlayerCommand(activePlayer, "mute");
              } catch (error) {
                console.warn("YouTube mute bootstrap failed.", error);
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
                next: () => {
                  if (source.playlistId) {
                    player.nextVideo();
                  }
                },
                previous: () => {
                  if (source.playlistId) {
                    player.previousVideo();
                  }
                },
                setVolume: (value: number) => {
                  sendPlayerCommand(activePlayer, "setVolume", [value]);
                },
                seekTo: (seconds: number) => {
                  sendPlayerCommand(activePlayer, "seekTo", [seconds, true]);
                },
                load: (url: string) => {
                  const parsed = parseYouTubeSource(url);
                  const nextVideoId = parsed.videoId || extractYouTubeVideoId(url);
                  if (nextVideoId) {
                    player.loadVideoById(nextVideoId);
                  }
                },
                mute: (mute: boolean) => {
                  if (mute) {
                    sendPlayerCommand(activePlayer, "mute");
                  } else {
                    sendPlayerCommand(activePlayer, "unMute");
                  }
                },
              });

              syncTrack({
                title: "Loading playlist...",
                videoId: null,
                isPlaying: false,
              });

              player.playVideo();
            } else {
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
                next: () => {
                  const nextVideoId = extractYouTubeVideoId(source.rawUrl);
                  if (nextVideoId) {
                    player.loadVideoById(nextVideoId);
                  }
                },
                previous: () => {
                  const nextVideoId = extractYouTubeVideoId(source.rawUrl);
                  if (nextVideoId) {
                    player.loadVideoById(nextVideoId);
                  }
                },
                setVolume: (value: number) => {
                  sendPlayerCommand(activePlayer, "setVolume", [value]);
                },
                seekTo: (seconds: number) => {
                  sendPlayerCommand(activePlayer, "seekTo", [seconds, true]);
                },
                load: (url: string) => {
                  const parsed = parseYouTubeSource(url);
                  const nextVideoId = parsed.videoId || extractYouTubeVideoId(url);
                  if (nextVideoId) {
                    player.loadVideoById(nextVideoId);
                  }
                },
                mute: (mute: boolean) => {
                  if (mute) {
                    sendPlayerCommand(activePlayer, "mute");
                  } else {
                    sendPlayerCommand(activePlayer, "unMute");
                  }
                },
              });

              syncTrack({
                title: "Loading video...",
                videoId,
                isPlaying: false,
              });
            }

            setPlayerReady(true);
          },
          onStateChange: (event: YT.OnStateChangeEvent) => {
            if (cancelled) {
              return;
            }

            const player = event.target as ExtendedPlayer;
            const state = player.getPlayerState();
            const isPlaying = state === window.YT?.PlayerState.PLAYING;
            const currentTime = player.getCurrentTime();
            const duration = player.getDuration();

            syncTrack({
              isPlaying,
              currentTime,
              duration,
              isMuted: player.isMuted(),
            });

            if (isPlaying && autoplayUnmutePendingRef.current) {
              restoreAudio(player);
              autoplayUnmutePendingRef.current = false;
            }

            if (state === window.YT?.PlayerState.ENDED && source.playlistId) {
              player.nextVideo();
            }
          },
          onError: (event: YT.OnErrorEvent) => {
            if (cancelled) {
              return;
            }

            const errorCode = event.data;
            let errorMessage = "YouTube playback error";

            switch (errorCode) {
              case 2:
                errorMessage = "Invalid YouTube video ID";
                break;
              case 5:
                errorMessage = "HTML5 player error";
                break;
              case 100:
                errorMessage = "Video not found";
                break;
              case 101:
              case 150:
                errorMessage = "Video not embeddable";
                break;
            }

            setPlayerError(errorMessage);
          },
        },
      };

      const player = new window.YT.Player(hostRef.current, playerConfig);
    }

    function disableShuffle(player: ExtendedPlayer) {
      try {
        sendPlayerCommand(player, "setShuffle", [false]);
      } catch (error) {
        console.warn("Failed to disable shuffle.", error);
      }
    }

    function restoreAudio(player: ExtendedPlayer) {
      try {
        sendPlayerCommand(player, "setVolume", [volumeRef.current]);
        sendPlayerCommand(player, "unMute");
      } catch (error) {
        console.warn("Failed to restore audio.", error);
      }
    }

    let resolved = false;
    function markResolved() {
      if (resolved) {
        return;
      }
      resolved = true;
    }

    loadYouTubeAPI();

    return () => {
      cancelled = true;
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
    };
  }, [source.rawUrl, source.videoId, source.playlistId, registerControls, setPlayerReady, setPlayerError, syncTrack, volume]);

  useEffect(() => {
    let pollInterval: number | null = null;

    function poll() {
      if (!playerRef.current) {
        return;
      }

      const player = playerRef.current as ExtendedPlayer;
      const currentTime = player.getCurrentTime();
      const duration = player.getDuration();

      if (Math.abs(currentTime - previousTimeRef.current) > 0.1) {
        previousTimeRef.current = currentTime;
        syncTrack({ currentTime, duration });
      }

      const visualLevel = calculateVisualLevel(player);
      setVisualLevel(visualLevel);
    }

    pollInterval = window.setInterval(poll, 500);

    return () => {
      if (pollInterval) {
        window.clearInterval(pollInterval);
      }
    };
  }, [syncTrack, setVisualLevel]);

  function calculateVisualLevel(player: ExtendedPlayer): number {
    try {
      const currentTime = player.getCurrentTime();
      const duration = player.getDuration();
      const progress = duration > 0 ? currentTime / duration : 0;

      const energy = 0.2 + Math.sin(progress * Math.PI * 4) * 0.1;
      energyHistoryRef.current.push(energy);
      if (energyHistoryRef.current.length > 10) {
        energyHistoryRef.current.shift();
      }

      const avgEnergy = energyHistoryRef.current.reduce((a, b) => a + b, 0) / energyHistoryRef.current.length;
      smoothedEnergyRef.current = smoothedEnergyRef.current * 0.9 + avgEnergy * 0.1;

      return Math.min(1, Math.max(0, smoothedEnergyRef.current));
    } catch {
      return 0.2;
    }
  }

  return (
    <div
      ref={hostRef}
      className="pointer-events-none absolute left-0 top-0 h-[200px] w-[200px] opacity-0"
      style={{ position: 'absolute', zIndex: -1 }}
    />
  );
}
