"use client";

import { useEffect, useRef } from "react";

import { useMusic } from "@/context/MusicContext";
import { extractYouTubeVideoId, parseYouTubeSource } from "@/lib/youtube";

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
  getPlaylist: () => string[];
  getPlaylistIndex: () => number;
  getVideoUrl: () => string;
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
  const playbackRetryTimerRef = useRef<number | null>(null);

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
        return 0.06;
      }

      const base = Math.abs(Math.sin(currentTime * 1.52)) * 0.24;
      const shimmer = Math.abs(Math.cos(currentTime * 0.78 + 0.42)) * 0.2;
      const detail = Math.abs(Math.sin(currentTime * 3.12 + 1.08)) * 0.16;
      const texture = Math.abs(Math.cos(currentTime * 4.56 - 0.74)) * 0.12;
      const spark = Math.abs(Math.sin(currentTime * 6.9 + 0.18)) * 0.1;
      const counterpoint = Math.abs(Math.cos(currentTime * 8.2 + 1.4)) * 0.08;
      const tempoBurst = Math.min(0.28, Math.max(0, deltaTime * 0.42));
      const volumeFactor = (currentVolume / 100) * 0.22;
      return Math.min(0.94, 0.1 + base + shimmer + detail + texture + spark + counterpoint + tempoBurst + volumeFactor);
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

    function disableShuffle(player: ExtendedPlayer) {
      try {
        player.setShuffle(false);
      } catch (error) {
        console.warn("YouTube playlist shuffle could not be disabled.", error);
      }
    }

    function movePlaylist(player: ExtendedPlayer, step: 1 | -1) {
      const playlist = readPlaylist(player);
      const playlistIndex = readPlaylistIndex(player);

      if (playlistIndex >= 0 && playlist.length > 0) {
        if (step > 0) {
          const nextIndex = playlistIndex + 1;
          if (nextIndex < playlist.length) {
            player.playVideoAt(nextIndex);
          }
          return;
        }

        if (playlistIndex === 0) {
          player.seekTo(0, true);
          return;
        }

        player.playVideoAt(Math.max(0, playlistIndex - 1));
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
          height: "200",
          width: "200",
          videoId: source.playlistId ? undefined : source.videoId ?? undefined,
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
              const activePlayer = player as ExtendedPlayer;
              const shouldRestoreAudio = () =>
                autoplayUnmutePendingRef.current || activePlayer.isMuted() || activePlayer.getVolume() === 0;

              if (source.playlistId) {
                disableShuffle(activePlayer);
              }

              autoplayUnmutePendingRef.current = true;

              try {
                player.setVolume(0);
                player.mute();
              } catch (error) {
                console.warn("YouTube mute bootstrap failed.", error);
              }

              registerControls({
                play: () => {
                  if (shouldRestoreAudio()) {
                    restoreAudio(activePlayer);
                  }

                  player.playVideo();
                },
                pause: () => player.pauseVideo(),
                toggle: () => {
                  const state = player.getPlayerState();
                  if (state === window.YT?.PlayerState.PLAYING) {
                    if (shouldRestoreAudio()) {
                      restoreAudio(activePlayer);
                      return;
                    }

                    player.pauseVideo();
                    return;
                  }

                  if (shouldRestoreAudio()) {
                    restoreAudio(activePlayer);
                  }

                  player.playVideo();
                },
                next: () => movePlaylist(activePlayer, 1),
                previous: () => movePlaylist(activePlayer, -1),
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
                  const playlist = readPlaylist(player);
                  const playlistIndex = readPlaylistIndex(player);

                  if (playlistIndex >= 0 && playlistIndex + 1 < playlist.length) {
                    player.playVideoAt(playlistIndex + 1);
                    return;
                  }

                  if (playlistIndex === -1) {
                    previousTimeRef.current = 0;
                    syncTrack({
                      isPlaying: true,
                      currentTime: 0,
                    });
                    player.seekTo(0, true);
                    player.playVideo();
                  }

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
              setPlayerError("Music unavailable");
            },
          },
        });

        pollInterval = window.setInterval(() => {
          if (!playerRef.current) {
            return;
          }

          try {
            const player = playerRef.current as ExtendedPlayer;
            const state = player.getPlayerState();
            const snapshot = readCurrentTrack(player);
            const deltaTime = Math.max(0, snapshot.currentTime - previousTimeRef.current);
            previousTimeRef.current = snapshot.currentTime;
            syncTrack({
              title: snapshot.title ?? undefined,
              videoId: snapshot.videoId,
              isPlaying: state === window.YT?.PlayerState.PLAYING,
              currentTime: snapshot.currentTime,
              duration: snapshot.duration,
            });
            setVisualLevel(
              deriveEnergy(snapshot.currentTime, state === window.YT?.PlayerState.PLAYING, volumeRef.current, deltaTime),
            );
          } catch (error) {
            console.warn("YouTube poll loop failed.", error);
          }
        }, 400);
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
  }, [registerControls, setPlayerError, setPlayerReady, setVisualLevel, source.playlistId, source.rawUrl, syncTrack]);

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

  return (
    <div
      ref={hostRef}
      className="pointer-events-none fixed left-[-9999px] top-[-9999px] h-[200px] w-[200px] opacity-0"
    />
  );
}
