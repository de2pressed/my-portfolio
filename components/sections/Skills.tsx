"use client";

import { motion } from "framer-motion";

import type { SkillEntry } from "@/lib/types";

type SkillsProps = {
  skills: SkillEntry[];
};

export function Skills({ skills }: SkillsProps) {
  const groups = skills.reduce<Record<string, SkillEntry[]>>((collection, skill) => {
    collection[skill.category] = [...(collection[skill.category] ?? []), skill];
    return collection;
  }, {});

  return (
    <section className="section-wrap" data-section="skills" id="skills">
      <div className="space-y-6">
        <div>
          <p className="section-kicker">Skills</p>
          <h2 className="section-title">Operational depth across delivery, security, and monitoring.</h2>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          {Object.entries(groups).map(([category, entries], index) => (
            <motion.div
              className="section-card"
              initial={{ opacity: 0, y: 30 }}
              key={category}
              transition={{ type: "spring", stiffness: 100, damping: 19, delay: index * 0.08 }}
              viewport={{ once: true, amount: 0.25 }}
              whileInView={{ opacity: 1, y: 0 }}
              whileHover={{ y: -4, scale: 1.01 }}
            >
              <p className="text-xs uppercase tracking-[0.26em] text-ink/52">{category}</p>
              <div className="mt-5 flex flex-wrap gap-3">
                {entries.map((skill, itemIndex) => (
                  <motion.span
                    className="glass-chip"
                    initial={{ opacity: 0, scale: 0.9, y: 10 }}
                    key={skill.id}
                    transition={{ type: "spring", stiffness: 140, damping: 18, delay: itemIndex * 0.035 }}
                    viewport={{ once: true }}
                    whileInView={{ opacity: 1, scale: 1, y: 0 }}
                  >
                    {skill.name}
                  </motion.span>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
