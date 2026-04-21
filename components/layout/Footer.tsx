"use client";

import Image from "next/image";
import { Pause, Play, SkipBack, SkipForward } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useRef } from "react";

import { useMusic } from "@/context/MusicContext";

type FooterProps = {
  name: string;
  email: string;
  note: string;
};

export function Footer({ name, email, note }: FooterProps) {
  const ref = useRef<HTMLElement | null>(null);
  const {
    footerTakeover,
    setFooterTakeover,
    title,
    thumbnail,
    isPlaying,
    togglePlayback,
    playNext,
    playPrevious,
  } = useMusic();

  useEffect(() => {
    let frame = 0;

    const updateProgress = () => {
      if (!ref.current) {
        return;
      }

      const footerTop = ref.current.getBoundingClientRect().top + window.scrollY;
      const viewportBottom = window.scrollY + window.innerHeight;
      const start = footerTop - window.innerHeight;
      const end = Math.max(start + 1, document.documentElement.scrollHeight - 40);
      const progress = Math.max(0, Math.min(1, (viewportBottom - start) / (end - start)));
      setFooterTakeover(progress);
    };

    const handleScroll = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(updateProgress);
    };

    updateProgress();
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", updateProgress);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", updateProgress);
      setFooterTakeover(0);
    };
  }, [setFooterTakeover]);

  return (
    <footer className="section-wrap pb-14 pt-4" ref={ref}>
      <section
        className="glass-panel relative overflow-hidden rounded-[36px] px-6 py-8 md:px-10 md:py-10"
        id="footer"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(var(--teal-rgb),0.22),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(var(--accent-rgb),0.2),transparent_28%)]" />
        <div className="relative grid gap-8 lg:grid-cols-[1fr_1.25fr] lg:items-end">
          <div className="space-y-5">
            <p className="glass-chip w-fit">Footer Takeover</p>
            <h2 className="text-3xl font-semibold text-ink md:text-5xl">Scroll low enough and the soundtrack takes the room.</h2>
            <p className="max-w-xl text-sm leading-7 text-ink/72 md:text-base">{note}</p>
            <div className="flex flex-wrap items-center gap-3 text-sm text-ink/68">
              <span>{name}</span>
              <span className="h-1 w-1 rounded-full bg-ink/40" />
              <a className="underline decoration-white/40 underline-offset-4" href={`mailto:${email}`}>
                {email}
              </a>
            </div>
          </div>

          <motion.div
            className="relative overflow-hidden rounded-[30px] border border-white/32 bg-white/22 p-4 shadow-[0_24px_90px_rgba(52,38,22,0.16)] backdrop-blur-2xl"
            animate={{
              opacity: Math.min(1, Math.max(0, (footerTakeover - 0.6) * 2.5)),
              y: 28 - footerTakeover * 34,
              scale: 0.9 + footerTakeover * 0.1,
              rotate: footerTakeover * 0.8,
            }}
            transition={{ duration: 0.44, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="grid gap-4 md:grid-cols-[1.1fr_1fr]">
              <div className="relative min-h-[260px] overflow-hidden rounded-[24px] bg-white/22">
                {thumbnail ? (
                  <Image
                    alt={title}
                    className="object-cover"
                    fill
                    sizes="(max-width: 768px) 100vw, 420px"
                    src={thumbnail}
                    unoptimized
                  />
                ) : (
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(var(--warm-rgb),0.44),rgba(var(--accent-rgb),0.16))]" />
                )}
                <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent,rgba(22,16,12,0.48))]" />
              </div>

              <div className="flex flex-col justify-between gap-6 rounded-[24px] bg-white/18 p-5">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.28em] text-ink/56">Immersive music zone</p>
                  <h3 className="mt-2 text-2xl font-semibold text-ink">{title}</h3>
                  <p className="mt-3 text-sm leading-7 text-ink/68">
                    The current track drives the color atmosphere, the canvas pulse, and the footer takeover.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <button className="glass-button-muted h-12 w-12 rounded-full p-0" onClick={playPrevious} type="button">
                    <SkipBack className="h-4 w-4" />
                  </button>
                  <button className="glass-button h-12 w-12 rounded-full p-0" onClick={togglePlayback} type="button">
                    {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  </button>
                  <button className="glass-button-muted h-12 w-12 rounded-full p-0" onClick={playNext} type="button">
                    <SkipForward className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </footer>
  );
}
