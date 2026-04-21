import { getFallbackStore, replaceFallbackCollection } from "@/lib/fallback-store";
import type {
  AnalyticsEvent,
  AnalyticsSummary,
  ContentResource,
  ExperienceEntry,
  PortfolioData,
  ProjectEntry,
  ReviewEntry,
  SettingEntry,
  SiteContentEntry,
  SkillEntry,
} from "@/lib/types";
import { getSupabaseServiceClient, isSupabaseConfigured } from "@/lib/supabase/server";

type ResourceMap = {
  site_content: SiteContentEntry;
  skills: SkillEntry;
  experience: ExperienceEntry;
  projects: ProjectEntry;
  settings: SettingEntry;
};

function sortPortfolioData(data: PortfolioData): PortfolioData {
  return {
    siteContent: [...data.siteContent].sort((a, b) => a.section.localeCompare(b.section)),
    skills: [...data.skills].sort((a, b) => a.sort_order - b.sort_order),
    experience: [...data.experience].sort((a, b) => a.sort_order - b.sort_order),
    projects: [...data.projects].sort((a, b) => a.sort_order - b.sort_order),
    reviews: [...data.reviews].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    ),
    settings: [...data.settings].sort((a, b) => a.key.localeCompare(b.key)),
  };
}

async function loadSupabasePortfolioData(): Promise<PortfolioData | null> {
  const client = getSupabaseServiceClient();

  if (!client) {
    return null;
  }

  try {
    const [siteContent, skills, experience, projects, reviews, settings] = await Promise.all([
      client.from("site_content").select("*"),
      client.from("skills").select("*"),
      client.from("experience").select("*"),
      client.from("projects").select("*"),
      client.from("reviews").select("*"),
      client.from("settings").select("*"),
    ]);

    const responses = [siteContent, skills, experience, projects, reviews, settings];
    const failed = responses.find((response) => response.error);

    if (failed?.error) {
      throw failed.error;
    }

    return sortPortfolioData({
      siteContent: (siteContent.data ?? []) as SiteContentEntry[],
      skills: (skills.data ?? []) as SkillEntry[],
      experience: (experience.data ?? []) as ExperienceEntry[],
      projects: (projects.data ?? []) as ProjectEntry[],
      reviews: (reviews.data ?? []) as ReviewEntry[],
      settings: (settings.data ?? []) as SettingEntry[],
    });
  } catch (error) {
    console.warn("Falling back to seeded portfolio data because Supabase read failed.", error);
    return null;
  }
}

export async function getPortfolioData(): Promise<PortfolioData> {
  if (isSupabaseConfigured()) {
    const remote = await loadSupabasePortfolioData();
    if (remote) {
      return remote;
    }
  }

  const store = getFallbackStore();
  return sortPortfolioData({
    siteContent: store.siteContent,
    skills: store.skills,
    experience: store.experience,
    projects: store.projects,
    reviews: store.reviews,
    settings: store.settings,
  });
}

export async function getPublicPortfolioData() {
  const data = await getPortfolioData();
  return {
    ...data,
    reviews: data.reviews.filter((review) => review.is_visible),
  };
}

export async function getSettingValue(key: string, fallback = "") {
  const data = await getPortfolioData();
  return data.settings.find((entry) => entry.key === key)?.value ?? fallback;
}

export async function listResource<K extends ContentResource>(resource: K): Promise<ResourceMap[K][]> {
  if (isSupabaseConfigured()) {
    const client = getSupabaseServiceClient();
    if (client) {
      const { data, error } = await client.from(resource as never).select("*");
      if (!error) {
        return (data ?? []) as ResourceMap[K][];
      }
    }
  }

  const store = getFallbackStore();

  switch (resource) {
    case "site_content":
      return [...store.siteContent] as ResourceMap[K][];
    case "skills":
      return [...store.skills] as ResourceMap[K][];
    case "experience":
      return [...store.experience] as ResourceMap[K][];
    case "projects":
      return [...store.projects] as ResourceMap[K][];
    case "settings":
      return [...store.settings] as ResourceMap[K][];
    default:
      return [] as ResourceMap[K][];
  }
}

function getFallbackKey(resource: ContentResource) {
  switch (resource) {
    case "site_content":
      return "siteContent";
    case "skills":
      return "skills";
    case "experience":
      return "experience";
    case "projects":
      return "projects";
    case "settings":
      return "settings";
  }
}

export async function createResource<K extends ContentResource>(
  resource: K,
  payload: ResourceMap[K],
): Promise<ResourceMap[K]> {
  if (isSupabaseConfigured()) {
    const client = getSupabaseServiceClient();
    if (client) {
      const { data, error } = await client
        .from(resource as never)
        .insert(payload as never)
        .select()
        .single();
      if (!error && data) {
        return data as ResourceMap[K];
      }
    }
  }

  const key = getFallbackKey(resource);
  const existing = (await listResource(resource)) as ResourceMap[K][];
  replaceFallbackCollection(key, [...existing, payload] as never);
  return payload;
}

