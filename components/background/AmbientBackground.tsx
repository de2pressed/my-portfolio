"use client";

import { useEffect, useRef } from "react";

import { useMusicFrequency } from "@/hooks/useMusicFrequency";
import { useThemeColors } from "@/hooks/useThemeColors";

function hexToRgba(hex: string, alpha: number) {
  const normalized = hex.replace("#", "");
  const expanded =
    normalized.length === 3 ? normalized.split("").map((part) => `${part}${part}`).join("") : normalized;
  const red = Number.parseInt(expanded.slice(0, 2), 16);
  const green = Number.parseInt(expanded.slice(2, 4), 16);
  const blue = Number.parseInt(expanded.slice(4, 6), 16);
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

export function AmbientBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { energy, currentTime, duration, thumbnailColors, isPlaying } = useMusicFrequency();
  const { palette } = useThemeColors();
  const energyRef = useRef(energy);
  const paletteRef = useRef(palette);
  const thumbnailColorsRef = useRef(thumbnailColors);
  const songTimeRef = useRef(0);
  const durationRef = useRef(0);
  const songTimeUpdateRef = useRef(0);
  const isPlayingRef = useRef(isPlaying);
  const smoothedSignalsRef = useRef([0, 0, 0, 0]); // EMA smoothing for 4 bands

  useEffect(() => {
    energyRef.current = energy;
  }, [energy]);

  useEffect(() => {
    paletteRef.current = palette;
  }, [palette]);

  useEffect(() => {
    thumbnailColorsRef.current = thumbnailColors;
  }, [thumbnailColors]);

  useEffect(() => {
    songTimeRef.current = currentTime;
    songTimeUpdateRef.current = performance.now(); // Record wall clock time of update
  }, [currentTime]);

  useEffect(() => {
    durationRef.current = duration;
  }, [duration]);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const context = canvas.getContext("2d");
    if (!context) {
      return;
    }

    let animationFrame = 0;

    type GradientConfig = {
      x: number;
      y: number;
      anchorX: number;
      anchorY: number;
      radius: number;
      color: string;
      bandRole: number; // 0=bass, 1=vocals, 2=synth, 3=beat
      phaseOffset: number;
    };

    const resize = () => {
      const ratio = Math.min(window.devicePixelRatio || 1, 1.8);
      canvas.width = Math.floor(window.innerWidth * ratio);
      canvas.height = Math.floor(window.innerHeight * ratio);
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
    };

    resize();

    const width = window.innerWidth;
    const height = window.innerHeight;

    const gradients: GradientConfig[] = [
      {
        // BASS — top-left quadrant
        x: width * 0.25,
        y: height * 0.25,
        anchorX: 0.25,
        anchorY: 0.25,
        radius: Math.min(width, height) * 0.4,
        color: thumbnailColorsRef.current[0],
        bandRole: 0,
        phaseOffset: 0,
      },
      {
        // VOCALS — top-right quadrant
        x: width * 0.75,
        y: height * 0.25,
        anchorX: 0.75,
        anchorY: 0.25,
        radius: Math.min(width, height) * 0.35,
        color: thumbnailColorsRef.current[1],
        bandRole: 1,
        phaseOffset: 1.5,
      },
      {
        // SYNTH — bottom-left quadrant
        x: width * 0.25,
        y: height * 0.75,
        anchorX: 0.25,
        anchorY: 0.75,
        radius: Math.min(width, height) * 0.3,
        color: thumbnailColorsRef.current[2],
        bandRole: 2,
        phaseOffset: 3,
      },
      {
        // BEAT — bottom-right quadrant
        x: width * 0.75,
        y: height * 0.75,
        anchorX: 0.75,
        anchorY: 0.75,
        radius: Math.min(width, height) * 0.25,
        color: thumbnailColorsRef.current[3],
        bandRole: 3,
        phaseOffset: 4.5,
      },
    ];

    const draw = (time: number) => {
      const baseLevel = Math.max(0, Math.min(1, energyRef.current));
      const width = window.innerWidth;
      const height = window.innerHeight;

      // Convert time from ms to seconds for frequency calculations
      const t = time / 1000;

      context.clearRect(0, 0, width, height);

      // Background is now black
      context.fillStyle = "rgba(0,0,0,1)";
      context.fillRect(0, 0, width, height);

      // Interpolate song time for smooth 60fps progression instead of 400ms jumps
      // YouTube's getCurrentTime() updates every ~250ms, so we estimate between updates
      const timeSinceUpdate = (performance.now() - songTimeUpdateRef.current) / 1000;
      const interpolatedSongTime = Math.max(0, songTimeRef.current + timeSinceUpdate);
      // Subtract 10ms to delay visuals so they align with audio reaching the ears
      const songT = Math.max(0, interpolatedSongTime - 0.01);
      const songDur = durationRef.current || 180; // default 3 min
      const songProgress = songT / songDur; // 0..1 across the whole song

      // Chorus detection: boost signals during typical chorus sections (0.25-0.4, 0.65-0.8)
      const isChorus = (songProgress >= 0.25 && songProgress <= 0.4) || (songProgress >= 0.65 && songProgress <= 0.8);
      const chorusBoost = isChorus ? 1.3 : 1.0;

      // Idle animation: when paused, use gentle sine wave from wall-clock time
      const isIdle = baseLevel === 0;
      const idleSignal = isIdle ? 0.4 + 0.15 * Math.sin(t * 0.5) : 0;

      for (const gradient of gradients) {
        const bandRole = gradient.bandRole;
        const phaseOffset = gradient.phaseOffset;

        // Song-structure drift
        const structureDrift = Math.sin(songProgress * Math.PI * 4 + phaseOffset) * 0.2;
        const structureDrift2 = Math.cos(songProgress * Math.PI * 6 + phaseOffset * 0.7) * 0.15;

        // Per-band staggered time offset
        const bandDelay = bandRole * 0.04;
        const bandT = Math.max(0, songT - bandDelay);

        // Band-specific signal
        let bandSignal = 0;
        let radiusScale = 1;
        let opacityScale = 0.5;

        switch (bandRole) {
          case 0: {
            // BASS — heavy, sustained low-frequency pulses (0.5-1.0 Hz)
            // Uses asymmetric power curve: slow rise, quick fall for kick-drum feel
            const bassFreq = 0.8 + structureDrift * 0.3;
            const rawBass = Math.sin(bandT * bassFreq * Math.PI * 2 + phaseOffset);
            // Asymmetric: positive values sustain (power 0.4), negative values decay quickly (power 4)
            bandSignal = rawBass > 0 ? Math.pow(rawBass, 0.4) : Math.pow(Math.abs(rawBass), 4) * 0.1;
            radiusScale = 1.8;
            opacityScale = 0.6;
            break;
          }
          case 1: {
            // VOCALS — mid-high frequency (3.5 Hz) with asymmetric sustain for vocal-like behavior
            const vocalFreq = 3.5 + structureDrift * 0.4;
            const rawVocal = Math.sin(bandT * vocalFreq * Math.PI * 2 + phaseOffset);
            // Asymmetric: positive values sustain (power 0.5), negative values decay (power 2)
            bandSignal = rawVocal > 0 ? Math.pow(rawVocal, 0.5) : Math.pow(Math.abs(rawVocal), 2) * 0.2;
            radiusScale = 1.0;
            opacityScale = 0.7;
            break;
          }
          case 2: {
            // SYNTH — continuous ambient variation from summed high frequencies (8-16 Hz)
            // Sum of 3 sines at different frequencies for complex, non-periodic appearance
            const t1 = Math.sin(bandT * 8.0 * Math.PI * 2 + phaseOffset);
            const t2 = Math.sin(bandT * 12.0 * Math.PI * 2 + phaseOffset * 1.3);
            const t3 = Math.sin(bandT * 16.0 * Math.PI * 2 + phaseOffset * 0.7);
            const combined = (t1 + t2 + t3) / 3;
            // Apply structure drift for subtle song-structure variation
            const driftMod = 1 + structureDrift2 * 0.5;
            bandSignal = Math.abs(combined) * driftMod;
            radiusScale = 0.4;
            opacityScale = 0.35;
            break;
          }
          case 3: {
            // BEAT — amplitude-modulated sine for rhythmic variation (1.5-2.5 Hz)
            // Creates "beating" pattern: sine wave modulated by another sine
            const beatFreq = 2.0 + structureDrift * 0.5;
            const modFreq = beatFreq * 0.5;
            const carrier = Math.sin(bandT * beatFreq * Math.PI * 2 + phaseOffset);
            const modulator = 0.5 + 0.5 * Math.sin(bandT * modFreq * Math.PI * 2 + phaseOffset * 0.7);
            bandSignal = Math.abs(carrier * modulator);
            radiusScale = 1.2;
            opacityScale = 0.5;
            break;
          }
        }

        // Apply EMA smoothing to reduce flicker
        const alpha = 0.3; // Smoothing factor
        const smoothed = alpha * bandSignal + (1 - alpha) * smoothedSignalsRef.current[bandRole];
        smoothedSignalsRef.current[bandRole] = smoothed;
        bandSignal = smoothed;

        // Apply chorus boost for song structure sync
        bandSignal *= chorusBoost;

        const effectiveLevel = isIdle ? idleSignal : baseLevel * (0.3 + bandSignal * 0.7);

        // Update gradient position based on movement pattern
        let x = width * gradient.anchorX;
        let y = height * gradient.anchorY;

        if (bandRole === 0) {
          // BASS: expands/contracts from center, orbits slowly
          const orbitRadius = 30 + effectiveLevel * 50;
          const orbitSpeed = 0.0005;
          const angle = t * orbitSpeed + phaseOffset;
          x += Math.cos(angle) * orbitRadius;
          y += Math.sin(angle) * orbitRadius;
        } else if (bandRole === 1) {
          // VOCALS: gentle breathing/undulating motion (expands and contracts from center)
          const breatheRadius = 20 + effectiveLevel * 40;
          const breatheFreq = 0.0012;
          const breatheX = Math.sin(t * breatheFreq + phaseOffset) * breatheRadius;
          const breatheY = Math.cos(t * breatheFreq * 0.8 + phaseOffset * 0.6) * breatheRadius;
          x += breatheX;
          y += breatheY;
        } else if (bandRole === 2) {
          // SYNTH: moves in Lissajous figure (figure-8)
          const lissajousA = 60 + effectiveLevel * 40;
          const lissajousB = 40 + effectiveLevel * 30;
          const lissajousFreqX = 0.002;
          const lissajousFreqY = 0.003;
          x += Math.sin(t * lissajousFreqX + phaseOffset) * lissajousA;
          y += Math.sin(t * lissajousFreqY + phaseOffset * 0.7) * lissajousB;
        } else {
          // BEAT: drifts horizontally in sine wave
          const driftAmount = 50 + effectiveLevel * 80;
          const driftFreq = 0.001;
          x += Math.sin(t * driftFreq + phaseOffset) * driftAmount;
        }

        // Update gradient config
        gradient.x = x;
        gradient.y = y;

        // Calculate radius and opacity based on band signal
        const currentRadius = gradient.radius * (1 + effectiveLevel * radiusScale);
        const currentOpacity = 0.2 + effectiveLevel * opacityScale;

        // Render gradient
        const radial = context.createRadialGradient(x, y, 0, x, y, currentRadius);
        radial.addColorStop(0, hexToRgba(gradient.color, currentOpacity));
        radial.addColorStop(0.4, hexToRgba(gradient.color, currentOpacity * 0.6));
        radial.addColorStop(0.7, hexToRgba(gradient.color, currentOpacity * 0.3));
        radial.addColorStop(1, hexToRgba(gradient.color, 0));

        context.save();
        context.globalCompositeOperation = "screen";
        context.filter = `blur(20px)`;
        context.fillStyle = radial;
        context.fillRect(0, 0, width, height);
        context.restore();
      }

      animationFrame = window.requestAnimationFrame(draw);
    };

    animationFrame = window.requestAnimationFrame(draw);
    window.addEventListener("resize", resize);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener("resize", resize);
    };
  }, [thumbnailColors]);

  return <canvas ref={canvasRef} className="fixed inset-0 z-0 h-full w-full opacity-100" aria-hidden="true" />;
}
