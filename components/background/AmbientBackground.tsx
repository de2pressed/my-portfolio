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
  const { energy, currentTime, duration, thumbnailColors } = useMusicFrequency();
  const { palette } = useThemeColors();
  const energyRef = useRef(energy);
  const paletteRef = useRef(palette);
  const thumbnailColorsRef = useRef(thumbnailColors);
  const songTimeRef = useRef(0);
  const durationRef = useRef(0);
  const songTimeUpdateRef = useRef(0);

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
      bandRole: number; // 0=bass, 1=mid, 2=high, 3=texture
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
        // MID — top-right quadrant
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
        // HIGH — bottom-left quadrant
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
        // TEXTURE — bottom-right quadrant
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
        let bandSignal: number;
        let radiusScale: number;
        let opacityScale: number;

        switch (bandRole) {
          case 0: {
            // BASS — expands/contracts with heavy pulse
            const freq = 0.7 + structureDrift;
            const rawBass = Math.sin(bandT * freq * Math.PI * 2 + phaseOffset);
            bandSignal = rawBass > 0 ? Math.pow(rawBass, 0.6) : Math.pow(Math.abs(rawBass), 3) * 0.15;
            radiusScale = 1.5;
            opacityScale = 0.5;
            break;
          }
          case 1: {
            // MID — gentle pulse
            const freq = 1.5 + structureDrift * 0.7;
            bandSignal = Math.pow(Math.abs(Math.sin(bandT * freq * Math.PI * 2 + phaseOffset * 1.3)), 1.5);
            radiusScale = 1.0;
            opacityScale = 0.4;
            break;
          }
          case 2: {
            // HIGH — sharp flicker
            const freq = 3.2 + structureDrift2;
            bandSignal = Math.pow(Math.abs(Math.cos(bandT * freq * Math.PI * 2 + phaseOffset * 0.7)), 3);
            radiusScale = 0.5;
            opacityScale = 0.7;
            break;
          }
          default: {
            // TEXTURE — subtle ripple
            const freq = 5.5 + structureDrift2 * 0.5;
            bandSignal = Math.abs(Math.sin(bandT * freq * Math.PI * 2 + phaseOffset * 2.1));
            radiusScale = 0.3;
            opacityScale = 0.3;
            break;
          }
        }

        const effectiveLevel = baseLevel * (0.3 + bandSignal * 0.7);

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
          // MID: drifts horizontally in sine wave
          const driftAmount = 50 + effectiveLevel * 80;
          const driftFreq = 0.001;
          x += Math.sin(t * driftFreq + phaseOffset) * driftAmount;
        } else if (bandRole === 2) {
          // HIGH: moves in Lissajous figure (figure-8)
          const lissajousA = 60 + effectiveLevel * 40;
          const lissajousB = 40 + effectiveLevel * 30;
          const lissajousFreqX = 0.002;
          const lissajousFreqY = 0.003;
          x += Math.sin(t * lissajousFreqX + phaseOffset) * lissajousA;
          y += Math.sin(t * lissajousFreqY + phaseOffset * 0.7) * lissajousB;
        } else {
          // TEXTURE: spirals slowly around anchor
          const spiralRadius = 40 + effectiveLevel * 30;
          const spiralSpeed = 0.0008;
          const spiralExpansion = 0.0003;
          const angle = t * spiralSpeed + phaseOffset;
          const radius = spiralRadius + Math.sin(t * spiralExpansion) * 20;
          x += Math.cos(angle) * radius;
          y += Math.sin(angle) * radius;
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
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 z-0 h-full w-full opacity-100" aria-hidden="true" />;
}
