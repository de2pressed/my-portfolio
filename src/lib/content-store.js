import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildThumbnailUrl, parseYouTubeSource } from '../utils/youtubeHelpers';
import {
  createServiceClient,
  hasSupabaseConfig,
} from './supabase';

const moduleDir = dirname(fileURLToPath(import.meta.url));

function readJson(relativePath) {
  return JSON.parse(readFileSync(resolve(moduleDir, relativePath), 'utf8'));
}

const projects = readJson('../data/projects.json');
const skillsSeed = readJson('../data/skills.json');
const experienceSeed = readJson('../data/experience.json');
const siteConfig = readJson('../data/siteConfig.json');

const fallbackState = createFallbackState();

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function createFallbackState() {
  const [primaryTrack] = createFallbackTracks();

  return {
    experience: experienceSeed.map((entry, index) => ({
      ...entry,
      sortOrder: index,
    })),
    reviews: [],
    siteSettings: {
      bio: siteConfig.bio,
      defaultTrackId: primaryTrack?.id || 'main-theme',
      email: siteConfig.email,
      github: siteConfig.github,
      heroCta: 'Enter the atmosphere',
      lastUpdated: siteConfig.lastUpdated,
      location: siteConfig.location,
      name: siteConfig.name,
      tagline: siteConfig.tagline,
      youtubeLink: siteConfig.youtubeLink,
    },
    skills: skillsSeed.map((skill) => ({
      ...skill,
      category: 'Core',
      iconUrl: '',
    })),
    tracks: createFallbackTracks(),
    works: createFallbackWorks(),
    analytics: {
      events: [],
      routes: [],
      sessions: [],
    },
  };
}

function createFallbackWorks() {
  return [
    ...projects.map((project, index) => ({
      body: `${project.description}\n\nThis entry is seeded from the portfolio brain and can be edited from the admin dashboard.`,
      coverUrl:
        project.thumbnail ||
        'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80',
      externalUrl: project.link || '',
      featured: Boolean(project.featured),
      galleryUrls: project.thumbnail
        ? [project.thumbnail]
        : [
            'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80',
            'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80',
          ],
      id: project.id,
      published: true,
      repoUrl: project.link || '',
      slug: project.id,
      sortOrder: index,
      summary: project.description,
      tags: project.tags || [],
      title: project.title,
      type: 'project',
    })),
    {
      body: 'A seeded art entry to establish the gallery/archive feel from day one.',
      coverUrl:
        'https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&w=1200&q=80',
      externalUrl: '',
      featured: true,
      galleryUrls: [
        'https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&w=1200&q=80',
      ],
      id: 'glass-study-01',
      published: true,
      repoUrl: '',
      slug: 'glass-study-01',
      sortOrder: 99,
      summary: 'A seeded art entry to establish the shared works system.',
      tags: ['Glass', 'Motion', 'Ambient'],
      title: 'Glass Study 01',
      type: 'art',
    },
  ];
}

function createFallbackTracks() {
  const source = siteConfig.youtubeLink || '';
  const { videoId } = parseYouTubeSource(source);
  const artworkUrl = buildThumbnailUrl(videoId);

  return [
    {
      accentColor: '#f5c56a',
      artist: 'Portfolio System',
      artworkUrl,
      id: 'main-theme',
      published: true,
      sortOrder: 0,
      title: 'Main Theme',
      youtubeUrl: source,
    },
  ];
}

function mapSiteSettings(row) {
  if (!row) {
    return null;
  }

  return {
    bio: row.bio || '',
    defaultTrackId: row.default_track_id || row.defaultTrackId || '',
    email: row.email || '',
    github: row.github || '',
    heroCta: row.hero_cta || row.heroCta || 'Enter the atmosphere',
    lastUpdated: row.last_updated || row.lastUpdated || '',
    location: row.location || '',
    name: row.name || '',
    tagline: row.tagline || '',
    youtubeLink: row.youtube_url || row.youtubeLink || '',
  };
}

