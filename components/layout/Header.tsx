"use client";

import { Menu, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

const navItems = [
  { id: "about", label: "About" },
  { id: "skills", label: "Skills" },
  { id: "experience", label: "Experience" },
  { id: "projects", label: "Projects" },
  { id: "reviews", label: "Reviews" },
];

type HeaderProps = {
  name: string;
};

export function Header({ name }: HeaderProps) {
  const [open, setOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("hero");
  const ringRef = useRef<SVGCircleElement | null>(null);

  useEffect(() => {
    const circle = ringRef.current;
    if (!circle) {
      return;
    }

    const radius = 10.5;
    const circumference = 2 * Math.PI * radius;
    circle.style.strokeDasharray = `${circumference}`;

    let frame = 0;

    const updateProgress = () => {
      const documentHeight = document.documentElement.scrollHeight;
      const viewportHeight = window.innerHeight;
      const maxScroll = Math.max(1, documentHeight - viewportHeight);
      const progress = Math.max(0, Math.min(1, window.scrollY / maxScroll));
      circle.style.strokeDashoffset = `${circumference * (1 - progress)}`;
    };

    const schedule = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(updateProgress);
    };

    updateProgress();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, []);

  useEffect(() => {
    const sections = navItems
      .map((item) => document.getElementById(item.id))
      .filter((section): section is HTMLElement => Boolean(section));
    const heroSection = document.getElementById("hero");

    const observedSections = heroSection ? [heroSection, ...sections] : sections;
    if (observedSections.length === 0) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const next = entries
          .filter((entry) => entry.isIntersecting)
          .sort((left, right) => right.intersectionRatio - left.intersectionRatio)[0];

        if (next?.target instanceof HTMLElement) {
          setActiveSection(next.target.id);
        }
      },
      {
        threshold: [0.4, 0.55, 0.7],
        rootMargin: "-10% 0px -45% 0px",
      },
    );

    observedSections.forEach((section) => observer.observe(section));

    return () => observer.disconnect();
  }, []);

  function navigateTo(sectionId: string) {
    document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth", block: "start" });
    setOpen(false);
  }

  return (
    <>
      <header className="fixed inset-x-4 top-4 z-30 mx-auto max-w-7xl rounded-full border border-white/10 bg-[rgba(10,10,14,0.46)] px-4 py-3 shadow-glow backdrop-blur-2xl sm:inset-x-6 lg:inset-x-8">
        <div className="flex items-center justify-between gap-4">
          <button
            className={cn("text-left transition-opacity duration-300", activeSection === "hero" ? "opacity-100" : "opacity-80")}
            onClick={() => navigateTo("hero")}
            type="button"
          >
            <span className="flex items-center gap-3">
              <span className="hidden h-7 w-7 shrink-0 items-center justify-center md:inline-flex">
                <svg aria-hidden="true" className="h-full w-full" viewBox="0 0 28 28">
                  <circle
                    cx="14"
                    cy="14"
                    fill="none"
                    r="10.5"
                    stroke="rgba(255,255,255,0.18)"
                    strokeWidth="2.2"
                  />
                  <circle
                    ref={ringRef}
                    cx="14"
                    cy="14"
                    fill="none"
                    r="10.5"
                    stroke="rgb(var(--accent-rgb))"
                    strokeLinecap="round"
                    strokeWidth="2.2"
                    transform="rotate(-90 14 14)"
                  />
                </svg>
              </span>
              <span className="text-left">
                <span className="block text-[10px] uppercase tracking-[0.28em] text-ink/50">Jayant Kumar</span>
                <span className="font-heading text-sm font-semibold text-ink sm:text-base">{name}</span>
              </span>
            </span>
          </button>

          <nav className="hidden items-center gap-2 md:flex">
            {navItems.map((item) => (
              <button
                className={cn(
                  "px-4 py-2 text-xs uppercase tracking-[0.24em] transition-all duration-300",
                  activeSection === item.id
                    ? "glass-button border-white/12 text-ink shadow-glass"
                    : "glass-button-muted text-ink/72",
                )}
                aria-current={activeSection === item.id ? "page" : undefined}
                key={item.id}
                onClick={() => navigateTo(item.id)}
                type="button"
              >
                {item.label}
              </button>
            ))}
          </nav>

          <button
            aria-label={open ? "Close menu" : "Open menu"}
            className="glass-button-muted h-11 w-11 rounded-full p-0 md:hidden"
            onClick={() => setOpen((current) => !current)}
            type="button"
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </header>

      <AnimatePresence>
        {open ? (
          <motion.div
            className="fixed inset-0 z-[31] bg-[rgba(4,4,8,0.82)] px-4 pt-24 backdrop-blur-xl md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="glass-panel mx-auto max-w-md rounded-[32px] p-6"
              initial={{ y: -22, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -22, opacity: 0 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="space-y-3">
                {navItems.map((item) => (
                  <button
                    className={cn(
                      "flex w-full items-center justify-between rounded-[22px] px-5 py-4 text-left text-sm uppercase tracking-[0.2em] transition-all duration-300",
                      activeSection === item.id
                        ? "glass-button border-white/12 text-ink shadow-glass"
                        : "glass-button-muted text-ink/76",
                    )}
                    aria-current={activeSection === item.id ? "page" : undefined}
                    key={item.id}
                    onClick={() => navigateTo(item.id)}
                    type="button"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
