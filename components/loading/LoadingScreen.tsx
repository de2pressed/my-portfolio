"use client";

import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { useEffect } from "react";

import { springConfigs } from "@/lib/animations";

type LoadingScreenProps = {
  phase: "loading" | "handoff";
  musicReady: boolean;
  handoffToCookie: boolean;
};

export function LoadingScreen({ phase, musicReady, handoffToCookie }: LoadingScreenProps) {
  const progress = useMotionValue(0);
  const statusItems = [
    { label: "AUDIO ENGINE", state: musicReady ? "READY" : "INITIALIZING" },
    { label: "RESOURCES", state: musicReady ? "LOADED" : "LOADING" },
    { label: "SITE", state: phase === "handoff" ? "WAITING" : "PREPARING" },
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

  useEffect(() => {
    const controls = animate(progress, musicReady ? 100 : 65, {
        duration: 2.5,
        ease: [0.22, 1, 0.36, 1],
      });
    return () => controls.stop();
  }, [musicReady, progress]);

  const circumference = 2 * Math.PI * 60;
  const strokeDashoffset = useTransform(
    progress,
    (p) => circumference - (p / 100) * circumference
  );

  return (
    <motion.div
      className="fixed inset-0 z-[80] flex items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_top,rgba(8,8,14,0.92),rgba(14,14,20,0.7)_38%,rgba(18,18,26,0.98)_100%)] px-4"
      initial={{ opacity: 0 }}
      animate={{
        opacity: 1,
        backdropFilter: phase === "handoff" ? "blur(24px)" : "blur(0px)",
      }}
      exit={exitVariant}
      transition={{ duration: handoffToCookie ? 0.78 : 0.65, ease: [0.22, 1, 0.36, 1] }}
    >
      <motion.div
        className="glass-panel relative flex w-full max-w-[28rem] flex-col items-center justify-center rounded-[32px] px-8 py-12 shadow-[0_30px_120px_rgba(4,5,8,0.34)] sm:max-w-[32rem] sm:px-10 sm:py-14"
        initial={{ opacity: 0, scale: 0.96, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="relative mb-8">
          <svg className="h-40 w-40 sm:h-48 sm:w-48" viewBox="0 0 140 140">
            <circle
              cx="70"
              cy="70"
              fill="none"
              r="60"
              stroke="rgba(var(--glass-border-rgb), 0.15)"
              strokeWidth="2"
            />
            <motion.circle
              cx="70"
              cy="70"
              fill="none"
              r="60"
              stroke="rgb(var(--accent-rgb))"
              strokeWidth="2"
              strokeLinecap="round"
              style={{ strokeDashoffset, strokeDasharray: circumference }}
              animate={{ opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.span
              className="text-2xl font-semibold text-ink sm:text-3xl"
              style={{ fontVariantNumeric: "tabular-nums" }}
            >
              {Math.round(progress.get())}%
            </motion.span>
          </div>
        </div>

        <div className="w-full space-y-4">
          {statusItems.map((item, index) => (
            <motion.div
              key={item.label}
              className="flex items-center justify-between border-b border-[rgba(var(--glass-border-rgb),0.08)] pb-3 last:border-0"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ ...springConfigs.gentle, delay: 0.15 + index * 0.08 }}
            >
              <span className="text-[10px] uppercase tracking-[0.28em] text-ink/60">
                {item.label}
              </span>
              <span
                className={`text-[10px] uppercase tracking-[0.28em] ${
                  item.state === "READY" || item.state === "LOADED"
                    ? "text-[rgb(var(--accent-rgb))]"
                    : "text-ink/40"
                }`}
              >
                {item.state}
              </span>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
