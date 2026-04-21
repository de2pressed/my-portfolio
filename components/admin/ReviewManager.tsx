"use client";

import { useState } from "react";

import type { ReviewEntry } from "@/lib/types";
import { formatTimestamp } from "@/lib/utils";

type ReviewManagerProps = {
  reviews: ReviewEntry[];
};

export function ReviewManager({ reviews }: ReviewManagerProps) {
  const [items, setItems] = useState(reviews);
  const [status, setStatus] = useState<string | null>(null);

  async function toggleVisibility(review: ReviewEntry) {
    setStatus("Updating review visibility...");

    try {
      const response = await fetch("/api/reviews", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: review.id,
          is_visible: !review.is_visible,
        }),
      });

      if (!response.ok) {
        throw new Error("Visibility update failed");
      }

      const payload = (await response.json()) as { review: ReviewEntry };
      setItems((current) => current.map((item) => (item.id === review.id ? payload.review : item)));
      setStatus("Review updated.");
    } catch (error) {
      console.warn("Visibility update failed.", error);
      setStatus("Review update failed.");
    }
  }

  async function deleteItem(id: string) {
    setStatus("Deleting review...");

    try {
      const response = await fetch(`/api/reviews?id=${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Delete failed");
      }

      setItems((current) => current.filter((item) => item.id !== id));
      setStatus("Review deleted.");
    } catch (error) {
      console.warn("Review delete failed.", error);
      setStatus("Review delete failed.");
    }
  }

  return (
    <section className="section-card">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.26em] text-ink/52">Guestbook moderation</p>
          <h2 className="mt-2 text-2xl font-semibold text-ink">Reviews</h2>
        </div>
        {status ? <p className="text-sm text-ink/62">{status}</p> : null}
      </div>

      <div className="space-y-4">
        {items.map((review) => (
          <article className="rounded-[24px] border border-white/28 bg-white/16 p-5" key={review.id}>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-lg font-semibold text-ink">{review.display_name}</p>
                <p className="mt-1 text-sm text-ink/64">{review.email}</p>
                <p className="mt-2 text-xs uppercase tracking-[0.22em] text-ink/46">
                  {formatTimestamp(review.created_at)}
                </p>
              </div>
              <div className="flex gap-2">
                <button className="glass-button-muted text-xs uppercase tracking-[0.22em]" onClick={() => toggleVisibility(review)} type="button">
                  {review.is_visible ? "Hide" : "Show"}
                </button>
                <button className="glass-button-muted text-xs uppercase tracking-[0.22em]" onClick={() => deleteItem(review.id)} type="button">
                  Delete
                </button>
              </div>
            </div>
            <p className="mt-4 text-sm leading-7 text-ink/72">{review.message}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
