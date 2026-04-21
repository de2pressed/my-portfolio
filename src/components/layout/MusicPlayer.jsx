'use client';

import { createPortal } from 'react-dom';
import { useEffect, useMemo, useRef, useState } from 'react';
import styles from './MusicPlayer.module.css';
import useAnalytics from '../../hooks/useAnalytics';
import useMusic from '../../hooks/useMusic';

function formatTime(seconds) {
  const safeSeconds = Number.isFinite(seconds) ? seconds : 0;
  const minutes = Math.floor(safeSeconds / 60) || 0;
  const secs = Math.floor(safeSeconds % 60) || 0;
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

export default function MusicPlayer({ dockId = 'player-dock' }) {
  const [isFooterMode, setIsFooterMode] = useState(false);
  const [dockTarget, setDockTarget] = useState(null);
  const [isMounted, setIsMounted] = useState(false);
  const previousTrackIdRef = useRef('');
  const { trackEvent } = useAnalytics();
  const {
    ambientColors,
    artworkUrl,
    bassEnergy,
    currentTime,
    currentTrack,
    duration,
    highEnergy,
    midEnergy,
    next,
    pause,
    play,
    playerStatus,
    playing,
    prev,
    progress,
    seekTo,
    setVolume,
    volume,
  } = useMusic();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const target = document.getElementById('site-footer');

    if (!target) {
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => setIsFooterMode(entry.isIntersecting),
      { threshold: 0.22 },
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const updateDockTarget = () => {
      setDockTarget(document.getElementById(dockId));
    };

    updateDockTarget();

    const observer = new MutationObserver(updateDockTarget);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, [dockId]);

  useEffect(() => {
    if (!currentTrack?.id || previousTrackIdRef.current === currentTrack.id) {
      previousTrackIdRef.current = currentTrack?.id || '';
      return;
    }

    previousTrackIdRef.current = currentTrack.id;
    void trackEvent('music_track_change', {
      title: currentTrack.title,
      trackId: currentTrack.id,
    });
  }, [currentTrack?.id, currentTrack?.title, trackEvent]);

  const statusLabel = useMemo(() => {
    if (!currentTrack) {
      return 'Awaiting track';
    }

    if (playerStatus === 'loading') {
      return 'Buffering the iPod';
    }

    if (playerStatus === 'playing') {
      return 'Pulse engaged';
    }

    if (playerStatus === 'paused') {
      return 'Paused in glass';
    }

    return 'Signal unavailable';
  }, [currentTrack, playerStatus]);

  const [primary, secondary, accent] = ambientColors;
  const glowOpacity = (0.12 + bassEnergy * 0.48).toFixed(3);
  const glowScale = `${1 + highEnergy * 0.18}`;
  const energyTilt = `${1 + midEnergy * 0.08}`;

  const content = (
    <aside
      data-component="MusicPlayer"
      className={`${styles.wrapper} ${isFooterMode ? styles.footerMode : ''}`.trim()}
      style={{
        '--player-accent': currentTrack?.accentColor || accent,
        '--player-glow-opacity': glowOpacity,
        '--player-glow-scale': glowScale,
        '--player-primary': primary,
        '--player-secondary': secondary,
        '--player-tilt': energyTilt,
      }}
    >
      <div className={styles.glow} aria-hidden="true" />
      <div className={styles.shell}>
        <div className={styles.visualColumn}>
          <div className={styles.artFrame}>
            {artworkUrl ? (
              <img
                src={artworkUrl}
                alt={currentTrack?.title || 'Current track'}
                className={styles.thumbnail}
              />
            ) : null}
            <div className={styles.artOverlay} />
          </div>
          <div className={styles.signalRow}>
            <span className={styles.signalLamp} />
            <span className={styles.signalText}>YouTube main player</span>
          </div>
        </div>

        <div className={styles.content}>
          <div className={styles.header}>
            <div className={styles.titleBlock}>
              <p className="section-label">Music dock</p>
              <h3>{currentTrack?.title || 'Awaiting source'}</h3>
              <p className={styles.artist}>
                {currentTrack?.artist || 'No published track available'}
              </p>
            </div>
            <div className={styles.meta}>
              <span className={styles.status}>{statusLabel}</span>
              <a
                className={styles.reference}
                href={currentTrack?.youtubeUrl || '#'}
                target="_blank"
                rel="noreferrer"
                onClick={(event) => {
                  if (!currentTrack?.youtubeUrl) {
                    event.preventDefault();
                  }
                }}
              >
                YouTube source
              </a>
            </div>
          </div>

          <button
            type="button"
            className={styles.scrub}
            onClick={(event) => {
              if (!duration) {
                return;
              }

              const rect = event.currentTarget.getBoundingClientRect();
              const ratio = (event.clientX - rect.left) / rect.width;
              seekTo(duration * ratio);
              void trackEvent('music_seek', { ratio, trackId: currentTrack?.id || '' });
            }}
          >
            <span className={styles.scrubTrack} />
            <span className={styles.scrubFill} style={{ width: `${progress}%` }} />
            <span className={styles.scrubSpecular} />
          </button>

          <div className={styles.timeRow}>
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>

          <div className={styles.controls}>
            <button
              type="button"
              className={`${styles.transport} ${styles.secondary}`.trim()}
              onClick={() => {
                prev();
                void trackEvent('music_prev', { trackId: currentTrack?.id || '' });
              }}
            >
              Prev
            </button>

            <button
              type="button"
              className={`${styles.transport} ${styles.primary}`.trim()}
              onClick={() => {
                if (playing) {
                  pause();
                  void trackEvent('music_pause', { trackId: currentTrack?.id || '' });
                } else {
                  void play();
                  void trackEvent('music_play', { trackId: currentTrack?.id || '' });
                }
              }}
            >
              {playing ? 'Pause' : 'Play'}
            </button>

            <button
              type="button"
              className={`${styles.transport} ${styles.secondary}`.trim()}
              onClick={() => {
                next();
                void trackEvent('music_next', { trackId: currentTrack?.id || '' });
              }}
            >
              Next
            </button>
          </div>

          <label className={styles.volume}>
            <span>Volume</span>
            <div className={styles.volumeShell}>
              <input
                type="range"
                min="0"
                max="100"
                value={volume}
                onChange={(event) => {
                  const nextVolume = Number(event.target.value);
                  setVolume(nextVolume);
                  void trackEvent('music_volume', {
                    trackId: currentTrack?.id || '',
                    value: nextVolume,
                  });
                }}
              />
            </div>
          </label>
        </div>
      </div>
    </aside>
  );

  if (!isMounted) {
    return null;
  }

  return createPortal(content, isFooterMode && dockTarget ? dockTarget : document.body);
}
