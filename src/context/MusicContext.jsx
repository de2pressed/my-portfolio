'use client';

import { createContext, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import useAmbientColor from '../hooks/useAmbientColor';
import useSiteContent from '../hooks/useSiteContent';
import { useTheme } from './ThemeContext';
import { buildThumbnailUrl, parseYouTubeSource } from '../utils/youtubeHelpers';

export const MusicContext = createContext(null);

const YOUTUBE_SCRIPT_ID = 'youtube-iframe-api';
const YOUTUBE_SCRIPT_SRC = 'https://www.youtube.com/iframe_api';

let youtubeApiPromise = null;

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function getTrackIndex(tracks, trackId) {
  return tracks.findIndex((track) => track.id === trackId);
}

function normalizeTrack(track) {
  if (!track) {
    return null;
  }

  const youtubeUrl = String(track.youtubeUrl || track.youtube_url || '').trim();
  const { videoId } = parseYouTubeSource(youtubeUrl);
  const artworkUrl =
    String(track.artworkUrl || track.artwork_url || '').trim() || buildThumbnailUrl(videoId);

  return {
    accentColor: track.accentColor || track.accent_color || '',
    artist: track.artist || 'Portfolio System',
    artworkUrl,
    id: track.id,
    published: track.published !== false,
    sortOrder: Number(track.sortOrder ?? track.sort_order ?? 0),
    title: track.title || 'Untitled track',
    youtubeUrl,
  };
}

function loadYouTubeApi() {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('YouTube API is unavailable on the server.'));
  }

  if (window.YT?.Player) {
    return Promise.resolve(window.YT);
  }

  if (youtubeApiPromise) {
    return youtubeApiPromise;
  }

  youtubeApiPromise = new Promise((resolve, reject) => {
    const existingScript = document.getElementById(YOUTUBE_SCRIPT_ID);

    window.onYouTubeIframeAPIReady = () => {
      resolve(window.YT);
    };

    if (existingScript) {
      return;
    }

    const script = document.createElement('script');
    script.id = YOUTUBE_SCRIPT_ID;
    script.src = YOUTUBE_SCRIPT_SRC;
    script.async = true;
    script.onerror = () => {
      youtubeApiPromise = null;
      reject(new Error('YouTube API failed to load.'));
    };
    document.head.appendChild(script);
  });

  return youtubeApiPromise;
}

function getVideoId(track) {
  return parseYouTubeSource(track?.youtubeUrl || '').videoId || '';
}

function buildAnalysis({ currentTime, duration, isPlaying, trackIndex, volume }) {
  const ratio = duration ? clamp(currentTime / duration, 0, 1) : 0;
  const trackWeight = ((trackIndex + 1) % 7) / 10;
  const base = isPlaying ? 0.34 : 0.16;

  return {
    bassEnergy: clamp(base + ratio * 0.22 + trackWeight * 0.12, 0.08, 1),
    energyLevel: clamp(base + ratio * 0.28 + (volume / 100) * 0.12, 0.08, 1),
    highEnergy: clamp(base + (1 - ratio) * 0.18 + trackWeight * 0.08, 0.08, 1),
    midEnergy: clamp(base + ratio * 0.16 + trackWeight * 0.1, 0.08, 1),
  };
}

