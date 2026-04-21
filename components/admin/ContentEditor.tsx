"use client";

import { useState } from "react";

import type { SiteContentEntry } from "@/lib/types";

type ContentEditorProps = {
  entries: SiteContentEntry[];
};

function serializeContent(content: SiteContentEntry["content"]) {
  return typeof content === "string" ? content : JSON.stringify(content, null, 2);
}

export function ContentEditor({ entries }: ContentEditorProps) {
  const [items, setItems] = useState(entries);
  const [status, setStatus] = useState<string | null>(null);

  async function saveEntry(id: string, value: string) {
    setStatus("Saving content...");

    let parsed: SiteContentEntry["content"] = value;
    try {
      parsed = JSON.parse(value);
    } catch {
      parsed = value;
    }

    try {
      const response = await fetch("/api/content?resource=site_content", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id,
          payload: {
            content: parsed,
          },
        }),
      });

      if (!response.ok) {
        throw new Error("Content save failed");
      }

      const payload = (await response.json()) as { item: SiteContentEntry };
      setItems((current) => current.map((entry) => (entry.id === id ? payload.item : entry)));
      setStatus("Content updated.");
    } catch (error) {
      console.warn("Content save failed.", error);
      setStatus("Content update failed.");
    }
  }

  return (
    <section className="section-card">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.26em] text-ink/52">Content editor</p>
          <h2 className="mt-2 text-2xl font-semibold text-ink">Editable public copy</h2>
        </div>
        {status ? <p className="text-sm text-ink/62">{status}</p> : null}
      </div>

      <div className="grid gap-4">
        {items.map((entry) => (
          <article className="rounded-[24px] border border-white/28 bg-white/16 p-4" key={entry.id}>
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-ink/68">{entry.section}</p>
              <button
                className="glass-button-muted text-xs uppercase tracking-[0.24em]"
                onClick={() => {
                  const textarea = document.getElementById(entry.id) as HTMLTextAreaElement | null;
                  if (textarea) {
                    void saveEntry(entry.id, textarea.value);
                  }
                }}
                type="button"
              >
                Save
              </button>
            </div>
            <textarea
              className="min-h-[140px] w-full rounded-[20px] border border-white/26 bg-white/22 px-4 py-3 text-sm text-ink outline-none"
              defaultValue={serializeContent(entry.content)}
              id={entry.id}
            />
          </article>
        ))}
      </div>
    </section>
  );
}
