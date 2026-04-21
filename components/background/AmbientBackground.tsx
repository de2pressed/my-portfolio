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
    const blobCount = mediaQuery.matches ? 8 : 12;
    const fallbackPalette = palette.length > 0 ? palette : ["#151019", "#b93ca7", "#7b5fd1", "#f0dcff"];
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
      const level = Math.max(0, Math.min(1, visualLevelRef.current));
      const currentPalette = paletteRef.current.length > 0 ? paletteRef.current : fallbackPalette;
      const width = window.innerWidth;
      const height = window.innerHeight;

      context.clearRect(0, 0, width, height);

      const gradient = context.createRadialGradient(
        width * 0.5,
        height * 0.34,
        0,
        width * 0.5,
        height * 0.34,
        Math.max(width, height) * 0.68,
      );
      gradient.addColorStop(0, `rgba(76,16,64,${0.62 - level * 0.08})`);
      gradient.addColorStop(0.16, `rgba(20,6,24,${0.9 - level * 0.05})`);
      gradient.addColorStop(0.42, `rgba(5,5,8,${0.98 - level * 0.02})`);
      gradient.addColorStop(1, "rgba(0,0,0,1)");
      context.fillStyle = gradient;
      context.fillRect(0, 0, width, height);

      const edgeGlowColor = currentPalette[0] ?? "#b93ca7";
      const glowPoints = [
        { x: width * 0.08, y: height * 0.1, opacity: 0.08 },
        { x: width * 0.92, y: height * 0.12, opacity: 0.07 },
        { x: width * 0.08, y: height * 0.86, opacity: 0.06 },
        { x: width * 0.92, y: height * 0.84, opacity: 0.07 },
      ];

      for (const point of glowPoints) {
        const halo = context.createRadialGradient(point.x, point.y, 0, point.x, point.y, Math.max(width, height) * 0.18);
        halo.addColorStop(0, hexToRgba(edgeGlowColor, point.opacity));
        halo.addColorStop(1, hexToRgba(edgeGlowColor, 0));
        context.fillStyle = halo;
        context.fillRect(0, 0, width, height);
      }

      for (const [index, blob] of blobs.entries()) {
        blob.color = currentPalette[index % currentPalette.length] ?? blob.color;

        const t = time * blob.speed;
        const pulse = 1 + level * (blob.size < 96 ? 0.72 : 1.05);
        const crossSweep = (Math.sin(t * 0.32 + blob.phase) + 1) / 2;
        let x = width * blob.anchorX;
        let y = height * blob.anchorY;

        if (blob.kind === "cross") {
          x += (crossSweep - 0.5) * width * 0.28 + Math.sin(t * 0.2 + blob.phase) * blob.orbitX * 0.18;
          y +=
            (Math.cos(t * 0.24 + blob.phase) - 0.5) * height * 0.18 +
            Math.sin(t * 0.26 + blob.phase) * blob.orbitY * 0.16;
        } else if (blob.kind === "drift") {
          x += Math.sin(t * 0.38 + blob.phase) * blob.orbitX * 1.1 + Math.cos(t * 0.17 + blob.phase) * width * 0.032;
          y += Math.sin(t * 1.08 + blob.phase) * blob.orbitY * 0.78;
        } else {
          x += Math.cos(t + blob.phase) * blob.orbitX;
          y += Math.sin(t * 1.15 + blob.phase) * blob.orbitY;
        }

        x += Math.sin(t * 0.24 + blob.phase) * blob.orbitX * blob.drift * 0.15;
        y += Math.cos(t * 0.19 + blob.phase) * blob.orbitY * 0.12;

        const radius = blob.size * pulse;
        const blur = blob.size < 96 ? 6 + level * 12 : 10 + level * 16;

        const radial = context.createRadialGradient(x, y, 0, x, y, radius);
        radial.addColorStop(0, hexToRgba(blob.color, blob.size < 96 ? 0.18 + level * 0.22 : 0.12 + level * 0.24));
        radial.addColorStop(0.55, hexToRgba(blob.color, blob.size < 96 ? 0.075 + level * 0.08 : 0.06 + level * 0.1));
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

  return <canvas ref={canvasRef} className="fixed inset-0 z-0 h-full w-full opacity-100" aria-hidden="true" />;
}
