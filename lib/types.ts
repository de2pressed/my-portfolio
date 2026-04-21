export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

export type SiteContentEntry = {
  id: string;
  section: string;
  content: JsonValue;
  updated_at: string;
};

export type SkillEntry = {
  id: string;
  name: string;
  category: string;
  icon?: string | null;
  sort_order: number;
  created_at: string;
};

export type ExperienceEntry = {
  id: string;
  title: string;
  organization: string;
  date_range: string;
  description: string[];
  link?: string | null;
  sort_order: number;
  created_at: string;
};

export type ProjectEntry = {
  id: string;
  title: string;
  description: string[];
  tech_stack: string[];
  link?: string | null;
  image_url?: string | null;
  sort_order: number;
  created_at: string;
};

export type ReviewEntry = {
  id: string;
  email: string;
  display_name: string;
  message: string;
  created_at: string;
  is_visible: boolean;
};

export type AnalyticsEvent = {
  id: string;
  event_type: string;
  visitor_id: string;
  metadata: Record<string, JsonValue>;
  created_at: string;
};

export type SettingEntry = {
  id: string;
  key: string;
  value: string;
  updated_at: string;
};

export type PortfolioData = {
  siteContent: SiteContentEntry[];
  skills: SkillEntry[];
  experience: ExperienceEntry[];
  projects: ProjectEntry[];
  reviews: ReviewEntry[];
  settings: SettingEntry[];
};

export type AnalyticsSummary = {
  totalVisits: number;
  uniqueVisitors: number;
  averageSessionDuration: number;
  mostViewedSections: Array<{ section: string; count: number }>;
  recentActivity: Array<{ label: string; timestamp: string }>;
};

export type ContentResource =
  | "site_content"
  | "skills"
  | "experience"
  | "projects"
  | "settings";
