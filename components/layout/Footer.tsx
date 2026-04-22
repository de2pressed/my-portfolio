"use client";

import { useEffect, useRef } from "react";

import { useMusic } from "@/context/MusicContext";

type FooterProps = {
  name: string;
  email: string;
  note: string;
};

export function Footer({ name, email, note }: FooterProps) {
  const ref = useRef<HTMLElement | null>(null);
  const { setFooterTakeover } = useMusic();

  useEffect(() => {
    let frame = 0;

    const updateProgress = () => {
      if (!ref.current) {
        return;
      }

      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      const scrollableDistance = documentHeight - windowHeight;
      const scrollProgress = scrollableDistance > 0 ? window.scrollY / scrollableDistance : 0;

      setFooterTakeover(scrollProgress);
      frame = window.requestAnimationFrame(updateProgress);
    };

    updateProgress();

    return () => {
      window.cancelAnimationFrame(frame);
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
        <div className="relative space-y-5">
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
      </section>
    </footer>
  );
}
