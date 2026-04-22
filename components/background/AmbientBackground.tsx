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
    const mediaQuery = window.matchMedia("(max-width: 768px)");
    const particleCount = mediaQuery.matches ? 250 : 400;
    const fallbackPalette = palette.length > 0 ? palette : ["#151019", "#b93ca7", "#7b5fd1", "#f0dcff"];

    type ParticleConfig = {
      x: number;
      y: number;
      vx: number;
      vy: number;
      baseX: number;
      baseY: number;
      size: number;
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

    const particles: ParticleConfig[] = Array.from({ length: particleCount }, (_, index) => {
      const bandRole = index % 4;
      const colors = thumbnailColorsRef.current.length > 0 ? thumbnailColorsRef.current : fallbackPalette;
      const size = 1 + Math.random() * 2;
      const baseX = Math.random() * window.innerWidth;
      const baseY = Math.random() * window.innerHeight;

      return {
        x: baseX,
        y: baseY,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        baseX,
        baseY,
        size,
        color: colors[index % colors.length] ?? "#b93ca7",
        bandRole,
        phaseOffset: index * 0.83,
      };
    });

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

      // Motion trails: semi-transparent clear instead of full clear
      context.fillStyle = "rgba(0, 0, 0, 0.12)";
      context.fillRect(0, 0, width, height);

      for (const particle of particles) {
        const bandRole = particle.bandRole;
        const phaseOffset = particle.phaseOffset;

        // Song-structure drift
        const structureDrift = Math.sin(songProgress * Math.PI * 4 + phaseOffset) * 0.2;
        const structureDrift2 = Math.cos(songProgress * Math.PI * 6 + phaseOffset * 0.7) * 0.15;

        // Per-band staggered time offset
        const bandDelay = bandRole * 0.04;
        const bandT = Math.max(0, songT - bandDelay);

        // Band-specific signal
        let bandSignal: number;
        let velocityScale: number;

        switch (bandRole) {
          case 0: {
            // BASS — pulse outward from center, then drift back
            const freq = 0.7 + structureDrift;
            const rawBass = Math.sin(bandT * freq * Math.PI * 2 + phaseOffset);
            bandSignal = rawBass > 0 ? Math.pow(rawBass, 0.6) : Math.pow(Math.abs(rawBass), 3) * 0.15;
            velocityScale = 2 + bandSignal * 3;
            break;
          }
          case 1: {
            // MID — orbit in gentle circular patterns
            const freq = 1.5 + structureDrift * 0.7;
            bandSignal = Math.pow(Math.abs(Math.sin(bandT * freq * Math.PI * 2 + phaseOffset * 1.3)), 1.5);
            velocityScale = 0.5 + bandSignal * 1;
            break;
          }
          case 2: {
            // HIGH — scatter randomly when energy spikes
            const freq = 3.2 + structureDrift2;
            bandSignal = Math.pow(Math.abs(Math.cos(bandT * freq * Math.PI * 2 + phaseOffset * 0.7)), 3);
            velocityScale = bandSignal > 0.5 ? 4 : 0.5;
            break;
          }
          default: {
            // TEXTURE — flow in wave-like patterns
            const freq = 5.5 + structureDrift2 * 0.5;
            bandSignal = Math.abs(Math.sin(bandT * freq * Math.PI * 2 + phaseOffset * 2.1));
            velocityScale = 0.3 + bandSignal * 0.5;
            break;
          }
        }

        const effectiveLevel = baseLevel * (0.3 + bandSignal * 0.7);

        // Update particle position based on band behavior
        const centerX = width / 2;
        const centerY = height / 2;

        if (bandRole === 0) {
          // BASS: pulse outward from center
          const dx = particle.x - centerX;
          const dy = particle.y - centerY;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const dirX = dx / (dist || 1);
          const dirY = dy / (dist || 1);
          particle.vx += dirX * effectiveLevel * velocityScale * 0.01;
          particle.vy += dirY * effectiveLevel * velocityScale * 0.01;
          // Drift back to base
          particle.vx += (particle.baseX - particle.x) * 0.002;
          particle.vy += (particle.baseY - particle.y) * 0.002;
        } else if (bandRole === 1) {
          // MID: orbit around base point
          const orbitRadius = 50 + effectiveLevel * 30;
          const orbitSpeed = 0.001 + effectiveLevel * 0.002;
          const angle = t * orbitSpeed + phaseOffset;
          particle.vx += Math.cos(angle) * orbitRadius * 0.01;
          particle.vy += Math.sin(angle) * orbitRadius * 0.01;
          // Return to base
          particle.vx += (particle.baseX - particle.x) * 0.003;
          particle.vy += (particle.baseY - particle.y) * 0.003;
        } else if (bandRole === 2) {
          // HIGH: scatter randomly
          if (effectiveLevel > 0.4) {
            particle.vx += (Math.random() - 0.5) * effectiveLevel * 2;
            particle.vy += (Math.random() - 0.5) * effectiveLevel * 2;
          }
          particle.vx += (particle.baseX - particle.x) * 0.005;
          particle.vy += (particle.baseY - particle.y) * 0.005;
        } else {
          // TEXTURE: wave-like flow
          const waveFreq = 0.002 + effectiveLevel * 0.001;
          particle.vx += Math.sin(t * waveFreq + phaseOffset) * 0.5;
          particle.vy += Math.cos(t * waveFreq * 0.8 + phaseOffset) * 0.5;
          // Gentle return to base
          particle.vx += (particle.baseX - particle.x) * 0.001;
          particle.vy += (particle.baseY - particle.y) * 0.001;
        }

        // Apply velocity with damping
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.vx *= 0.95;
        particle.vy *= 0.95;

        // Wrap around screen edges
        if (particle.x < 0) particle.x = width;
        if (particle.x > width) particle.x = 0;
        if (particle.y < 0) particle.y = height;
        if (particle.y > height) particle.y = 0;

        // Render particle
        const opacity = 0.3 + effectiveLevel * 0.5;
        const size = particle.size * (1 + effectiveLevel * 0.5);

        context.save();
        context.globalCompositeOperation = "screen";
        context.filter = `blur(1px)`;
        context.fillStyle = hexToRgba(particle.color, opacity);
        context.beginPath();
        context.arc(particle.x, particle.y, size, 0, Math.PI * 2);
        context.fill();
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
