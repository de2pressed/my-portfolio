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

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function hexToRgb(hex: string) {
  const normalized = hex.replace("#", "");
  const expanded =
    normalized.length === 3 ? normalized.split("").map((part) => `${part}${part}`).join("") : normalized;
  const red = Number.parseInt(expanded.slice(0, 2), 16);
  const green = Number.parseInt(expanded.slice(2, 4), 16);
  const blue = Number.parseInt(expanded.slice(4, 6), 16);
  return { red, green, blue };
}

function rgbToHex(red: number, green: number, blue: number) {
  return `#${[red, green, blue]
    .map((value) => clamp(Math.round(value), 0, 255).toString(16).padStart(2, "0"))
    .join("")}`;
}

function rgbToHsl(red: number, green: number, blue: number) {
  const r = red / 255;
  const g = green / 255;
  const b = blue / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const lightness = (max + min) / 2;

  if (max === min) {
    return { hue: 0, saturation: 0, lightness };
  }

  const delta = max - min;
  const saturation = lightness > 0.5 ? delta / (2 - max - min) : delta / (max + min);
  let hue = 0;

  switch (max) {
    case r:
      hue = (g - b) / delta + (g < b ? 6 : 0);
      break;
    case g:
      hue = (b - r) / delta + 2;
      break;
    default:
      hue = (r - g) / delta + 4;
      break;
  }

  return { hue: hue / 6, saturation, lightness };
}

function hslToRgb(hue: number, saturation: number, lightness: number) {
  if (saturation === 0) {
    const value = lightness * 255;
    return { red: value, green: value, blue: value };
  }

  const hueToRgb = (p: number, q: number, t: number) => {
    let nextT = t;
    if (nextT < 0) {
      nextT += 1;
    }
    if (nextT > 1) {
      nextT -= 1;
    }
    if (nextT < 1 / 6) {
      return p + (q - p) * 6 * nextT;
    }
    if (nextT < 1 / 2) {
      return q;
    }
    if (nextT < 2 / 3) {
      return p + (q - p) * (2 / 3 - nextT) * 6;
    }
    return p;
  };

  const q = lightness < 0.5 ? lightness * (1 + saturation) : lightness + saturation - lightness * saturation;
  const p = 2 * lightness - q;
  const red = hueToRgb(p, q, hue + 1 / 3) * 255;
  const green = hueToRgb(p, q, hue) * 255;
  const blue = hueToRgb(p, q, hue - 1 / 3) * 255;
  return { red, green, blue };
}

function boostCanvasColor(hex: string) {
  const { red, green, blue } = hexToRgb(hex);
  const { hue, saturation, lightness } = rgbToHsl(red, green, blue);
  // Much gentler boost to preserve original colors
  const saturationBoost = saturation < 0.45 ? 1.15 : 1.05;
  const lightnessBoost = lightness < 0.38 ? 1.05 : 1.02;
  const boostedSaturation = clamp(saturation * saturationBoost + 0.02, 0.35, 0.85);
  const boostedLightness = clamp(lightness * lightnessBoost + 0.01, 0.25, 0.65);
  const boosted = hslToRgb(hue, boostedSaturation, boostedLightness);
  return rgbToHex(boosted.red, boosted.green, boosted.blue);
}