export function MusicProvider({ children }) {
  const { siteSettings, tracks } = useSiteContent();
  const { setAmbientColors } = useTheme();
  const playerMountRef = useRef(null);
  const playerRef = useRef(null);
  const tickRef = useRef(0);
  const shouldAutoplayRef = useRef(false);
  const [hasUserActivatedAudio, setHasUserActivatedAudio] = useState(false);
  const [playerStatus, setPlayerStatus] = useState('loading');
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const [isPlayerUnavailable, setIsPlayerUnavailable] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(72);
  const [currentTrackId, setCurrentTrackId] = useState('');

  const publishedTracks = useMemo(
    () => (tracks || []).map(normalizeTrack).filter((track) => track?.published !== false),
    [tracks],
  );

  const currentTrack =
    publishedTracks.find((track) => track.id === currentTrackId) || publishedTracks[0] || null;
  const artworkUrl = currentTrack?.artworkUrl || '';
  const ambientColors = useAmbientColor(artworkUrl);
  const currentTrackIndex = getTrackIndex(publishedTracks, currentTrack?.id || '');
  const progress = duration ? clamp((currentTime / duration) * 100, 0, 100) : 0;
  const analysis = buildAnalysis({
    currentTime,
    duration,
    isPlaying: playerStatus === 'playing',
    trackIndex: currentTrackIndex,
    volume,
  });

  const goToRelativeTrack = useCallback(
    (delta, autoplay = false) => {
      if (!publishedTracks.length) {
        return;
      }

      shouldAutoplayRef.current = autoplay;
      const nextIndex =
        currentTrackIndex === -1
          ? 0
          : (currentTrackIndex + delta + publishedTracks.length) % publishedTracks.length;
      setCurrentTrackId(publishedTracks[nextIndex].id);
    },
    [currentTrackIndex, publishedTracks],
  );

  useEffect(() => {
    setAmbientColors(ambientColors);
  }, [ambientColors, setAmbientColors]);

  useEffect(() => {
    if (!publishedTracks.length) {
      setCurrentTrackId('');
      setIsPlayerUnavailable(true);
      setIsPlayerReady(false);
      setPlayerStatus('idle');
      return;
    }

    const preferredTrackId = siteSettings?.defaultTrackId;
    const nextTrackId =
      publishedTracks.some((track) => track.id === currentTrackId)
        ? currentTrackId
        : publishedTracks.some((track) => track.id === preferredTrackId)
          ? preferredTrackId
          : publishedTracks[0].id;

    setCurrentTrackId((current) => (current === nextTrackId ? current : nextTrackId));
    setIsPlayerUnavailable(false);
  }, [currentTrackId, publishedTracks, siteSettings?.defaultTrackId]);

  useEffect(() => {
    let didCancel = false;

    async function setupPlayer() {
      if (!currentTrack?.youtubeUrl || !playerMountRef.current) {
        return;
      }

      setPlayerStatus('loading');

      try {
        const YT = await loadYouTubeApi();

        if (didCancel || !playerMountRef.current) {
          return;
        }

        if (!playerRef.current) {
          const videoId = getVideoId(currentTrack);

          if (!videoId) {
            setIsPlayerUnavailable(true);
            setPlayerStatus('idle');
            return;
          }

          playerRef.current = new YT.Player(playerMountRef.current, {
            height: '1',
            host: 'https://www.youtube-nocookie.com',
            playerVars: {
              autoplay: 0,
              controls: 0,
              disablekb: 1,
              fs: 0,
              iv_load_policy: 3,
              modestbranding: 1,
              playsinline: 1,
              rel: 0,
            },
            videoId,
            width: '1',
            events: {
              onError: () => {
                setIsPlayerUnavailable(true);
                setIsPlayerReady(false);
                setPlayerStatus('idle');
              },
              onReady: () => {
                setIsPlayerReady(true);
                setIsPlayerUnavailable(false);
                playerRef.current?.setVolume(volume);
                setDuration(playerRef.current?.getDuration?.() || 0);
                setCurrentTime(playerRef.current?.getCurrentTime?.() || 0);
                if (shouldAutoplayRef.current) {
                  playerRef.current?.playVideo?.();
                } else {
                  setPlayerStatus('paused');
                }
              },
              onStateChange: (event) => {
                const player = playerRef.current;

                switch (event.data) {
                  case YT.PlayerState.PLAYING: {
                    setPlayerStatus('playing');
                    setDuration(player?.getDuration?.() || duration);
                    break;
                  }

                  case YT.PlayerState.PAUSED: {
                    setPlayerStatus('paused');
                    break;
                  }

                  case YT.PlayerState.BUFFERING: {
                    setPlayerStatus('loading');
                    break;
                  }

                  case YT.PlayerState.ENDED: {
                    setPlayerStatus('loading');
                    goToRelativeTrack(1, true);
                    break;
                  }

                  default:
                    break;
                }
              },
            },
          });
        } else {
          const player = playerRef.current;
          const videoId = getVideoId(currentTrack);

          if (!videoId) {
            setIsPlayerUnavailable(true);
            setPlayerStatus('idle');
            return;
          }

          if (shouldAutoplayRef.current) {
            player.loadVideoById(videoId);
            player.playVideo();
            shouldAutoplayRef.current = false;
          } else {
            player.cueVideoById(videoId);
            setDuration(player.getDuration?.() || 0);
            setCurrentTime(player.getCurrentTime?.() || 0);
            setPlayerStatus(player.getPlayerState?.() === YT?.PlayerState?.PLAYING ? 'playing' : 'paused');
          }
        }
      } catch {
        if (!didCancel) {
          setIsPlayerUnavailable(true);
          setIsPlayerReady(false);
          setPlayerStatus('idle');
        }
      }
    }

    void setupPlayer();

    return () => {
      didCancel = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTrack?.youtubeUrl, currentTrackId]);

  useEffect(() => {
    if (!playerRef.current || !isPlayerReady) {
      return undefined;
    }

    playerRef.current.setVolume(volume);
    return undefined;
  }, [isPlayerReady, volume]);

  useEffect(() => {
    if (!playerRef.current || playerStatus !== 'playing') {
      if (tickRef.current) {
        window.clearInterval(tickRef.current);
        tickRef.current = 0;
      }

      return undefined;
    }

    tickRef.current = window.setInterval(() => {
      const player = playerRef.current;

      if (!player) {
        return;
      }

      setCurrentTime(player.getCurrentTime?.() || 0);
      setDuration(player.getDuration?.() || 0);
    }, 220);

    return () => {
      if (tickRef.current) {
        window.clearInterval(tickRef.current);
        tickRef.current = 0;
      }
    };
  }, [playerStatus]);

  useEffect(
    () => () => {
      if (tickRef.current) {
        window.clearInterval(tickRef.current);
      }

      playerRef.current?.destroy?.();
      playerRef.current = null;
    },
    [],
  );

  const value = useMemo(
    () => ({
      ambientColors,
      artworkUrl,
      bassEnergy: analysis.bassEnergy,
      currentSource: currentTrack?.youtubeUrl || '',
      currentTime,
      currentTrack,
      currentTrackIndex,
      duration,
      energyLevel: analysis.energyLevel,
      frequencyData: analysis,
      hasUserActivatedAudio,
      highEnergy: analysis.highEnergy,
      isPlayerReady,
      isPlayerUnavailable,
      loading: playerStatus === 'loading',
      midEnergy: analysis.midEnergy,
      paused: playerStatus === 'paused',
      playerStatus,
      playing: playerStatus === 'playing',
      progress,
      thumbnailUrl: artworkUrl,
      tracks: publishedTracks,
      volume,
      next() {
        goToRelativeTrack(1, playerStatus === 'playing');
      },
      pause() {
        shouldAutoplayRef.current = false;
        playerRef.current?.pauseVideo?.();
      },
      async play() {
        if (!currentTrack?.youtubeUrl) {
          return;
        }

        shouldAutoplayRef.current = true;
        setHasUserActivatedAudio(true);

        if (!playerRef.current) {
          setPlayerStatus('loading');
          return;
        }

        playerRef.current.playVideo?.();
      },
      prev() {
        goToRelativeTrack(-1, playerStatus === 'playing');
      },
      seekTo(nextSeconds) {
        const player = playerRef.current;
        const safeSeconds = clamp(Number(nextSeconds) || 0, 0, duration || 0);

        if (!player) {
          return;
        }

        player.seekTo?.(safeSeconds, true);
        setCurrentTime(safeSeconds);
      },
      setTrackById(trackId) {
        if (!publishedTracks.some((track) => track.id === trackId)) {
          return;
        }

        shouldAutoplayRef.current = playerStatus === 'playing';
        setCurrentTrackId(trackId);
      },
      setVolume(nextVolume) {
        const normalized = clamp(Number(nextVolume) || 0, 0, 100);
        setVolumeState(normalized);
        playerRef.current?.setVolume?.(normalized);
      },
      async unlockAndPlay() {
        setHasUserActivatedAudio(true);
        shouldAutoplayRef.current = true;

        if (!playerRef.current && currentTrack?.youtubeUrl) {
          try {
            await loadYouTubeApi();
          } catch {
            setIsPlayerUnavailable(true);
            setPlayerStatus('idle');
            return;
          }
        }

        playerRef.current?.playVideo?.();
      },
    }),
    [
      ambientColors,
      analysis,
      artworkUrl,
      goToRelativeTrack,
      currentTime,
      currentTrack,
      currentTrackIndex,
      duration,
      hasUserActivatedAudio,
      isPlayerReady,
      isPlayerUnavailable,
      playerStatus,
      progress,
      publishedTracks,
      volume,
    ],
  );

  return (
    <MusicContext.Provider value={value}>
      <div
        aria-hidden="true"
        ref={playerMountRef}
        style={{
          height: 1,
          left: '-9999px',
          overflow: 'hidden',
          position: 'fixed',
          top: '-9999px',
          width: 1,
        }}
      />
      {children}
    </MusicContext.Provider>
  );
}

export default MusicProvider;
