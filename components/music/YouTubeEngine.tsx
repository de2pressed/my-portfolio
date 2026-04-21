"use client";

import { useEffect, useRef } from "react";

import { useMusic } from "@/context/MusicContext";
import { parseYouTubeSource } from "@/lib/youtube";

declare global {
  interface Window {
    YT?: typeof YT;
    onYouTubeIframeAPIReady?: () => void;
    __youtubeApiReadyPromise__?: Promise<typeof YT>;
  }
}

type ExtendedPlayer = YT.Player & {
  getVideoData: () => {
    title: string;
    video_id: string;
  };
};

function loadYouTubeApi() {
  if (window.YT?.Player) {
    return Promise.resolve(window.YT);
  }

  if (window.__youtubeApiReadyPromise__) {
    return window.__youtubeApiReadyPromise__;
  }

  window.__youtubeApiReadyPromise__ = new Promise<typeof YT>((resolve) => {
    const script = document.createElement("script");
    script.src = "https://www.youtube.com/iframe_api";
    script.async = true;
    document.body.appendChild(script);
    window.onYouTubeIframeAPIReady = () => resolve(window.YT as typeof YT);
  });

  return window.__youtubeApiReadyPromise__;
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

  useEffect(() => {
    let cancelled = false;
    let pollInterval = 0;
    let resolved = false;

    function markResolved() {
      resolved = true;
    }

    function deriveEnergy(currentTime: number, isPlaying: boolean, currentVolume: number) {
      if (!isPlaying) {
        return 0.14;
      }

      const base = Math.abs(Math.sin(currentTime * 1.4)) * 0.26;
      const shimmer = Math.abs(Math.cos(currentTime * 0.66)) * 0.18;
      const detail = Math.abs(Math.sin(currentTime * 2.8)) * 0.1;
      const volumeFactor = (currentVolume / 100) * 0.18;
      return Math.min(1, 0.18 + base + shimmer + detail + volumeFactor);
    }

    function applySource(player: YT.Player, rawUrl: string) {
      const parsed = parseYouTubeSource(rawUrl);

      if (parsed.playlistId) {
        player.loadPlaylist({
          list: parsed.playlistId,
          listType: "playlist",
        });
        return;
      }

      if (parsed.videoId) {
        player.loadVideoById(parsed.videoId);
      }
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
      try {
        const api = await loadYouTubeApi();
        if (cancelled || !hostRef.current) {
          return;
        }

        const player = new api.Player(hostRef.current, {
          height: "1",
          width: "1",
          videoId: source.videoId ?? undefined,
          playerVars: {
            autoplay: 1,
            controls: 0,
            disablekb: 1,
            fs: 0,
            modestbranding: 1,
            playsinline: 1,
            rel: 0,
            iv_load_policy: 3,
            origin: window.location.origin,
            list: source.playlistId ?? undefined,
            listType: source.playlistId ? "playlist" : undefined,
          },
          events: {
            onReady: () => {
              if (cancelled) {
                return;
              }

              markResolved();
              playerRef.current = player;
              player.setVolume(volume);
              player.playVideo();
              setPlayerReady(true);

              registerControls({
                play: () => player.playVideo(),
                pause: () => player.pauseVideo(),
                toggle: () => {
                  const state = player.getPlayerState();
                  if (state === window.YT?.PlayerState.PLAYING) {
                    player.pauseVideo();
                    return;
                  }
                  player.playVideo();
                },
                next: () => player.nextVideo(),
                previous: () => player.previousVideo(),
                setVolume: (nextVolume) => player.setVolume(nextVolume),
                load: (url) => applySource(player, url),
                mute: (mute) => {
                  if (mute) {
                    player.mute();
                    return;
                  }
                  player.unMute();
                },
              });

              sourceRef.current = source.rawUrl;
            },
            onStateChange: (event) => {
              const playing = event.data === window.YT?.PlayerState.PLAYING;
              syncTrack({ isPlaying: playing });
            },
            onError: () => {
              markResolved();
              setPlayerError("Music unavailable");
            },
          },
        });

        pollInterval = window.setInterval(() => {
          if (!playerRef.current) {
            return;
          }

          const player = playerRef.current as ExtendedPlayer;
          const video = player.getVideoData();
          const currentTime = player.getCurrentTime();
          const state = player.getPlayerState();
          syncTrack({
            title: video.title || "Untitled soundtrack",
            videoId: video.video_id || null,
            isPlaying: state === window.YT?.PlayerState.PLAYING,
          });
          setVisualLevel(deriveEnergy(currentTime, state === window.YT?.PlayerState.PLAYING, volume));
        }, 400);
      } catch (error) {
        console.warn("YouTube IFrame API failed to initialize.", error);
        markResolved();
        setPlayerError("Music unavailable");
      }
    }

    boot();

    return () => {
      cancelled = true;
      window.clearTimeout(safetyTimeout);
      if (pollInterval) {
        window.clearInterval(pollInterval);
      }
      playerRef.current?.destroy();
      playerRef.current = null;
    };
  }, [registerControls, setPlayerError, setPlayerReady, setVisualLevel, source.playlistId, source.rawUrl, source.videoId, syncTrack, volume]);

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
  }, [source.playlistId, source.rawUrl, source.videoId]);

  return <div ref={hostRef} className="pointer-events-none fixed left-[-9999px] top-[-9999px] h-px w-px opacity-0" />;
}
