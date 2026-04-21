"use client";

import { motion } from "framer-motion";

type LoadingScreenProps = {
  phase: "loading" | "handoff";
  musicReady: boolean;
};

export function LoadingScreen({ phase, musicReady }: LoadingScreenProps) {
  const statusLabel = musicReady ? "Score aligned" : "Buffering soundtrack";

  return (
    <motion.div
      className="fixed inset-0 z-[80] flex items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.58),rgba(255,255,255,0.12)_38%,rgba(255,247,239,0.96)_100%)] px-4"
      initial={{ opacity: 1 }}
      animate={{
        opacity: 1,
        backdropFilter: phase === "handoff" ? "blur(24px)" : "blur(0px)",
      }}
      exit={{ opacity: 0, scale: 1.02, filter: "blur(18px)" }}
      transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="absolute inset-0">
        <motion.div
          className="absolute left-[12%] top-[18%] h-44 w-44 rounded-full bg-[rgba(var(--warm-rgb),0.26)] blur-3xl"
          animate={{ x: [0, 36, -18, 0], y: [0, -22, 18, 0], scale: [1, 1.14, 0.98, 1] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute right-[14%] top-[22%] h-56 w-56 rounded-full bg-[rgba(var(--lavender-rgb),0.24)] blur-3xl"
          animate={{ x: [0, -40, 14, 0], y: [0, 24, -16, 0], scale: [1, 0.94, 1.1, 1] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-[18%] left-[32%] h-64 w-64 rounded-full bg-[rgba(var(--teal-rgb),0.18)] blur-3xl"
          animate={{ x: [0, 20, -24, 0], y: [0, -28, 16, 0] }}
          transition={{ duration: 11, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <motion.div
        className="glass-panel relative w-full max-w-3xl rounded-[42px] px-6 py-12 shadow-[0_30px_120px_rgba(56,36,20,0.18)] md:px-10"
        animate={{
          borderRadius: phase === "handoff" ? "32px" : "42px",
          scale: phase === "handoff" ? 0.96 : 1,
        }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr] md:items-center">
          <div className="space-y-5">
            <p className="glass-chip w-fit">Initialization Sequence</p>
            <h1 className="max-w-xl text-4xl font-semibold leading-[0.95] text-balance text-ink md:text-6xl">
              Glass surfaces assembling around the soundtrack.
            </h1>
            <p className="max-w-lg text-sm leading-7 text-ink/72 md:text-base">
              Loading the portfolio world, shaping the ambient palette, and preparing the music engine
              before any of the site is revealed.
            </p>
          </div>

          <div className="relative flex h-52 items-center justify-center">
            <motion.div
              className="absolute h-36 w-36 rounded-[36px] border border-white/60 bg-white/22 backdrop-blur-2xl"
              animate={{ rotate: [0, 18, 0], scale: [1, 1.08, 1] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
              className="absolute h-44 w-44 rounded-full border border-white/60"
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
            />
            <motion.div
              className="absolute h-24 w-24 rounded-full bg-[rgba(var(--accent-rgb),0.22)] blur-2xl"
              animate={{ scale: [0.92, 1.16, 0.96], opacity: [0.46, 0.88, 0.52] }}
              transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
            />
          </div>
        </div>

        <div className="mt-10 grid gap-4 border-t border-white/26 pt-6 text-xs uppercase tracking-[0.28em] text-ink/58 sm:grid-cols-3">
          <div>Visual shell synced</div>
          <div>{statusLabel}</div>
          <div>{phase === "handoff" ? "Opening consent chamber" : "Fetching portfolio content"}</div>
        </div>
      </motion.div>
    </motion.div>
  );
}
