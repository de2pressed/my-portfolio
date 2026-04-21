"use client";

import { motion } from "framer-motion";
import { ArrowDownRight, MapPin, Mail, Phone } from "lucide-react";

type HeroProps = {
  name: string;
  tagline: string;
  intro: string;
  location: string;
  email: string;
  phone: string;
};

export function Hero({ name, tagline, intro, location, email, phone }: HeroProps) {
  const words = name.split(" ");

  return (
    <section className="section-wrap flex min-h-screen items-center pt-32" data-section="hero" id="hero">
      <div className="grid w-full gap-10 lg:grid-cols-[1.3fr_0.9fr] lg:items-end">
        <div className="space-y-6">
          <motion.p
            className="glass-chip w-fit"
            initial={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.7 }}
            viewport={{ once: true }}
            whileInView={{ opacity: 1, y: 0 }}
          >
            DevOps x Motion x Systems
          </motion.p>

          <h1 className="max-w-4xl text-[3.6rem] font-semibold leading-[0.86] text-ink sm:text-[5.3rem] lg:text-[7rem]">
            {words.map((word, index) => (
              <motion.span
                className="mr-[0.22em] inline-block"
                initial={{ opacity: 0, y: 60, rotateX: -80 }}
                key={word}
                transition={{
                  duration: 0.9,
                  delay: index * 0.12,
                  ease: [0.22, 1, 0.36, 1],
                }}
                viewport={{ once: true }}
                whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
              >
                {word}
              </motion.span>
            ))}
          </h1>

          <motion.p
            className="max-w-2xl text-xl leading-8 text-ink/78 md:text-2xl"
            initial={{ opacity: 0, y: 28 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            viewport={{ once: true }}
            whileInView={{ opacity: 1, y: 0 }}
          >
            {tagline}
          </motion.p>

          <motion.p
            className="max-w-2xl text-sm leading-8 text-ink/70 md:text-base"
            initial={{ opacity: 0, y: 28 }}
            transition={{ duration: 0.8, delay: 0.55 }}
            viewport={{ once: true }}
            whileInView={{ opacity: 1, y: 0 }}
          >
            {intro}
          </motion.p>

          <motion.div
            className="flex flex-wrap gap-3"
            initial={{ opacity: 0, y: 28 }}
            transition={{ duration: 0.8, delay: 0.65 }}
            viewport={{ once: true }}
            whileInView={{ opacity: 1, y: 0 }}
          >
            <span className="glass-chip">
              <MapPin className="h-3.5 w-3.5" /> {location}
            </span>
            <span className="glass-chip">
              <Mail className="h-3.5 w-3.5" /> {email}
            </span>
            <span className="glass-chip">
              <Phone className="h-3.5 w-3.5" /> {phone}
            </span>
          </motion.div>
        </div>

        <motion.div
          className="section-card relative overflow-hidden"
          initial={{ opacity: 0, x: 40 }}
          transition={{ duration: 0.95, delay: 0.45 }}
          viewport={{ once: true }}
          whileInView={{ opacity: 1, x: 0 }}
        >
          <div className="space-y-4">
            <p className="text-[11px] uppercase tracking-[0.28em] text-ink/54">Current focus</p>
            <p className="text-3xl font-semibold text-ink">Building deployment systems that feel deliberate.</p>
            <p className="text-sm leading-7 text-ink/68">
              CI/CD, container security, observability, AWS-hosted delivery pipelines, and interfaces with enough
              mood to feel personal instead of generic.
            </p>
            <button
              className="glass-button mt-4"
              onClick={() => document.getElementById("about")?.scrollIntoView({ behavior: "smooth" })}
              type="button"
            >
              Explore the portfolio <ArrowDownRight className="ml-2 h-4 w-4" />
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