function mapWork(row) {
  return {
    body: row.body || '',
    coverUrl: row.cover_url || row.coverUrl || '',
    externalUrl: row.external_url || row.externalUrl || '',
    featured: Boolean(row.featured),
    galleryUrls: Array.isArray(row.gallery_urls)
      ? row.gallery_urls
      : Array.isArray(row.galleryUrls)
        ? row.galleryUrls
        : safeParse(row.gallery_urls, []),
    id: row.id,
    published: row.published !== false && row.published !== 0,
    repoUrl: row.repo_url || row.repoUrl || '',
    slug: row.slug,
    sortOrder: Number(row.sort_order ?? row.sortOrder ?? 0),
    summary: row.summary || '',
    tags: Array.isArray(row.tags) ? row.tags : safeParse(row.tags, []),
    title: row.title || '',
    type: row.type === 'art' ? 'art' : 'project',
  };
}

function mapSkill(row) {
  return {
    category: row.category || 'Core',
    iconUrl: row.icon_url || row.iconUrl || '',
    id: row.id,
    label: row.label || '',
    weight: Number(row.weight || 0),
  };
}

function mapExperience(row) {
  return {
    description: row.description || '',
    id: row.id,
    organization: row.organization || '',
    period: row.period || '',
    sortOrder: Number(row.sort_order ?? row.sortOrder ?? 0),
    title: row.title || '',
    type: row.type || 'experience',
  };
}

function mapTrack(row) {
  const youtubeUrl = row.youtube_url || row.youtubeUrl || '';
  const { videoId } = parseYouTubeSource(youtubeUrl);

  return {
    accentColor: row.accent_color || row.accentColor || '',
    artist: row.artist || '',
    artworkUrl: row.artwork_url || row.artworkUrl || buildThumbnailUrl(videoId),
    id: row.id,
    published: row.published !== false && row.published !== 0,
    sortOrder: Number(row.sort_order ?? row.sortOrder ?? 0),
    title: row.title || '',
    youtubeUrl,
  };
}

function mapReview(row) {
  return {
    createdAt: row.created_at || row.createdAt || '',
    email: row.email || '',
    id: row.id,
    message: row.message || '',
    name: row.name || 'Anonymous',
  };
}

