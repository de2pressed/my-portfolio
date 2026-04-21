"use client";

import { motion } from "framer-motion";

type EducationContent = {
  degree: string;
  institution: string;
  duration: string;
};

type AboutProps = {
  summary: string;
  education: EducationContent;
};

export function About({ summary, education }: AboutProps) {
  return (
    <section className="section-wrap" data-section="about" id="about">
      <motion.div
        className="section-card"
        initial={{ opacity: 0, y: 36 }}
        transition={{ type: "spring", stiffness: 100, damping: 20, mass: 0.9 }}
        viewport={{ once: true, amount: 0.3 }}
        whileInView={{ opacity: 1, y: 0 }}
        whileHover={{ y: -4, scale: 1.01 }}
      >
        <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
          <div>
            <p className="section-kicker">About</p>
            <h2 className="section-title">Infrastructure thinking with a personal pulse.</h2>
            <p className="mt-6 max-w-3xl text-sm leading-8 text-ink/72 md:text-base">{summary}</p>
          </div>

          <div className="rounded-[28px] border border-white/18 bg-[rgba(255,255,255,0.1)] p-6">
            <p className="text-[11px] uppercase tracking-[0.28em] text-ink/54">Education</p>
            <h3 className="mt-4 text-2xl font-semibold text-ink">{education.degree}</h3>
            <p className="mt-2 text-sm text-ink/72">{education.institution}</p>
            <p className="mt-6 text-sm uppercase tracking-[0.24em] text-ink/52">{education.duration}</p>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
