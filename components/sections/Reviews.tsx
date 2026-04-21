"use client";

import { type FormEvent, useState } from "react";
import { motion } from "framer-motion";

import type { ReviewEntry } from "@/lib/types";

type ReviewsProps = {
  reviews: ReviewEntry[];
};

type FormState = {
  display_name: string;
  email: string;
  message: string;
};

const initialForm: FormState = {
  display_name: "",
  email: "",
  message: "",
};

export function Reviews({ reviews }: ReviewsProps) {
  const [items, setItems] = useState(reviews);
  const [form, setForm] = useState<FormState>(initialForm);
  const [status, setStatus] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setStatus("Sending review...");

    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      if (!response.ok) {
        throw new Error("Review request failed");
      }

      const payload = (await response.json()) as { review: ReviewEntry };
      setItems((current) => [payload.review, ...current]);
      setForm(initialForm);
      setStatus("Thanks. Your review is now part of the guestbook.");
    } catch (error) {
      console.warn("Review submission failed.", error);
      setStatus("The review could not be submitted right now.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="section-wrap pb-6" data-section="reviews" id="reviews">
      <div className="space-y-6">
        <div>
          <p className="section-kicker">Reviews</p>
          <h2 className="section-title">A guestbook for the people who step into the work.</h2>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <div className="grid gap-4 md:grid-cols-2">
            {items.length > 0 ? (
              items.map((review, index) => {
                const tooLong = review.message.length > 180;
                const isExpanded = expanded[review.id];
                const content = tooLong && !isExpanded ? `${review.message.slice(0, 180)}...` : review.message;

                return (
                  <motion.article
                    className="section-card h-full"
                    initial={{ opacity: 0, y: 24 }}
                    key={review.id}
                    transition={{ type: "spring", stiffness: 96, damping: 18, delay: index * 0.06 }}
                    viewport={{ once: true }}
                    whileInView={{ opacity: 1, y: 0 }}
                    whileHover={{ y: -4, scale: 1.01 }}
                  >
                    <p className="text-lg font-semibold text-ink">{review.display_name}</p>
                    <p className="mt-4 text-sm leading-7 text-ink/72">{content}</p>
                    {tooLong ? (
                      <button
                        className="mt-4 text-sm font-medium text-ink underline decoration-white/40 underline-offset-4"
                        onClick={() =>
                          setExpanded((current) => ({
                            ...current,
                            [review.id]: !current[review.id],
                          }))
                        }
                        type="button"
                      >
                        {isExpanded ? "Show less" : "Read more"}
                      </button>
                    ) : null}
                  </motion.article>
                );
              })
            ) : (
              <div className="section-card md:col-span-2">More reflections will appear here soon.</div>
            )}
          </div>

          <motion.form
            className="section-card space-y-4"
            initial={{ opacity: 0, y: 28 }}
            onSubmit={handleSubmit}
            transition={{ type: "spring", stiffness: 96, damping: 18 }}
            viewport={{ once: true }}
            whileInView={{ opacity: 1, y: 0 }}
            whileHover={{ y: -3, scale: 1.005 }}
          >
            <p className="text-xs uppercase tracking-[0.26em] text-ink/52">Leave a review</p>
            <div className="grid gap-4">
              <input
                className="rounded-[20px] border border-white/10 bg-[rgba(10,10,14,0.34)] px-4 py-3 text-sm text-ink outline-none placeholder:text-ink/42 backdrop-blur-xl transition-all duration-300 focus:border-[rgba(var(--accent-rgb),0.28)] focus:bg-[rgba(10,10,14,0.42)] focus:shadow-[0_0_0_4px_rgba(var(--accent-rgb),0.08)]"
                onChange={(event) => setForm((current) => ({ ...current, display_name: event.target.value }))}
                placeholder="Display name"
                required
                value={form.display_name}
              />
              <input
                className="rounded-[20px] border border-white/10 bg-[rgba(10,10,14,0.34)] px-4 py-3 text-sm text-ink outline-none placeholder:text-ink/42 backdrop-blur-xl transition-all duration-300 focus:border-[rgba(var(--accent-rgb),0.28)] focus:bg-[rgba(10,10,14,0.42)] focus:shadow-[0_0_0_4px_rgba(var(--accent-rgb),0.08)]"
                onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                placeholder="Email"
                required
                type="email"
                value={form.email}
              />
              <textarea
                className="min-h-[180px] rounded-[24px] border border-white/10 bg-[rgba(10,10,14,0.34)] px-4 py-3 text-sm text-ink outline-none placeholder:text-ink/42 backdrop-blur-xl transition-all duration-300 focus:border-[rgba(var(--accent-rgb),0.28)] focus:bg-[rgba(10,10,14,0.42)] focus:shadow-[0_0_0_4px_rgba(var(--accent-rgb),0.08)]"
                onChange={(event) => setForm((current) => ({ ...current, message: event.target.value }))}
                placeholder="Message"
                required
                value={form.message}
              />
            </div>
            <button className="glass-button disabled:cursor-not-allowed disabled:opacity-60" disabled={isSubmitting} type="submit">
              {isSubmitting ? "Submitting..." : "Submit review"}
            </button>
            {status ? <p className="text-sm text-ink/68">{status}</p> : null}
          </motion.form>
        </div>
      </div>
    </section>
  );
}
