"use client";

import { useState } from "react";

import type { SettingEntry } from "@/lib/types";

type MusicLinkEditorProps = {
  settings: SettingEntry[];
};

function getSetting(settings: SettingEntry[], key: string, fallback = "") {
  return settings.find((setting) => setting.key === key)?.value ?? fallback;
}

export function MusicLinkEditor({ settings }: MusicLinkEditorProps) {
  const [musicUrl, setMusicUrl] = useState(getSetting(settings, "music_url"));
  const [version, setVersion] = useState(getSetting(settings, "site_version", "v1.0.3"));
  const [status, setStatus] = useState<string | null>(null);

  async function saveSetting(key: string, value: string) {
    const setting = settings.find((entry) => entry.key === key);
    if (!setting) {
      return;
    }

    const response = await fetch("/api/content?resource=settings", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: setting.id,
        payload: {
          value,
        },
      }),
    });

    if (!response.ok) {
      throw new Error("Settings save failed");
    }
  }

  async function saveAll() {
    setStatus("Saving settings...");

    try {
      await Promise.all([saveSetting("music_url", musicUrl), saveSetting("site_version", version)]);
      window.dispatchEvent(new CustomEvent("portfolio:music-url-updated", { detail: musicUrl }));
      setStatus("Settings updated.");
    } catch (error) {
      console.warn("Settings save failed.", error);
      setStatus("Settings update failed.");
    }
  }

  return (
    <section className="section-card">
      <div className="mb-6">
        <p className="text-xs uppercase tracking-[0.26em] text-ink/52">Global settings</p>
        <h2 className="mt-2 text-2xl font-semibold text-ink">Music and version controls</h2>
      </div>

      <div className="grid gap-4">
        <input
          className="w-full rounded-[20px] border border-white/20 bg-[rgba(255,255,255,0.14)] px-4 py-3 text-sm text-ink outline-none backdrop-blur-xl transition-all duration-300 placeholder:text-ink/40 focus:border-[rgba(var(--accent-rgb),0.34)] focus:bg-[rgba(255,255,255,0.18)] focus:shadow-[0_0_0_4px_rgba(var(--accent-rgb),0.08)]"
          onChange={(event) => setMusicUrl(event.target.value)}
          placeholder="YouTube video or playlist URL"
          value={musicUrl}
        />
        <input
          className="w-full rounded-[20px] border border-white/20 bg-[rgba(255,255,255,0.14)] px-4 py-3 text-sm text-ink outline-none backdrop-blur-xl transition-all duration-300 placeholder:text-ink/40 focus:border-[rgba(var(--accent-rgb),0.34)] focus:bg-[rgba(255,255,255,0.18)] focus:shadow-[0_0_0_4px_rgba(var(--accent-rgb),0.08)]"
          onChange={(event) => setVersion(event.target.value)}
          placeholder="Site version"
          value={version}
        />
        <div className="flex items-center gap-3">
          <button className="glass-button" onClick={saveAll} type="button">
            Save settings
          </button>
          {status ? <p className="text-sm text-ink/64">{status}</p> : null}
        </div>
      </div>
    </section>
  );
}
