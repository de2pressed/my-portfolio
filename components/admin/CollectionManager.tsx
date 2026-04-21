"use client";

import { type FormEvent, useState } from "react";

import type { ContentResource, ExperienceEntry, ProjectEntry, SkillEntry } from "@/lib/types";
import { createId } from "@/lib/utils";

type CollectionManagerProps = {
  resource: Extract<ContentResource, "skills" | "experience" | "projects">;
  title: string;
  description: string;
  items: Array<SkillEntry | ExperienceEntry | ProjectEntry>;
};

function serializeItem(
  resource: CollectionManagerProps["resource"],
  item?: SkillEntry | ExperienceEntry | ProjectEntry,
) {
  if (resource === "skills") {
    const skill = item as SkillEntry | undefined;
    return {
      id: skill?.id ?? createId("skill"),
      name: skill?.name ?? "",
      category: skill?.category ?? "",
      icon: skill?.icon ?? "",
      sort_order: skill?.sort_order ?? 1,
      created_at: skill?.created_at ?? new Date().toISOString(),
    };
  }

  if (resource === "experience") {
    const experience = item as ExperienceEntry | undefined;
    return {
      id: experience?.id ?? createId("experience"),
      title: experience?.title ?? "",
      organization: experience?.organization ?? "",
      date_range: experience?.date_range ?? "",
      description: (experience?.description ?? []).join("\n"),
      link: experience?.link ?? "",
      sort_order: experience?.sort_order ?? 1,
      created_at: experience?.created_at ?? new Date().toISOString(),
    };
  }

  const project = item as ProjectEntry | undefined;
  return {
    id: project?.id ?? createId("project"),
    title: project?.title ?? "",
    description: (project?.description ?? []).join("\n"),
    tech_stack: (project?.tech_stack ?? []).join(", "),
    link: project?.link ?? "",
    image_url: project?.image_url ?? "",
    sort_order: project?.sort_order ?? 1,
    created_at: project?.created_at ?? new Date().toISOString(),
  };
}

function normalizePayload(resource: CollectionManagerProps["resource"], value: Record<string, FormDataEntryValue>) {
  if (resource === "skills") {
    return {
      id: String(value.id),
      ...value,
      icon: String(value.icon || ""),
      sort_order: Number(value.sort_order || 1),
      created_at: String(value.created_at),
    };
  }

  if (resource === "experience") {
    return {
      id: String(value.id),
      ...value,
      description: String(value.description)
        .split("\n")
        .map((item) => item.trim())
        .filter(Boolean),
      link: String(value.link || "") || null,
      sort_order: Number(value.sort_order || 1),
      created_at: String(value.created_at),
    };
  }

  return {
    id: String(value.id),
    ...value,
    description: String(value.description)
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean),
    tech_stack: String(value.tech_stack)
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean),
    link: String(value.link || "") || null,
    image_url: String(value.image_url || "") || null,
    sort_order: Number(value.sort_order || 1),
    created_at: String(value.created_at),
  };
}

