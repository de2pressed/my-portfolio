"use client";

import { Menu, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";

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

  function navigateTo(sectionId: string) {
    document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth", block: "start" });
    setOpen(false);
  }

  return (
    <>
      <header className="fixed inset-x-4 top-4 z-30 mx-auto max-w-7xl rounded-full border border-white/30 bg-white/18 px-4 py-3 shadow-glow backdrop-blur-2xl sm:inset-x-6 lg:inset-x-8">
        <div className="flex items-center justify-between gap-4">
          <button
            className="text-left"
            onClick={() => navigateTo("hero")}
            type="button"
          >
            <span className="block text-[10px] uppercase tracking-[0.28em] text-ink/50">Jayant Kumar</span>
            <span className="font-heading text-sm font-semibold text-ink sm:text-base">{name}</span>
          </button>

          <nav className="hidden items-center gap-2 md:flex">
            {navItems.map((item) => (
              <button
                className="glass-button-muted px-4 py-2 text-xs uppercase tracking-[0.24em] text-ink/72"
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
            className="fixed inset-0 z-[31] bg-[rgba(247,239,230,0.5)] px-4 pt-24 backdrop-blur-xl md:hidden"
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
                    className="glass-button-muted flex w-full items-center justify-between rounded-[22px] px-5 py-4 text-left text-sm uppercase tracking-[0.2em] text-ink/76"
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
