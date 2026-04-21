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

  useEffect(() => {
    energyRef.current = energy;
  }, [energy]);

  useEffect(() => {
    paletteRef.current = palette;
  }, [palette]);

  useEffect(() => {
    songTimeRef.current = currentTime;
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
    const blobCount = mediaQuery.matches ? 8 : 12;
    const fallbackPalette = palette.length > 0 ? palette : ["#151019", "#b93ca7", "#7b5fd1", "#f0dcff"];
    const canvasPalette = fallbackPalette.map(boostCanvasColor);
    const anchorPositions = mediaQuery.matches
      ? [
          { x: 0.06, y: 0.08 },
          { x: 0.52, y: 0.09 },
          { x: 0.92, y: 0.14 },
          { x: 0.16, y: 0.34 },
          { x: 0.52, y: 0.42 },
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
          { x: 0.56, y: 0.3 },
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

      // Song time drives the visualizer — different song positions = different patterns
      // This makes the visualizer evolve with the song instead of repeating the same loop
      const songT = songTimeRef.current;
      const songDur = durationRef.current || 180; // default 3 min
      const songProgress = songT / songDur; // 0..1 across the whole song

      for (const [index, blob] of blobs.entries()) {
        blob.color = vibrantPalette[index % vibrantPalette.length] ?? blob.color;

        const blobTime = t * blob.speed * 1000;
        const phaseOffset = blob.phase;

        // Each blob represents ONE distinct frequency band of the song
        const bandRole = index % 4; // 0=bass, 1=mid, 2=high, 3=texture

        // Song-structure drift: use the song's actual position to shift patterns
        // Different parts of the song (intro, verse, chorus) get different visual patterns
        // This is what makes it feel synced to the song instead of repeating
        const structureDrift = Math.sin(songProgress * Math.PI * 4 + phaseOffset) * 0.2;
        const structureDrift2 = Math.cos(songProgress * Math.PI * 6 + phaseOffset * 0.7) * 0.15;

        // Each band has its OWN distinct frequency and behavior
        // No mixing — a bass blob ONLY shows bass, a high blob ONLY shows high
        let bandSignal: number;
        let pulseScale: number;
        let pulseCap: number;
        let swayAmount: number;
        let swayFreq: number;
        let opacityScale: number;

        switch (bandRole) {
          case 0: {
            // BASS — heavy kick, sharp attack + slow decay
            // Use song time so the pattern follows the actual track position
            const freq = 0.7 + structureDrift;
            // Sharp attack: only the positive peak, raised to high power for snappy hit
            const rawBass = Math.sin(songT * freq * Math.PI * 2 + phaseOffset);
            bandSignal = rawBass > 0 ? Math.pow(rawBass, 0.6) : Math.pow(Math.abs(rawBass), 3) * 0.15;
            pulseScale = 1.2;    // up to 2.2× size at peak — very visible
            pulseCap = 2.2;
            swayAmount = 16;     // big positional heave
            swayFreq = freq;
            opacityScale = 0.6;  // bold opacity swings
            break;
          }
          case 1: {
            // MID — smooth rhythmic pulse, like vocals/melody
            const freq = 1.5 + structureDrift * 0.7;
            bandSignal = Math.pow(Math.abs(Math.sin(songT * freq * Math.PI * 2 + phaseOffset * 1.3)), 1.5);
            pulseScale = 0.7;   // up to 1.7× size
            pulseCap = 1.75;
            swayAmount = 10;    // moderate sway
            swayFreq = freq * 0.8;
            opacityScale = 0.45;
            break;
          }
          case 2: {
            // HIGH — sharp flicker, like hi-hats/snares
            const freq = 3.2 + structureDrift2;
            bandSignal = Math.pow(Math.abs(Math.cos(songT * freq * Math.PI * 2 + phaseOffset * 0.7)), 3);
            pulseScale = 0.4;   // up to 1.4× — small size, sharp flicker
            pulseCap = 1.45;
            swayAmount = 5;     // small jitter
            swayFreq = freq * 0.6;
            opacityScale = 0.55; // opacity flickers more than size
            break;
          }
          default: {
            // TEXTURE — fast fine ripple, like atmosphere/reverb
            const freq = 5.5 + structureDrift2 * 0.5;
            bandSignal = Math.abs(Math.sin(songT * freq * Math.PI * 2 + phaseOffset * 2.1));
            pulseScale = 0.2;   // barely changes size — 1.2× max
            pulseCap = 1.25;
            swayAmount = 3;     // minimal movement
            swayFreq = freq * 0.4;
            opacityScale = 0.65; // mainly opacity ripple, not size
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
        const orbitalDamp = 1 - baseLevel * 0.6; // 40% orbital at full energy

        // Position movement
        const crossSweep = (Math.sin(blobTime * 0.32 + phaseOffset) + 1) / 2;
        let x = width * blob.anchorX;
        let y = height * blob.anchorY;

        // Band-specific sway driven by song time
        const swayX = effectiveLevel * Math.sin(songT * swayFreq * Math.PI * 2 + phaseOffset * 3.0) * swayAmount;
        const swayY = effectiveLevel * Math.cos(songT * swayFreq * Math.PI * 1.6 + phaseOffset * 2.5) * swayAmount * 0.6;

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
        const largeBlob = blob.size >= 96;
        const blur = largeBlob ? 22 - effectiveLevel * 14 : 16 - effectiveLevel * 8;

        // Opacity driven by band — high/texture blobs flicker in opacity, bass/mid in size
        const radial = context.createRadialGradient(x, y, 0, x, y, radius);
        radial.addColorStop(0, hexToRgba(blob.color, (largeBlob ? 0.3 : 0.24) + effectiveLevel * opacityScale));
        radial.addColorStop(0.55, hexToRgba(blob.color, (largeBlob ? 0.14 : 0.1) + effectiveLevel * opacityScale * 0.4));
        radial.addColorStop(1, hexToRgba(blob.color, 0));
        context.save();
        context.globalCompositeOperation = "screen";
        context.filter = `saturate(${1.2 + effectiveLevel * 0.28}) contrast(${1.05 + effectiveLevel * 0.08}) blur(${blur}px)`;
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
