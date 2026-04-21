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
  const volumeRef = useRef(volume);
  const previousTimeRef = useRef(0);

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

    function deriveEnergy(
      currentTime: number,
      isPlaying: boolean,
      currentVolume: number,
      deltaTime: number,
    ) {
      if (!isPlaying) {
        return 0.06;
      }

      const base = Math.abs(Math.sin(currentTime * 1.45)) * 0.23;
      const shimmer = Math.abs(Math.cos(currentTime * 0.72 + 0.3)) * 0.17;
      const detail = Math.abs(Math.sin(currentTime * 2.9 + 1.2)) * 0.12;
      const texture = Math.abs(Math.cos(currentTime * 4.2 - 0.6)) * 0.09;
      const tempoBurst = Math.min(0.18, Math.max(0, deltaTime * 0.24));
      const volumeFactor = (currentVolume / 100) * 0.2;
      return Math.min(1, 0.1 + base + shimmer + detail + texture + tempoBurst + volumeFactor);
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
              previousTimeRef.current = player.getCurrentTime();
              const videoData = (player as ExtendedPlayer).getVideoData();
              syncTrack({
                title: videoData.title || "Untitled soundtrack",
                videoId: videoData.video_id || null,
                currentTime: player.getCurrentTime(),
                duration: player.getDuration(),
              });
              player.setVolume(volumeRef.current);
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
                seekTo: (seconds) => player.seekTo(seconds, true),
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
          const duration = player.getDuration();
          const state = player.getPlayerState();
          const deltaTime = Math.max(0, currentTime - previousTimeRef.current);
          previousTimeRef.current = currentTime;
          syncTrack({
            title: video.title || "Untitled soundtrack",
            videoId: video.video_id || null,
            isPlaying: state === window.YT?.PlayerState.PLAYING,
            currentTime,
            duration,
          });
          setVisualLevel(
            deriveEnergy(currentTime, state === window.YT?.PlayerState.PLAYING, volumeRef.current, deltaTime),
          );
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
  }, [registerControls, setPlayerError, setPlayerReady, setVisualLevel, source.playlistId, source.rawUrl, source.videoId, syncTrack]);

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
