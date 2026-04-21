"use client";

import { useRouter } from "next/navigation";

import { AnalyticsDashboard } from "@/components/admin/AnalyticsDashboard";
import { CollectionManager } from "@/components/admin/CollectionManager";
import { ContentEditor } from "@/components/admin/ContentEditor";
import { MusicLinkEditor } from "@/components/admin/MusicLinkEditor";
import { ReviewManager } from "@/components/admin/ReviewManager";
import type { AnalyticsSummary, PortfolioData } from "@/lib/types";

type AdminPanelProps = {
  data: PortfolioData;
  summary: AnalyticsSummary;
  adminEmail: string;
};

export function AdminPanel({ data, summary, adminEmail }: AdminPanelProps) {
  const router = useRouter();

  async function logout() {
    await fetch("/api/admin/logout", {
      method: "POST",
    });
    router.push("/");
  }

  return (
    <main className="section-wrap pt-32">
      <section className="section-card mb-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="glass-chip w-fit">Protected control room</p>
            <h1 className="mt-4 text-4xl font-semibold text-ink md:text-5xl">Admin Panel</h1>
            <p className="mt-3 text-sm leading-7 text-ink/68">
              Signed in as {adminEmail}. Manage the portfolio content, soundtrack, moderation, and
              anonymous analytics from one place.
            </p>
          </div>
          <button className="glass-button" onClick={logout} type="button">
            Logout
          </button>
        </div>
      </section>

      <div className="space-y-6">
        <ContentEditor entries={data.siteContent} />
        <CollectionManager
          description="Manage skill chips shown on the public homepage."
          items={data.skills}
          resource="skills"
          title="Skills Manager"
        />
        <CollectionManager
          description="Manage timeline entries for work, study, and project experience."
          items={data.experience}
          resource="experience"
          title="Experience Manager"
        />
        <CollectionManager
          description="Manage featured project cards and their tech stack tags."
          items={data.projects}
          resource="projects"
          title="Projects Manager"
        />
        <ReviewManager reviews={data.reviews} />
        <MusicLinkEditor settings={data.settings} />
        <AnalyticsDashboard summary={summary} />
      </div>
    </main>
  );
}
