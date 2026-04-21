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
  const visualLevel = useMusicFrequency();
  const { palette } = useThemeColors();
  const visualLevelRef = useRef(visualLevel);
  const paletteRef = useRef(palette);

  useEffect(() => {
    visualLevelRef.current = visualLevel;
  }, [visualLevel]);

  useEffect(() => {
    paletteRef.current = palette;
  }, [palette]);

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
    const blobCount = mediaQuery.matches ? 3 : 5;

    const resize = () => {
      const ratio = Math.min(window.devicePixelRatio || 1, 1.8);
      canvas.width = Math.floor(window.innerWidth * ratio);
      canvas.height = Math.floor(window.innerHeight * ratio);
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
    };

    resize();

    const blobs = Array.from({ length: blobCount }, (_, index) => ({
      angle: index * 1.35,
      radius: 140 + index * 38,
      size: 160 + index * 44,
      speed: 0.0009 + index * 0.00024,
      color: palette[index % palette.length] ?? "#e8bc8a",
    }));

    const draw = (time: number) => {
      const level = Math.max(0, Math.min(1, visualLevelRef.current));
      const currentPalette = paletteRef.current.length > 0 ? paletteRef.current : ["#e8bc8a"];

      context.clearRect(0, 0, window.innerWidth, window.innerHeight);

      const gradient = context.createLinearGradient(0, 0, 0, window.innerHeight);
      gradient.addColorStop(0, `rgba(255,248,240,${0.78 + level * 0.08})`);
      gradient.addColorStop(1, `rgba(241,233,224,${0.9 - level * 0.06})`);
      context.fillStyle = gradient;
      context.fillRect(0, 0, window.innerWidth, window.innerHeight);

      for (const [index, blob] of blobs.entries()) {
        blob.color = currentPalette[index % currentPalette.length] ?? blob.color;

        const t = time * blob.speed;
        const pulse = 1 + level * 0.78;
        const x = window.innerWidth / 2 + Math.cos(t + blob.angle) * blob.radius;
        const y = window.innerHeight / 2 + Math.sin(t * 1.2 + blob.angle) * blob.radius * 0.42;
        const radius = blob.size * pulse;
        const blur = 10 + level * 16;

        const radial = context.createRadialGradient(x, y, 0, x, y, radius);
        radial.addColorStop(0, hexToRgba(blob.color, 0.16 + level * 0.26));
        radial.addColorStop(0.55, hexToRgba(blob.color, 0.08 + level * 0.12));
        radial.addColorStop(1, hexToRgba(blob.color, 0));
        context.save();
        context.filter = `blur(${blur}px)`;
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

  return <canvas ref={canvasRef} className="fixed inset-0 z-0 h-full w-full opacity-90" aria-hidden="true" />;
}