function safeParse(value, fallback) {
  if (!value) {
    return fallback;
  }

  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function normalizeSlug(input, fallbackTitle = '') {
  return String(input || fallbackTitle || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function createLocalId(prefix) {
  return `${prefix}-${randomUUID().slice(0, 8)}`;
}

function getLocalContent() {
  return {
    experience: clone(fallbackState.experience),
    siteSettings: clone(fallbackState.siteSettings),
    skills: clone(fallbackState.skills),
    tracks: clone(fallbackState.tracks),
    works: clone(fallbackState.works),
  };
}

function getLocalReviews() {
  return clone(fallbackState.reviews);
}

function getLocalStats() {
  const acceptedSessions = fallbackState.analytics.sessions.filter(
    (session) => session.consentState === 'accepted',
  );
  const topRoutes = [...fallbackState.analytics.routes]
    .sort((left, right) => right.views - left.views)
    .slice(0, 8);
  const eventCounts = Object.entries(
    fallbackState.analytics.events.reduce((accumulator, event) => {
      accumulator[event.eventType] = (accumulator[event.eventType] || 0) + 1;
      return accumulator;
    }, {}),
  ).map(([event_type, count]) => ({ count, event_type }));

  return {
    averageStaySeconds: Math.round(
      acceptedSessions.length
        ? acceptedSessions.reduce((sum, session) => sum + session.durationMs, 0) /
            acceptedSessions.length /
            1000
        : 0,
    ),
    averageViewsPerSession: Number(
      (
        acceptedSessions.length
          ? acceptedSessions.reduce((sum, session) => sum + session.pageViews, 0) /
            acceptedSessions.length
          : 0
      ).toFixed(1),
    ),
    consentBreakdown: Object.entries(
      fallbackState.analytics.sessions.reduce((accumulator, session) => {
        accumulator[session.consentState] = (accumulator[session.consentState] || 0) + 1;
        return accumulator;
      }, {}),
    ).map(([consent_state, count]) => ({ consent_state, count })),
    eventCounts,
    lastUpdated: fallbackState.siteSettings.lastUpdated,
    reviewCount: fallbackState.reviews.length,
    topRoutes: topRoutes.map((route) => ({
      duration_ms: route.durationMs,
      path: route.path,
      views: route.views,
    })),
    uniqueRoutes: topRoutes.length,
    visits: acceptedSessions.length,
    workViews: fallbackState.analytics.events
      .filter((event) => event.eventType === 'work_view')
      .reduce((accumulator, event) => {
        const match = accumulator.find((entry) => entry.path === event.path);

        if (match) {
          match.views += 1;
        } else {
          accumulator.push({ path: event.path, views: 1 });
        }

        return accumulator;
      }, []),
  };
}

async function getRemoteClient() {
  const client = createServiceClient();

  if (!client) {
    return null;
  }

  return client;
}

async function getRemoteContent() {
  const client = await getRemoteClient();

  if (!client) {
    return null;
  }

  const [settingsResult, worksResult, skillsResult, experienceResult, tracksResult] =
    await Promise.all([
      client.from('site_settings').select('*').eq('id', 1).maybeSingle(),
      client
        .from('works')
        .select('*')
        .order('featured', { ascending: false })
        .order('sort_order', { ascending: true })
        .order('title', { ascending: true }),
      client
        .from('skills')
        .select('*')
        .order('weight', { ascending: false })
        .order('label', { ascending: true }),
      client
        .from('experience')
        .select('*')
        .order('sort_order', { ascending: true })
        .order('title', { ascending: true }),
      client
        .from('tracks')
        .select('*')
        .order('sort_order', { ascending: true })
        .order('title', { ascending: true }),
    ]);

  return {
    experience: (experienceResult.data || []).map(mapExperience),
    siteSettings:
      mapSiteSettings(settingsResult.data) || clone(fallbackState.siteSettings),
    skills: (skillsResult.data || []).map(mapSkill),
    tracks: (tracksResult.data || []).map(mapTrack),
    works: (worksResult.data || []).map(mapWork),
  };
}

async function getRemoteReviews() {
  const client = await getRemoteClient();

  if (!client) {
    return null;
  }

  const { data, error } = await client
    .from('reviews')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    return null;
  }

  return (data || []).map(mapReview);
}

async function getRemoteStats() {
  const client = await getRemoteClient();

  if (!client) {
    return null;
  }

  const [sessionsResult, eventsResult, reviewsResult, settingsResult] = await Promise.all([
    client.from('analytics_sessions').select('*'),
    client.from('analytics_events').select('*'),
    client.from('reviews').select('id'),
    client.from('site_settings').select('last_updated').eq('id', 1).maybeSingle(),
  ]);

  const sessions = sessionsResult.data || [];
  const acceptedSessions = sessions.filter((session) => session.consent_state === 'accepted');
  const events = eventsResult.data || [];

  const topRoutes = events
    .filter((event) => event.event_type === 'route_view')
    .reduce((accumulator, route) => {
      const existing = accumulator.find((item) => item.path === route.path);

      if (existing) {
        existing.views += 1;
        existing.duration_ms += Number(route.duration_ms || 0);
      } else {
        accumulator.push({
          duration_ms: Number(route.duration_ms || 0),
          path: route.path,
          views: 1,
        });
      }

      return accumulator;
    }, [])
    .sort((left, right) => right.views - left.views || right.duration_ms - left.duration_ms)
    .slice(0, 8);

  const eventCounts = events.reduce((accumulator, event) => {
    const key = event.event_type;
    const existing = accumulator.find((item) => item.event_type === key);

    if (existing) {
      existing.count += 1;
    } else {
      accumulator.push({ count: 1, event_type: key });
    }

    return accumulator;
  }, []);

  const workViews = events
    .filter((event) => event.event_type === 'work_view')
    .reduce((accumulator, event) => {
      const existing = accumulator.find((item) => item.path === event.path);

      if (existing) {
        existing.views += 1;
      } else {
        accumulator.push({ path: event.path, views: 1 });
      }

      return accumulator;
    }, [])
    .slice(0, 6);

  const consentBreakdown = sessions.reduce((accumulator, session) => {
    const existing = accumulator.find((item) => item.consent_state === session.consent_state);

    if (existing) {
      existing.count += 1;
    } else {
      accumulator.push({ consent_state: session.consent_state, count: 1 });
    }

    return accumulator;
  }, []);

  return {
    averageStaySeconds: Math.round(
      acceptedSessions.length
        ? acceptedSessions.reduce((sum, session) => sum + Number(session.total_duration_ms || 0), 0) /
            acceptedSessions.length /
            1000
        : 0,
    ),
    averageViewsPerSession: Number(
      (
        acceptedSessions.length
          ? acceptedSessions.reduce((sum, session) => sum + Number(session.page_views || 0), 0) /
            acceptedSessions.length
          : 0
      ).toFixed(1),
    ),
    consentBreakdown,
    eventCounts,
    lastUpdated: settingsResult.data?.last_updated || fallbackState.siteSettings.lastUpdated,
    reviewCount: reviewsResult.data?.length || 0,
    topRoutes,
    uniqueRoutes: topRoutes.length,
    visits: acceptedSessions.length,
    workViews,
  };
}

export async function getContentBundle() {
  if (!hasSupabaseConfig) {
    return getLocalContent();
  }

  const content = await getRemoteContent();
  return content || getLocalContent();
}

export async function getReviews() {
  if (!hasSupabaseConfig) {
    return getLocalReviews();
  }

  const reviews = await getRemoteReviews();
  return reviews || getLocalReviews();
}

export async function getStats() {
  if (!hasSupabaseConfig) {
    return getLocalStats();
  }

  const stats = await getRemoteStats();
  return stats || getLocalStats();
}

export async function getWorkBySlug(slug) {
  const { works } = await getContentBundle();
  return works.find((work) => work.slug === slug) || null;
}

export async function getTrackById(id) {
  const { tracks } = await getContentBundle();
  return tracks.find((track) => track.id === id) || null;
}

export async function saveSiteSettings(input) {
  if (!hasSupabaseConfig) {
    fallbackState.siteSettings = {
      ...fallbackState.siteSettings,
      ...input,
      lastUpdated: new Date().toISOString().slice(0, 10),
    };
    return mapSiteSettings({
      ...fallbackState.siteSettings,
      default_track_id: fallbackState.siteSettings.defaultTrackId,
      hero_cta: fallbackState.siteSettings.heroCta,
      last_updated: fallbackState.siteSettings.lastUpdated,
      youtube_url: fallbackState.siteSettings.youtubeLink,
    });
  }

  const client = await getRemoteClient();

  if (!client) {
    throw new Error('Supabase is not configured.');
  }

  const payload = {
    bio: String(input.bio || '').trim(),
    default_track_id: input.defaultTrackId || null,
    email: String(input.email || '').trim(),
    github: String(input.github || '').trim(),
    hero_cta: String(input.heroCta || '').trim() || 'Enter the atmosphere',
    last_updated: new Date().toISOString().slice(0, 10),
    location: String(input.location || '').trim(),
    name: String(input.name || '').trim(),
    tagline: String(input.tagline || '').trim(),
    youtube_url: String(input.youtubeLink || '').trim(),
  };

  const { error } = await client.from('site_settings').upsert(
    {
      ...payload,
      id: 1,
    },
    { onConflict: 'id' },
  );

  if (error) {
    throw new Error(error.message || 'Failed to save site settings.');
  }

  return mapSiteSettings({
    ...payload,
    id: 1,
  });
}

export async function listWorks() {
  const { works } = await getContentBundle();
  return works;
}

export async function saveWork(input) {
  const work = {
    body: String(input.body || '').trim(),
    cover_url: String(input.coverUrl || input.cover_url || '').trim(),
    external_url: String(input.externalUrl || input.external_url || '').trim(),
    featured: Boolean(input.featured),
    gallery_urls: Array.isArray(input.galleryUrls)
      ? input.galleryUrls.filter(Boolean)
      : safeParse(input.gallery_urls, []),
    id: input.id || createLocalId('work'),
    published: input.published === false ? 0 : 1,
    repo_url: String(input.repoUrl || input.repo_url || '').trim(),
    slug: normalizeSlug(input.slug || input.title, input.title),
    sort_order: Number(input.sortOrder ?? input.sort_order ?? 0),
    summary: String(input.summary || '').trim(),
    tags: Array.isArray(input.tags) ? input.tags.filter(Boolean) : safeParse(input.tags, []),
    title: String(input.title || '').trim(),
    type: input.type === 'art' ? 'art' : 'project',
  };

  if (!hasSupabaseConfig) {
    const nextWork = mapWork(work);
    const existingIndex = fallbackState.works.findIndex((item) => item.id === nextWork.id);

    if (existingIndex >= 0) {
      fallbackState.works[existingIndex] = nextWork;
    } else {
      fallbackState.works.push(nextWork);
    }

    return nextWork;
  }

  const client = await getRemoteClient();

  if (!client) {
    throw new Error('Supabase is not configured.');
  }

  const { error } = await client.from('works').upsert(work, { onConflict: 'id' });

  if (error) {
    throw new Error(error.message || 'Failed to save work.');
  }

  return mapWork(work);
}

export async function deleteWork(id) {
  if (!hasSupabaseConfig) {
    fallbackState.works = fallbackState.works.filter((item) => item.id !== id);
    return true;
  }

  const client = await getRemoteClient();
  if (!client) {
    throw new Error('Supabase is not configured.');
  }

  const { error } = await client.from('works').delete().eq('id', id);
  if (error) {
    throw new Error(error.message || 'Failed to delete work.');
  }

  return true;
}

export async function listSkills() {
  const { skills } = await getContentBundle();
  return skills;
}

export async function saveSkill(input) {
  const skill = {
    category: String(input.category || 'Core').trim() || 'Core',
    icon_url: String(input.iconUrl || input.icon_url || '').trim(),
    id: input.id || createLocalId('skill'),
    label: String(input.label || '').trim(),
    weight: Math.max(0, Math.min(100, Number(input.weight || 0))),
  };

  if (!hasSupabaseConfig) {
    const nextSkill = mapSkill(skill);
    const existingIndex = fallbackState.skills.findIndex((item) => item.id === nextSkill.id);

    if (existingIndex >= 0) {
      fallbackState.skills[existingIndex] = nextSkill;
    } else {
      fallbackState.skills.push(nextSkill);
    }

    return nextSkill;
  }

  const client = await getRemoteClient();
  if (!client) {
    throw new Error('Supabase is not configured.');
  }

  const { error } = await client.from('skills').upsert(skill, { onConflict: 'id' });
  if (error) {
    throw new Error(error.message || 'Failed to save skill.');
  }

  return mapSkill(skill);
}

export async function deleteSkill(id) {
  if (!hasSupabaseConfig) {
    fallbackState.skills = fallbackState.skills.filter((item) => item.id !== id);
    return true;
  }

  const client = await getRemoteClient();
  if (!client) {
    throw new Error('Supabase is not configured.');
  }

  const { error } = await client.from('skills').delete().eq('id', id);
  if (error) {
    throw new Error(error.message || 'Failed to delete skill.');
  }

  return true;
}

export async function listExperience() {
  const { experience } = await getContentBundle();
  return experience;
}

export async function saveExperience(input) {
  const experience = {
    description: String(input.description || '').trim(),
    id: input.id || createLocalId('exp'),
    organization: String(input.organization || '').trim(),
    period: String(input.period || '').trim(),
    sort_order: Number(input.sortOrder ?? input.sort_order ?? 0),
    title: String(input.title || '').trim(),
    type: String(input.type || 'experience').trim() || 'experience',
  };

  if (!hasSupabaseConfig) {
    const nextExperience = mapExperience(experience);
    const existingIndex = fallbackState.experience.findIndex((item) => item.id === nextExperience.id);

    if (existingIndex >= 0) {
      fallbackState.experience[existingIndex] = nextExperience;
    } else {
      fallbackState.experience.push(nextExperience);
    }

    return nextExperience;
  }

  const client = await getRemoteClient();
  if (!client) {
    throw new Error('Supabase is not configured.');
  }

  const { error } = await client.from('experience').upsert(experience, { onConflict: 'id' });
  if (error) {
    throw new Error(error.message || 'Failed to save experience entry.');
  }

  return mapExperience(experience);
}

export async function deleteExperience(id) {
  if (!hasSupabaseConfig) {
    fallbackState.experience = fallbackState.experience.filter((item) => item.id !== id);
    return true;
  }

  const client = await getRemoteClient();
  if (!client) {
    throw new Error('Supabase is not configured.');
  }

  const { error } = await client.from('experience').delete().eq('id', id);
  if (error) {
    throw new Error(error.message || 'Failed to delete experience entry.');
  }

  return true;
}

export async function listTracks() {
  const { tracks } = await getContentBundle();
  return tracks;
}

export async function saveTrack(input) {
  const track = {
    accent_color: String(input.accentColor || input.accent_color || '').trim(),
    artist: String(input.artist || '').trim(),
    artwork_url: String(input.artworkUrl || input.artwork_url || '').trim(),
    id: input.id || createLocalId('track'),
    published: input.published === false ? 0 : 1,
    sort_order: Number(input.sortOrder ?? input.sort_order ?? 0),
    title: String(input.title || '').trim(),
    youtube_url: String(input.youtubeUrl || input.youtube_url || '').trim(),
  };

  if (!hasSupabaseConfig) {
    const nextTrack = mapTrack(track);
    const existingIndex = fallbackState.tracks.findIndex((item) => item.id === nextTrack.id);

    if (existingIndex >= 0) {
      fallbackState.tracks[existingIndex] = nextTrack;
    } else {
      fallbackState.tracks.push(nextTrack);
    }

    if (!fallbackState.siteSettings.defaultTrackId && nextTrack.published) {
      fallbackState.siteSettings.defaultTrackId = nextTrack.id;
    }

    return nextTrack;
  }

  const client = await getRemoteClient();
  if (!client) {
    throw new Error('Supabase is not configured.');
  }

  const { error } = await client.from('tracks').upsert(track, { onConflict: 'id' });
  if (error) {
    throw new Error(error.message || 'Failed to save track.');
  }

  return mapTrack(track);
}

export async function deleteTrack(id) {
  if (!hasSupabaseConfig) {
    fallbackState.tracks = fallbackState.tracks.filter((item) => item.id !== id);

    if (fallbackState.siteSettings.defaultTrackId === id) {
      fallbackState.siteSettings.defaultTrackId = fallbackState.tracks.find(
        (track) => track.published,
      )?.id || '';
    }

    return true;
  }

  const client = await getRemoteClient();
  if (!client) {
    throw new Error('Supabase is not configured.');
  }

  const { error } = await client.from('tracks').delete().eq('id', id);
  if (error) {
    throw new Error(error.message || 'Failed to delete track.');
  }

  return true;
}

export async function addReview({ email, message, name }) {
  const review = {
    created_at: new Date().toISOString(),
    email: String(email || '').trim(),
    id: randomUUID(),
    message: String(message || '').trim(),
    name: String(name || 'Anonymous').trim() || 'Anonymous',
  };

  if (!hasSupabaseConfig) {
    const exists = fallbackState.reviews.some(
      (entry) => entry.email.toLowerCase() === review.email.toLowerCase(),
    );

    if (exists) {
      throw new Error('A review from this email already exists.');
    }

    fallbackState.reviews.unshift(mapReview(review));
    return mapReview(review);
  }

  const client = await getRemoteClient();
  if (!client) {
    throw new Error('Supabase is not configured.');
  }

  const { error } = await client.from('reviews').insert(review);
  if (error) {
    throw new Error(error.message || 'Failed to create review.');
  }

  return mapReview(review);
}

export async function hasReviewForEmail(email) {
  if (!hasSupabaseConfig) {
    return fallbackState.reviews.some(
      (review) => review.email.toLowerCase() === String(email || '').trim().toLowerCase(),
    );
  }

  const client = await getRemoteClient();
  if (!client) {
    return false;
  }

  const { data, error } = await client
    .from('reviews')
    .select('id')
    .ilike('email', String(email || '').trim())
    .limit(1);

  if (error) {
    return false;
  }

  return Boolean(data?.length);
}

export async function deleteReview(id) {
  if (!hasSupabaseConfig) {
    fallbackState.reviews = fallbackState.reviews.filter((review) => review.id !== id);
    return true;
  }

  const client = await getRemoteClient();
  if (!client) {
    throw new Error('Supabase is not configured.');
  }

  const { error } = await client.from('reviews').delete().eq('id', id);
  if (error) {
    throw new Error(error.message || 'Failed to delete review.');
  }

  return true;
}

export async function recordAnalyticsSession({
  action = 'heartbeat',
  consentState = 'accepted',
  currentPath = '/',
  durationMs = 0,
  pageViews = 0,
  routes = [],
  sessionId,
  userAgent = '',
}) {
  if (!hasSupabaseConfig) {
    const timestamp = new Date().toISOString();
    const existingIndex = fallbackState.analytics.sessions.findIndex(
      (session) => session.sessionId === sessionId,
    );
    const nextSession = {
      consentState,
      currentPath,
      durationMs,
      entryAt: timestamp,
      eventCount: 0,
      lastSeenAt: timestamp,
      pageViews,
      routes: [...new Set(routes.filter(Boolean))],
      sessionId,
      userAgent,
    };

    if (existingIndex >= 0) {
      fallbackState.analytics.sessions[existingIndex] = {
        ...fallbackState.analytics.sessions[existingIndex],
        ...nextSession,
      };
    } else {
      fallbackState.analytics.sessions.push(nextSession);
    }

    fallbackState.analytics.routes = fallbackState.analytics.routes.filter(
      (route) => route.sessionId !== sessionId || route.path !== currentPath,
    );
    fallbackState.analytics.routes.push({
      durationMs,
      lastSeenAt: timestamp,
      path: currentPath,
      sessionId,
      views: pageViews,
    });

    if (action === 'end') {
      const currentSession = fallbackState.analytics.sessions.find(
        (session) => session.sessionId === sessionId,
      );

      if (currentSession) {
        currentSession.durationMs = Math.max(currentSession.durationMs, durationMs);
      }
    }

    return true;
  }

  const client = await getRemoteClient();
  if (!client) {
    throw new Error('Supabase is not configured.');
  }

  const timestamp = new Date().toISOString();

  if (action === 'end') {
    const { error } = await client
      .from('analytics_sessions')
      .update({
        exit_at: timestamp,
        last_seen_at: timestamp,
        total_duration_ms: durationMs,
      })
      .eq('session_id', sessionId);

    if (error) {
      throw new Error(error.message || 'Failed to close analytics session.');
    }

    return true;
  }

  const payload = {
    consent_state: consentState,
    current_path: currentPath,
    entry_at: timestamp,
    last_seen_at: timestamp,
    page_views: Number(pageViews || 0),
    routes_json: JSON.stringify([...new Set(routes.filter(Boolean))]),
    session_id: sessionId,
    total_duration_ms: Number(durationMs || 0),
    user_agent: userAgent,
  };

  const { error } = await client.from('analytics_sessions').upsert(payload, {
    onConflict: 'session_id',
  });

  if (error) {
    throw new Error(error.message || 'Failed to persist analytics session.');
  }

  return true;
}

export async function recordAnalyticsEvent({
  durationMs = 0,
  eventType = 'interaction',
  currentPath = '/',
  payload = {},
  sessionId = 'anonymous',
}) {
  if (!hasSupabaseConfig) {
    fallbackState.analytics.events.push({
      createdAt: new Date().toISOString(),
      durationMs,
      eventType,
      path: currentPath,
      payload,
      sessionId,
    });
    return true;
  }

  const client = await getRemoteClient();
  if (!client) {
    throw new Error('Supabase is not configured.');
  }

  const { error } = await client.from('analytics_events').insert({
    created_at: new Date().toISOString(),
    duration_ms: Number(durationMs || 0),
    event_type: eventType,
    path: currentPath,
    payload_json: JSON.stringify(payload || {}),
    session_id: sessionId,
  });

  if (error) {
    throw new Error(error.message || 'Failed to persist analytics event.');
  }

  return true;
}

export async function closeAnalyticsSession({ durationMs = 0, sessionId }) {
  return recordAnalyticsSession({
    action: 'end',
    currentPath: '/',
    durationMs,
    sessionId,
  });
}

export async function ensureLocalDefaultTrack() {
  if (!fallbackState.siteSettings.defaultTrackId && fallbackState.tracks.length) {
    fallbackState.siteSettings.defaultTrackId = fallbackState.tracks[0].id;
  }
}
