"use client";

import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";

import type { ExperienceEntry } from "@/lib/types";

type ExperienceProps = {
  experience: ExperienceEntry[];
};

export function Experience({ experience }: ExperienceProps) {
  return (
    <section className="section-wrap" data-section="experience" id="experience">
      <div className="space-y-6">
        <div>
          <p className="section-kicker">Experience</p>
          <h2 className="section-title">Projects and study translated into delivery systems.</h2>
        </div>

        <div className="space-y-5">
          {experience.map((entry, index) => (
            <motion.article
              className="section-card"
              initial={{ opacity: 0, y: 28 }}
              key={entry.id}
              transition={{ duration: 0.75, delay: index * 0.08 }}
              viewport={{ once: true, amount: 0.25 }}
              whileInView={{ opacity: 1, y: 0 }}
            >
              <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.28em] text-ink/52">{entry.date_range}</p>
                  <h3 className="mt-3 text-2xl font-semibold text-ink">{entry.title}</h3>
                  <p className="mt-2 text-sm text-ink/70">{entry.organization}</p>
                  {entry.link ? (
                    <a
                      className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-ink underline decoration-white/40 underline-offset-4"
                      href={entry.link}
                      rel="noreferrer"
                      target="_blank"
                    >
                      View reference <ArrowUpRight className="h-4 w-4" />
                    </a>
                  ) : null}
                </div>

                <ul className="space-y-3 text-sm leading-7 text-ink/70">
                  {entry.description.map((point) => (
                    <li className="flex gap-3" key={point}>
                      <span className="mt-3 h-1.5 w-1.5 rounded-full bg-[rgb(var(--accent-rgb))]" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