export function CollectionManager({
  resource,
  title,
  description,
  items,
}: CollectionManagerProps) {
  const [records, setRecords] = useState(items);
  const [draft, setDraft] = useState<Record<string, unknown> | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  async function submitForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const values = Object.fromEntries(formData.entries());
    const payload = normalizePayload(resource, values) as Record<string, unknown> & { id: string };
    const existing = records.find((record) => record.id === payload.id);
    const method = existing ? "PUT" : "POST";

    setStatus(existing ? "Updating record..." : "Creating record...");

    try {
      const response = await fetch(`/api/content?resource=${resource}`, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(
          existing
            ? { id: payload.id, payload }
            : { payload },
        ),
      });

      if (!response.ok) {
        throw new Error("Collection update failed");
      }

      const result = (await response.json()) as { item: SkillEntry | ExperienceEntry | ProjectEntry };
      setRecords((current) => {
        if (existing) {
          return current.map((record) => (record.id === result.item.id ? result.item : record));
        }
        return [...current, result.item];
      });
      setDraft(null);
      setStatus("Record saved.");
    } catch (error) {
      console.warn("Collection update failed.", error);
      setStatus("Record save failed.");
    }
  }

  async function removeItem(id: string) {
    setStatus("Removing record...");
    try {
      const response = await fetch(`/api/content?resource=${resource}&id=${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Delete failed");
      }

      setRecords((current) => current.filter((record) => record.id !== id));
      if (draft && String(draft.id ?? "") === id) {
        setDraft(null);
      }
      setStatus("Record removed.");
    } catch (error) {
      console.warn("Collection delete failed.", error);
      setStatus("Record delete failed.");
    }
  }

  const activeDraft = draft ?? serializeItem(resource);

  return (
    <section className="section-card">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.26em] text-ink/52">{resource}</p>
          <h2 className="mt-2 text-2xl font-semibold text-ink">{title}</h2>
          <p className="mt-2 max-w-2xl text-sm text-ink/66">{description}</p>
        </div>
        <div className="flex items-center gap-3">
          {status ? <p className="text-sm text-ink/62">{status}</p> : null}
          <button className="glass-button" onClick={() => setDraft(serializeItem(resource))} type="button">
            Add entry
          </button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="space-y-3">
          {records.length > 0 ? (
            records
              .slice()
              .sort((a, b) => a.sort_order - b.sort_order)
              .map((record) => (
                <article className="rounded-[24px] border border-white/10 bg-[rgba(10,10,14,0.34)] p-4" key={record.id}>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-lg font-semibold text-ink">
                        {"name" in record ? record.name : record.title}
                      </p>
                      <p className="mt-1 text-sm text-ink/64">
                        {"category" in record
                          ? record.category
                          : "organization" in record
                            ? record.organization
                            : `${record.tech_stack.length} technologies`}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        className="glass-button-muted text-xs uppercase tracking-[0.24em]"
                        onClick={() => setDraft(serializeItem(resource, record))}
                        type="button"
                      >
                        Edit
                      </button>
                      <button
                        className="glass-button-muted text-xs uppercase tracking-[0.24em]"
                        onClick={() => removeItem(record.id)}
                        type="button"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </article>
              ))
          ) : (
            <div className="rounded-[24px] border border-white/10 bg-[rgba(10,10,14,0.34)] p-4 text-sm text-ink/64">
              No entries yet.
            </div>
          )}
        </div>

        <form className="space-y-4 rounded-[28px] border border-white/10 bg-[rgba(10,10,14,0.34)] p-5" onSubmit={submitForm}>
          <input name="id" type="hidden" value={String(activeDraft.id ?? "")} />
          <input name="created_at" type="hidden" value={String(activeDraft.created_at ?? new Date().toISOString())} />

          {resource === "skills" ? (
            <>
              <input className="w-full rounded-[18px] border border-white/10 bg-[rgba(10,10,14,0.36)] px-4 py-3 text-sm" defaultValue={String(activeDraft.name ?? "")} name="name" placeholder="Skill name" required />
              <input className="w-full rounded-[18px] border border-white/10 bg-[rgba(10,10,14,0.36)] px-4 py-3 text-sm" defaultValue={String(activeDraft.category ?? "")} name="category" placeholder="Category" required />
              <input className="w-full rounded-[18px] border border-white/10 bg-[rgba(10,10,14,0.36)] px-4 py-3 text-sm" defaultValue={String(activeDraft.icon ?? "")} name="icon" placeholder="Icon label (optional)" />
            </>
          ) : null}

          {resource === "experience" ? (
            <>
              <input className="w-full rounded-[18px] border border-white/10 bg-[rgba(10,10,14,0.36)] px-4 py-3 text-sm" defaultValue={String(activeDraft.title ?? "")} name="title" placeholder="Title" required />
              <input className="w-full rounded-[18px] border border-white/10 bg-[rgba(10,10,14,0.36)] px-4 py-3 text-sm" defaultValue={String(activeDraft.organization ?? "")} name="organization" placeholder="Organization" required />
              <input className="w-full rounded-[18px] border border-white/10 bg-[rgba(10,10,14,0.36)] px-4 py-3 text-sm" defaultValue={String(activeDraft.date_range ?? "")} name="date_range" placeholder="Date range" required />
              <textarea className="min-h-[180px] w-full rounded-[18px] border border-white/10 bg-[rgba(10,10,14,0.36)] px-4 py-3 text-sm" defaultValue={String(activeDraft.description ?? "")} name="description" placeholder="One bullet per line" required />
              <input className="w-full rounded-[18px] border border-white/10 bg-[rgba(10,10,14,0.36)] px-4 py-3 text-sm" defaultValue={String(activeDraft.link ?? "")} name="link" placeholder="Optional link" />
            </>
          ) : null}

          {resource === "projects" ? (
            <>
              <input className="w-full rounded-[18px] border border-white/10 bg-[rgba(10,10,14,0.36)] px-4 py-3 text-sm" defaultValue={String(activeDraft.title ?? "")} name="title" placeholder="Title" required />
              <textarea className="min-h-[180px] w-full rounded-[18px] border border-white/10 bg-[rgba(10,10,14,0.36)] px-4 py-3 text-sm" defaultValue={String(activeDraft.description ?? "")} name="description" placeholder="One bullet per line" required />
              <input className="w-full rounded-[18px] border border-white/10 bg-[rgba(10,10,14,0.36)] px-4 py-3 text-sm" defaultValue={String(activeDraft.tech_stack ?? "")} name="tech_stack" placeholder="Comma separated tech stack" required />
              <input className="w-full rounded-[18px] border border-white/10 bg-[rgba(10,10,14,0.36)] px-4 py-3 text-sm" defaultValue={String(activeDraft.link ?? "")} name="link" placeholder="Optional link" />
              <input className="w-full rounded-[18px] border border-white/10 bg-[rgba(10,10,14,0.36)] px-4 py-3 text-sm" defaultValue={String(activeDraft.image_url ?? "")} name="image_url" placeholder="Optional image URL" />
            </>
          ) : null}

          <input className="w-full rounded-[18px] border border-white/10 bg-[rgba(10,10,14,0.36)] px-4 py-3 text-sm" defaultValue={String(activeDraft.sort_order ?? 1)} min={1} name="sort_order" placeholder="Sort order" type="number" />

          <div className="flex gap-3">
            <button className="glass-button" type="submit">
              Save
            </button>
            <button className="glass-button-muted" onClick={() => setDraft(null)} type="button">
              Reset
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