export async function updateResource<K extends ContentResource>(
  resource: K,
  id: string,
  payload: Partial<ResourceMap[K]>,
): Promise<ResourceMap[K] | null> {
  if (isSupabaseConfigured()) {
    const client = getSupabaseServiceClient();
    if (client) {
      const { data, error } = await client
        .from(resource as never)
        .update(payload as never)
        .eq("id", id)
        .select()
        .single();
      if (!error && data) {
        return data as ResourceMap[K];
      }
    }
  }

  const key = getFallbackKey(resource);
  const existing = (await listResource(resource)) as Array<ResourceMap[K] & { id: string }>;
  const next = existing.map((item) => (item.id === id ? { ...item, ...payload } : item));
  replaceFallbackCollection(key, next as never);
  return (next.find((item) => item.id === id) ?? null) as ResourceMap[K] | null;
}

export async function deleteResource(resource: ContentResource, id: string) {
  if (isSupabaseConfigured()) {
    const client = getSupabaseServiceClient();
    if (client) {
      const { error } = await client.from(resource as never).delete().eq("id", id);
      if (!error) {
        return true;
      }
    }
  }

  const key = getFallbackKey(resource);
  const existing = await listResource(resource);
  replaceFallbackCollection(
    key,
    existing.filter((item) => item.id !== id) as never,
  );
  return true;
}

export async function listReviews(includeHidden = false) {
  if (isSupabaseConfigured()) {
    const client = getSupabaseServiceClient();
    if (client) {
      const query = client.from("reviews").select("*");
      const scoped = includeHidden ? query : query.eq("is_visible", true);
      const { data, error } = await scoped.order("created_at", { ascending: false });
      if (!error) {
        return (data ?? []) as ReviewEntry[];
      }
    }
  }

  const store = getFallbackStore();
  const reviews = [...store.reviews].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );
  return includeHidden ? reviews : reviews.filter((review) => review.is_visible);
}

export async function createReview(payload: ReviewEntry) {
  if (isSupabaseConfigured()) {
    const client = getSupabaseServiceClient();
    if (client) {
      const { data, error } = await client.from("reviews").insert(payload).select().single();
      if (!error && data) {
        return data as ReviewEntry;
      }
    }
  }

  const store = getFallbackStore();
  store.reviews = [payload, ...store.reviews];
  return payload;
}

export async function updateReview(id: string, payload: Partial<ReviewEntry>) {
  if (isSupabaseConfigured()) {
    const client = getSupabaseServiceClient();
    if (client) {
      const { data, error } = await client.from("reviews").update(payload).eq("id", id).select().single();
      if (!error && data) {
        return data as ReviewEntry;
      }
    }
  }

  const store = getFallbackStore();
  store.reviews = store.reviews.map((review) => (review.id === id ? { ...review, ...payload } : review));
  return store.reviews.find((review) => review.id === id) ?? null;
}

export async function deleteReview(id: string) {
  if (isSupabaseConfigured()) {
    const client = getSupabaseServiceClient();
    if (client) {
      const { error } = await client.from("reviews").delete().eq("id", id);
      if (!error) {
        return true;
      }
    }
  }

  const store = getFallbackStore();
  store.reviews = store.reviews.filter((review) => review.id !== id);
  return true;
}

export async function storeAnalyticsEvent(event: AnalyticsEvent) {
  if (isSupabaseConfigured()) {
    const client = getSupabaseServiceClient();
    if (client) {
      const { error } = await client.from("analytics_events").insert(event);
      if (!error) {
        return event;
      }
    }
  }

  const store = getFallbackStore();
  store.analyticsEvents = [...store.analyticsEvents, event];
  return event;
}

export async function getAnalyticsSummary(): Promise<AnalyticsSummary> {
  let events: AnalyticsEvent[] = [];

  if (isSupabaseConfigured()) {
    const client = getSupabaseServiceClient();
    if (client) {
      const { data, error } = await client
        .from("analytics_events")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error) {
        events = (data ?? []) as AnalyticsEvent[];
      }
    }
  }

  if (events.length === 0) {
    events = [...getFallbackStore().analyticsEvents].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );
  }

  const totalVisits = events.filter((event) => event.event_type === "page_view").length;
  const uniqueVisitors = new Set(events.map((event) => event.visitor_id)).size;
  const sessionDurations = events
    .filter((event) => event.event_type === "session_end")
    .map((event) => Number(event.metadata.duration_ms ?? 0))
    .filter((value) => value > 0);
  const averageSessionDuration =
    sessionDurations.length > 0
      ? Math.round(sessionDurations.reduce((sum, value) => sum + value, 0) / sessionDurations.length / 1000)
      : 0;

  const sectionCounts = new Map<string, number>();
  for (const event of events.filter((item) => item.event_type === "section_scroll")) {
    const section = String(event.metadata.section ?? "unknown");
    sectionCounts.set(section, (sectionCounts.get(section) ?? 0) + 1);
  }

  const mostViewedSections = [...sectionCounts.entries()]
    .map(([section, count]) => ({ section, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const recentActivity = events.slice(0, 8).map((event) => ({
    label:
      event.event_type === "section_scroll"
        ? `Section viewed: ${String(event.metadata.section ?? "unknown")}`
        : event.event_type.replaceAll("_", " "),
    timestamp: event.created_at,
  }));

  return {
    totalVisits,
    uniqueVisitors,
    averageSessionDuration,
    mostViewedSections,
    recentActivity,
  };
}
