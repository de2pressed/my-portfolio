"use client";

import { motion, useMotionValue, useTransform } from "framer-motion";
import { useEffect, useRef } from "react";

import { perlinNoise, springConfigs } from "@/lib/animations";

type LoadingScreenProps = {
  phase: "loading" | "handoff";
  musicReady: boolean;
  handoffToCookie: boolean;
};

export function LoadingScreen({ phase, musicReady, handoffToCookie }: LoadingScreenProps) {
  const timeRef = useRef(0);
  const statusItems = [
    musicReady ? "track ready" : "track loading",
    musicReady ? "music ready" : "music booting",
    phase === "handoff" ? "cookies next" : "site loading",
  ];
  const exitVariant = handoffToCookie
    ? {
        opacity: 0,
        scale: 0.72,
        x: 0,
        y: -36,
        rotate: -6,
        clipPath: "inset(0 44% 0 44% round 42px)",
        filter: "blur(24px)",
      }
    : {
        opacity: 0,
        scale: 1.02,
        filter: "blur(18px)",
      };

  // Perlin noise-based blob movement
  const blob1X = useMotionValue(0);
  const blob1Y = useMotionValue(0);
  const blob2X = useMotionValue(0);
  const blob2Y = useMotionValue(0);
  const blob3X = useMotionValue(0);
  const blob3Y = useMotionValue(0);

  useEffect(() => {
    let frame = 0;
    const tick = (time: number) => {
      timeRef.current = time;
      const t = time / 1000;
      const phaseShift = musicReady ? 1.5 : 1; // Accelerate when music ready

      // Perlin noise for organic movement
      blob1X.set(perlinNoise(t * 0.3 * phaseShift, 0, 0) * 40);
      blob1Y.set(perlinNoise(0, t * 0.3 * phaseShift, 0) * 30);
      blob2X.set(perlinNoise(t * 0.25 * phaseShift, 1, 0) * 50);
      blob2Y.set(perlinNoise(1, t * 0.25 * phaseShift, 0) * 35);
      blob3X.set(perlinNoise(t * 0.2 * phaseShift, 2, 0) * 45);
      blob3Y.set(perlinNoise(2, t * 0.2 * phaseShift, 0) * 40);

      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [musicReady, blob1X, blob1Y, blob2X, blob2Y, blob3X, blob3Y]);

  const breathingScale = useTransform(
    useMotionValue(0),
    (t) => 0.98 + Math.sin(t * 0.002) * 0.02
  );

  const musicReactiveRotation = useTransform(
    useMotionValue(0),
    (t) => musicReady ? Math.sin(t * 0.001) * 5 : 0
  );

  return (
    <motion.div
      className="fixed inset-0 z-[80] flex items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_top,rgba(8,8,14,0.92),rgba(14,14,20,0.7)_38%,rgba(18,18,26,0.98)_100%)] px-4"
      initial={{ opacity: 1 }}
      animate={{
        opacity: 1,
        backdropFilter: phase === "handoff" ? "blur(24px)" : "blur(0px)",
      }}
      exit={exitVariant}
      transition={{ duration: handoffToCookie ? 0.78 : 0.65, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="absolute inset-0">
        <motion.div
          className="absolute left-[12%] top-[18%] h-44 w-44 rounded-full bg-[rgba(var(--accent-rgb),0.18)] blur-3xl"
          style={{ x: blob1X, y: blob1Y }}
          animate={{ scale: [1, 1.16, 0.98, 1] }}
          transition={{ duration: musicReady ? 6 : 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute right-[14%] top-[22%] h-56 w-56 rounded-full bg-[rgba(var(--lavender-rgb),0.18)] blur-3xl"
          style={{ x: blob2X, y: blob2Y }}
          animate={{ scale: [1, 0.94, 1.12, 1] }}
          transition={{ duration: musicReady ? 7.5 : 10, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-[18%] left-[32%] h-64 w-64 rounded-full bg-[rgba(var(--teal-rgb),0.12)] blur-3xl"
          style={{ x: blob3X, y: blob3Y }}
          animate={{ scale: [1, 1.08, 0.97, 1] }}
          transition={{ duration: musicReady ? 8.5 : 11, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <motion.div
        className="glass-panel relative w-full max-w-[92vw] rounded-[32px] px-5 py-8 shadow-[0_30px_120px_rgba(4,5,8,0.34)] sm:px-6 md:max-w-6xl md:px-8 md:py-10 lg:max-w-7xl xl:max-w-[82rem] xl:px-10 xl:py-12"
        style={{ scale: breathingScale }}
        animate={{
          borderRadius: phase === "handoff" ? "28px" : "42px",
          y: phase === "handoff" ? 6 : 0,
        }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="grid gap-8 md:grid-cols-[1.25fr_0.75fr] md:items-center lg:gap-10">
          <div className="space-y-5">
            <h1 className="max-w-2xl text-3xl font-semibold leading-[0.95] text-balance text-ink sm:text-4xl md:text-5xl xl:text-6xl">
              Jayant Kumar's portfolio is loading.
            </h1>
            <p className="max-w-lg text-sm leading-7 text-ink/72 sm:text-[0.95rem] md:text-base">
              The music starts first so the rest of the site can follow it.
            </p>
          </div>

          <div className="relative hidden h-52 items-center justify-center md:flex">
            <motion.div
              className="absolute h-36 w-36 rounded-[36px] bg-[rgba(10,10,14,0.34)] backdrop-blur-2xl"
              style={{ rotate: musicReactiveRotation }}
              animate={{ scale: [1, 1.08, 1] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
              className="absolute h-44 w-44 rounded-full"
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
            />
            <motion.div
              className="absolute h-24 w-24 rounded-full bg-[rgba(var(--accent-rgb),0.26)] blur-2xl"
              animate={{ scale: [0.92, 1.16, 0.96], opacity: [0.46, 0.88, 0.52] }}
              transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
            />
          </div>
        </div>

        <div className="mt-8 grid gap-3 pt-6 text-[10px] uppercase tracking-[0.3em] text-ink/58 sm:grid-cols-3 sm:gap-4 md:mt-10">
          {statusItems.map((label, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...springConfigs.gentle, delay: 0.12 + index * 0.1 }}
            >
              {label}
            </motion.div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