export function AmbientBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { energy, currentTime, duration } = useMusicFrequency();
  const { palette } = useThemeColors();
  const energyRef = useRef(energy);
  const paletteRef = useRef(palette);
  const songTimeRef = useRef(0);
  const durationRef = useRef(0);
  const songTimeUpdateRef = useRef(0); // Track when currentTime was last updated

  useEffect(() => {
    energyRef.current = energy;
  }, [energy]);

  useEffect(() => {
    paletteRef.current = palette;
  }, [palette]);

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
    const blobCount = mediaQuery.matches ? 7 : 11;
    const fallbackPalette = palette.length > 0 ? palette : ["#151019", "#b93ca7", "#7b5fd1", "#f0dcff"];
    const canvasPalette = fallbackPalette.map(boostCanvasColor);
    const anchorPositions = mediaQuery.matches
      ? [
          { x: 0.06, y: 0.08 },
          { x: 0.52, y: 0.09 },
          { x: 0.92, y: 0.14 },
          { x: 0.16, y: 0.34 },
          { x: 0.86, y: 0.36 },
          { x: 0.08, y: 0.82 },
          { x: 0.66, y: 0.84 },
        ]
      : [
          { x: 0.04, y: 0.08 },
          { x: 0.22, y: 0.1 },
          { x: 0.46, y: 0.08 },
          { x: 0.7, y: 0.1 },
          { x: 0.92, y: 0.12 },
          { x: 0.08, y: 0.34 },
          { x: 0.32, y: 0.26 },
          { x: 0.82, y: 0.28 },
          { x: 0.95, y: 0.48 },
          { x: 0.1, y: 0.82 },
          { x: 0.36, y: 0.9 },
          { x: 0.58, y: 0.82 },
          { x: 0.82, y: 0.88 },
          { x: 0.94, y: 0.74 },
        ];

    type BlobConfig = {
      anchorX: number;
      anchorY: number;
      orbitX: number;
      orbitY: number;
      size: number;
      speed: number;
      color: string;
      phase: number;
      drift: number;
      kind: "orbit" | "drift" | "cross";
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

    const blobs: BlobConfig[] = Array.from({ length: blobCount }, (_, index) => {
      const anchor = anchorPositions[index % anchorPositions.length] ?? { x: 0.5, y: 0.5 };
      const edgeBoost = anchor.x < 0.16 || anchor.x > 0.84 || anchor.y < 0.16 || anchor.y > 0.84;
      const isSmall = mediaQuery.matches ? index % 4 === 0 || index % 5 === 1 : index % 3 === 0;
      const size = isSmall
        ? 58 + (index % 4) * 10 + (edgeBoost ? 6 : 0)
        : 108 + (index % 5) * (mediaQuery.matches ? 12 : 18) + (edgeBoost ? 22 : 0);

      return {
        anchorX: anchor.x,
        anchorY: anchor.y,
        orbitX:
          (mediaQuery.matches ? 40 : 88) + (index % 4) * (mediaQuery.matches ? 12 : 26) + (edgeBoost ? 18 : 0),
        orbitY:
          (mediaQuery.matches ? 26 : 58) + (index % 5) * (mediaQuery.matches ? 8 : 16) + (edgeBoost ? 12 : 0),
        size,
        speed: (isSmall ? 0.0016 : 0.00066) + (index % 5) * (isSmall ? 0.00024 : 0.00012),
        color: fallbackPalette[index % fallbackPalette.length] ?? "#e8bc8a",
        phase: index * 0.83,
        drift: isSmall ? 0.5 + (index % 3) * 0.12 : 0.24 + (index % 4) * 0.06,
        kind: index % 3 === 0 ? "cross" : index % 2 === 0 ? "drift" : "orbit",
      };
    });

    const draw = (time: number) => {
      const baseLevel = Math.max(0, Math.min(1, energyRef.current));
      const currentPalette = paletteRef.current.length > 0 ? paletteRef.current : fallbackPalette;
      const vibrantPalette = currentPalette.map(boostCanvasColor);
      const width = window.innerWidth;
      const height = window.innerHeight;

      // Convert time from ms to seconds for frequency calculations
      const t = time / 1000;

      context.clearRect(0, 0, width, height);

      // Background gradient reacts subtly to energy
      const gradient = context.createRadialGradient(
        width * 0.5,
        height * 0.34,
        0,
        width * 0.5,
        height * 0.34,
        Math.max(width, height) * 0.68,
      );
      gradient.addColorStop(0, `rgba(76,16,64,${0.58 - baseLevel * 0.07})`);
      gradient.addColorStop(0.16, `rgba(20,6,24,${0.88 - baseLevel * 0.04})`);
      gradient.addColorStop(0.42, `rgba(5,5,8,${0.97 - baseLevel * 0.02})`);
      gradient.addColorStop(1, "rgba(0,0,0,1)");
      context.fillStyle = gradient;
      context.fillRect(0, 0, width, height);

      // Glow points pulse with bass frequency
      const bassPulse = Math.pow(Math.abs(Math.sin(t * 3.14)), 2);
      const glowIntensity = baseLevel * (0.3 + bassPulse * 0.7);
      const glowPoints = [
        { x: width * 0.08, y: height * 0.1, opacity: 0.14 + glowIntensity * 0.28, color: vibrantPalette[0] ?? canvasPalette[0] ?? "#b93ca7" },
        { x: width * 0.92, y: height * 0.12, opacity: 0.13 + glowIntensity * 0.24, color: vibrantPalette[1] ?? canvasPalette[1] ?? "#7b5fd1" },
        { x: width * 0.08, y: height * 0.86, opacity: 0.12 + glowIntensity * 0.22, color: vibrantPalette[2] ?? canvasPalette[2] ?? "#2e7a73" },
        { x: width * 0.92, y: height * 0.84, opacity: 0.13 + glowIntensity * 0.24, color: vibrantPalette[3] ?? canvasPalette[3] ?? "#f0dcff" },
      ];

      for (const point of glowPoints) {
        const halo = context.createRadialGradient(point.x, point.y, 0, point.x, point.y, Math.max(width, height) * 0.18);
        halo.addColorStop(0, hexToRgba(point.color, point.opacity));
        halo.addColorStop(1, hexToRgba(point.color, 0));
        context.save();
        context.globalCompositeOperation = "screen";
        context.fillStyle = halo;
        context.fillRect(0, 0, width, height);
        context.restore();
      }

      // Interpolate song time for smooth 60fps progression instead of 400ms jumps
      // YouTube's getCurrentTime() updates every ~250ms, so we estimate between updates
      const timeSinceUpdate = (performance.now() - songTimeUpdateRef.current) / 1000;
      const interpolatedSongTime = Math.max(0, songTimeRef.current + timeSinceUpdate);
      // Subtract 10ms to delay visuals so they align with audio reaching the ears
      const songT = Math.max(0, interpolatedSongTime - 0.01);
      const songDur = durationRef.current || 180; // default 3 min
      const songProgress = songT / songDur; // 0..1 across the whole song

      for (const [index, blob] of blobs.entries()) {
        blob.color = vibrantPalette[index % vibrantPalette.length] ?? blob.color;

        const blobTime = t * blob.speed * 1000;
        const phaseOffset = blob.phase;

        // Each blob represents ONE distinct frequency band of the song
        const bandRole = index % 4; // 0=bass, 1=mid, 2=high, 3=texture

        // Song-structure drift: use the song's actual position to shift patterns
        const structureDrift = Math.sin(songProgress * Math.PI * 4 + phaseOffset) * 0.2;
        const structureDrift2 = Math.cos(songProgress * Math.PI * 6 + phaseOffset * 0.7) * 0.15;

        // Per-band staggered time offset so bands don't all peak simultaneously
        // Bass hits first, then mid, then high, then texture — like a real drum hit cascade
        const bandDelay = bandRole * 0.04; // 0, 40ms, 80ms, 120ms stagger
        const bandT = Math.max(0, songT - bandDelay);

        // Each band has its OWN distinct frequency, behavior, and PRIMARY VISUAL CHANNEL
        // Bass = SIZE dominant, Mid = SIZE + OPACITY balanced, High = OPACITY flicker, Texture = OPACITY ripple only
        let bandSignal: number;
        let pulseScale: number;
        let pulseCap: number;
        let swayAmount: number;
        let swayFreq: number;
        let baseOpacity: number;
        let opacityScale: number;
        let blurBase: number;
        let blurRange: number;
        let saturationBoost: number;

        switch (bandRole) {
          case 0: {
            // BASS — heavy kick, SIZE is the primary channel
            // Sharp attack + slow decay, big heave
            const freq = 0.7 + structureDrift;
            const rawBass = Math.sin(bandT * freq * Math.PI * 2 + phaseOffset);
            bandSignal = rawBass > 0 ? Math.pow(rawBass, 0.6) : Math.pow(Math.abs(rawBass), 3) * 0.15;
            pulseScale = 1.3;     // up to 2.3× — SIZE dominant
            pulseCap = 2.3;
            swayAmount = 18;      // big positional heave
            swayFreq = freq;
            baseOpacity = 0.28;   // lower base opacity
            opacityScale = 0.35;  // opacity changes LESS — size is the star
            blurBase = 24;
            blurRange = 16;       // more blur reduction = sharper at peak
            saturationBoost = 0.4;
            break;
          }
          case 1: {
            // MID — smooth rhythmic pulse, SIZE + OPACITY balanced
            const freq = 1.5 + structureDrift * 0.7;
            bandSignal = Math.pow(Math.abs(Math.sin(bandT * freq * Math.PI * 2 + phaseOffset * 1.3)), 1.5);
            pulseScale = 0.75;    // moderate size change
            pulseCap = 1.8;
            swayAmount = 12;     // moderate sway
            swayFreq = freq * 0.8;
            baseOpacity = 0.26;
            opacityScale = 0.5;  // balanced opacity change
            blurBase = 20;
            blurRange = 12;
            saturationBoost = 0.3;
            break;
          }
          case 2: {
            // HIGH — sharp flicker, OPACITY is the primary channel
            const freq = 3.2 + structureDrift2;
            bandSignal = Math.pow(Math.abs(Math.cos(bandT * freq * Math.PI * 2 + phaseOffset * 0.7)), 3);
            pulseScale = 0.25;   // minimal size change — OPACITY is the star
            pulseCap = 1.3;
            swayAmount = 6;      // small jitter
            swayFreq = freq * 0.6;
            baseOpacity = 0.2;   // lower base — flickers FROM dim
            opacityScale = 0.7;  // BIG opacity swings — the main visual
            blurBase = 14;
            blurRange = 8;
            saturationBoost = 0.2;
            break;
          }
          default: {
            // TEXTURE — fast fine ripple, OPACITY ONLY — barely any size change
            const freq = 5.5 + structureDrift2 * 0.5;
            bandSignal = Math.abs(Math.sin(bandT * freq * Math.PI * 2 + phaseOffset * 2.1));
            pulseScale = 0.08;   // almost NO size change
            pulseCap = 1.1;
            swayAmount = 3;      // minimal movement
            swayFreq = freq * 0.4;
            baseOpacity = 0.18;  // starts dim
            opacityScale = 0.8;  // OPACITY ripple is the ONLY visual channel
            blurBase = 10;
            blurRange = 6;
            saturationBoost = 0.15;
            break;
          }
        }

        // baseLevel gates everything — no reaction when music is off
        // bandSignal modulates the intensity so each blob "breathes" with its band
        const effectiveLevel = baseLevel * (0.3 + bandSignal * 0.7);

        // Pulse: size oscillation driven by band
        const rawPulse = 1 + effectiveLevel * pulseScale;
        const pulse = Math.min(pulseCap, Math.max(1.0, rawPulse));

        // Reduce default orbital movement when music is active so visualizer is more visible
        const orbitalDamp = 1 - baseLevel * 0.6;

        // Position movement
        const crossSweep = (Math.sin(blobTime * 0.32 + phaseOffset) + 1) / 2;
        let x = width * blob.anchorX;
        let y = height * blob.anchorY;

        // Band-specific sway driven by song time
        const swayX = effectiveLevel * Math.sin(bandT * swayFreq * Math.PI * 2 + phaseOffset * 3.0) * swayAmount;
        const swayY = effectiveLevel * Math.cos(bandT * swayFreq * Math.PI * 1.6 + phaseOffset * 2.5) * swayAmount * 0.6;

        if (blob.kind === "cross") {
          x += (crossSweep - 0.5) * width * 0.28 * orbitalDamp + Math.sin(blobTime * 0.2 + phaseOffset) * blob.orbitX * 0.18 * orbitalDamp;
          y +=
            (Math.cos(blobTime * 0.24 + phaseOffset) - 0.5) * height * 0.18 * orbitalDamp +
            Math.sin(blobTime * 0.26 + phaseOffset) * blob.orbitY * 0.16 * orbitalDamp;
        } else if (blob.kind === "drift") {
          x += Math.sin(blobTime * 0.38 + phaseOffset) * blob.orbitX * 1.1 * orbitalDamp + Math.cos(blobTime * 0.17 + phaseOffset) * width * 0.032 * orbitalDamp;
          y += Math.sin(blobTime * 1.08 + phaseOffset) * blob.orbitY * 0.78 * orbitalDamp;
        } else {
          x += Math.cos(blobTime + phaseOffset) * blob.orbitX * orbitalDamp;
          y += Math.sin(blobTime * 1.15 + phaseOffset) * blob.orbitY * orbitalDamp;
        }

        x += Math.sin(blobTime * 0.24 + phaseOffset) * blob.orbitX * blob.drift * 0.15 * orbitalDamp + swayX;
        y += Math.cos(blobTime * 0.19 + phaseOffset) * blob.orbitY * 0.12 * orbitalDamp + swayY;

        const radius = blob.size * pulse;
        // Enforce minimum blur for soft premium edges — never go below 6px
        const blur = Math.max(6, blurBase - effectiveLevel * blurRange);

        // Premium smooth gradient with 5 stops for buttery falloff
        const coreOpacity = baseOpacity + effectiveLevel * opacityScale;
        const midOpacity = baseOpacity * 0.6 + effectiveLevel * opacityScale * 0.5;
        const edgeOpacity = baseOpacity * 0.25 + effectiveLevel * opacityScale * 0.2;
        const radial = context.createRadialGradient(x, y, 0, x, y, radius);
        radial.addColorStop(0, hexToRgba(blob.color, coreOpacity));
        radial.addColorStop(0.25, hexToRgba(blob.color, coreOpacity * 0.85));
        radial.addColorStop(0.5, hexToRgba(blob.color, midOpacity));
        radial.addColorStop(0.75, hexToRgba(blob.color, edgeOpacity));
        radial.addColorStop(1, hexToRgba(blob.color, 0));
        context.save();
        context.globalCompositeOperation = "lighter";
        context.filter = `saturate(${1.1 + effectiveLevel * saturationBoost}) blur(${blur}px)`;
        context.fillStyle = radial;
        context.beginPath();
        context.arc(x, y, radius, 0, Math.PI * 2);
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
