"use client";

import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";

import type { ProjectEntry } from "@/lib/types";

type ProjectsProps = {
  projects: ProjectEntry[];
};

export function Projects({ projects }: ProjectsProps) {
  return (
    <section className="section-wrap" data-section="projects" id="projects">
      <div className="space-y-6">
        <div>
          <p className="section-kicker">Projects</p>
          <h2 className="section-title">Selected builds where automation, security, and visibility meet.</h2>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          {projects.map((project, index) => (
            <motion.article
              className="section-card flex h-full flex-col justify-between"
              initial={{ opacity: 0, y: 32 }}
              key={project.id}
              transition={{ type: "spring", stiffness: 96, damping: 18, delay: index * 0.09 }}
              viewport={{ once: true, amount: 0.25 }}
              whileHover={{ rotateX: -3, rotateY: 3, y: -8, scale: 1.02, boxShadow: "0 0 0 1px rgba(var(--accent-rgb), 0.12), 0 28px 70px rgba(5,5,8,0.38)" }}
              whileInView={{ opacity: 1, y: 0 }}
            >
              <div>
                <div className="flex items-start justify-between gap-4">
                  <h3 className="text-2xl font-semibold text-ink">{project.title}</h3>
                  {project.link ? (
                    <a
                      className="glass-button-muted h-11 w-11 rounded-full p-0"
                      href={project.link}
                      rel="noreferrer"
                      target="_blank"
                    >
                      <ArrowUpRight className="h-4 w-4" />
                    </a>
                  ) : null}
                </div>

                <ul className="mt-5 space-y-3 text-sm leading-7 text-ink/70">
                  {project.description.map((item) => (
                    <li className="flex gap-3" key={item}>
                      <span className="mt-3 h-1.5 w-1.5 rounded-full bg-[rgb(var(--teal-rgb))]" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-6 flex flex-wrap gap-2">
                {project.tech_stack.map((tech) => (
                  <span className="glass-chip" key={tech}>
                    {tech}
                  </span>
                ))}
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
