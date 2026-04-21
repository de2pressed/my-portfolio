"use client";

import type { AnalyticsSummary } from "@/lib/types";
import { formatDuration, formatTimestamp } from "@/lib/utils";

type AnalyticsDashboardProps = {
  summary: AnalyticsSummary;
};

export function AnalyticsDashboard({ summary }: AnalyticsDashboardProps) {
  return (
    <section className="section-card">
      <div className="mb-6">
        <p className="text-xs uppercase tracking-[0.26em] text-ink/52">Analytics</p>
        <h2 className="mt-2 text-2xl font-semibold text-ink">Anonymous engagement snapshot</h2>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-[24px] border border-white/10 bg-[rgba(10,10,14,0.34)] p-4">
          <p className="text-xs uppercase tracking-[0.26em] text-ink/48">Total visits</p>
          <p className="mt-3 text-3xl font-semibold text-ink">{summary.totalVisits}</p>
        </div>
        <div className="rounded-[24px] border border-white/10 bg-[rgba(10,10,14,0.34)] p-4">
          <p className="text-xs uppercase tracking-[0.26em] text-ink/48">Unique visitors</p>
          <p className="mt-3 text-3xl font-semibold text-ink">{summary.uniqueVisitors}</p>
        </div>
        <div className="rounded-[24px] border border-white/10 bg-[rgba(10,10,14,0.34)] p-4">
          <p className="text-xs uppercase tracking-[0.26em] text-ink/48">Avg session</p>
          <p className="mt-3 text-3xl font-semibold text-ink">{formatDuration(summary.averageSessionDuration)}</p>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-[24px] border border-white/10 bg-[rgba(10,10,14,0.34)] p-5">
          <p className="text-xs uppercase tracking-[0.26em] text-ink/48">Most viewed sections</p>
          <div className="mt-4 space-y-3">
            {summary.mostViewedSections.length > 0 ? (
              summary.mostViewedSections.map((section) => (
                <div className="flex items-center justify-between text-sm text-ink/70" key={section.section}>
                  <span>{section.section}</span>
                  <span>{section.count}</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-ink/60">No tracked section activity yet.</p>
            )}
          </div>
        </div>

        <div className="rounded-[24px] border border-white/10 bg-[rgba(10,10,14,0.34)] p-5">
          <p className="text-xs uppercase tracking-[0.26em] text-ink/48">Recent activity</p>
          <div className="mt-4 space-y-3">
            {summary.recentActivity.length > 0 ? (
              summary.recentActivity.map((activity) => (
                <div className="text-sm text-ink/70" key={`${activity.label}-${activity.timestamp}`}>
                  <p>{activity.label}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.18em] text-ink/46">
                    {formatTimestamp(activity.timestamp)}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-ink/60">No analytics events have been recorded yet.</p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
