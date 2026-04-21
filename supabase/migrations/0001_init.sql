begin;

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.site_settings (
  id integer primary key default 1,
  name text not null default '',
  tagline text not null default '',
  bio text not null default '',
  email text not null default '',
  location text not null default '',
  github text not null default '',
  hero_cta text not null default 'Enter the atmosphere',
  youtube_url text not null default '',
  default_track_id text default '',
  last_updated date not null default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.works (
  id text primary key,
  slug text not null unique,
  title text not null,
  summary text not null default '',
  body text not null default '',
  type text not null default 'project' check (type in ('project', 'art')),
  cover_url text not null default '',
  external_url text not null default '',
  repo_url text not null default '',
  tags jsonb not null default '[]'::jsonb,
  gallery_urls jsonb not null default '[]'::jsonb,
  featured boolean not null default false,
  published boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.skills (
  id text primary key,
  label text not null,
  category text not null default 'Core',
  icon_url text not null default '',
  weight integer not null default 0 check (weight between 0 and 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.experience (
  id text primary key,
  type text not null default 'experience',
  title text not null,
  organization text not null default '',
  period text not null default '',
  description text not null default '',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tracks (
  id text primary key,
  title text not null,
  artist text not null default '',
  artwork_url text not null default '',
  youtube_url text not null default '',
  accent_color text not null default '',
  published boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.reviews (
  id text primary key,
  name text not null default 'Anonymous',
  email text not null,
  message text not null,
  created_at timestamptz not null default now()
);

create unique index if not exists reviews_email_unique
  on public.reviews (lower(email));

create table if not exists public.analytics_sessions (
  session_id text primary key,
  consent_state text not null default 'accepted',
  current_path text not null default '/',
  entry_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  exit_at timestamptz,
  total_duration_ms integer not null default 0,
  page_views integer not null default 0,
  routes_json jsonb not null default '[]'::jsonb,
  user_agent text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.analytics_events (
  id bigserial primary key,
  session_id text not null,
  event_type text not null,
  path text not null default '/',
  duration_ms integer not null default 0,
  payload_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

do $$
begin
  if not exists (
    select 1
    from pg_trigger
    where tgname = 'site_settings_set_updated_at'
  ) then
    create trigger site_settings_set_updated_at
    before update on public.site_settings
    for each row execute function public.set_updated_at();
  end if;

  if not exists (
    select 1
    from pg_trigger
    where tgname = 'works_set_updated_at'
  ) then
    create trigger works_set_updated_at
    before update on public.works
    for each row execute function public.set_updated_at();
  end if;

  if not exists (
    select 1
    from pg_trigger
    where tgname = 'skills_set_updated_at'
  ) then
    create trigger skills_set_updated_at
    before update on public.skills
    for each row execute function public.set_updated_at();
  end if;

  if not exists (
    select 1
    from pg_trigger
    where tgname = 'experience_set_updated_at'
  ) then
    create trigger experience_set_updated_at
    before update on public.experience
    for each row execute function public.set_updated_at();
  end if;

  if not exists (
    select 1
    from pg_trigger
    where tgname = 'tracks_set_updated_at'
  ) then
    create trigger tracks_set_updated_at
    before update on public.tracks
    for each row execute function public.set_updated_at();
  end if;
end;
$$;

alter table public.site_settings enable row level security;
alter table public.works enable row level security;
alter table public.skills enable row level security;
alter table public.experience enable row level security;
alter table public.tracks enable row level security;
alter table public.reviews enable row level security;
alter table public.analytics_sessions enable row level security;
alter table public.analytics_events enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'site_settings'
      and policyname = 'Public can read site settings'
  ) then
    create policy "Public can read site settings"
    on public.site_settings
    for select
    to anon, authenticated
    using (true);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'works'
      and policyname = 'Public can read works'
  ) then
    create policy "Public can read works"
    on public.works
    for select
    to anon, authenticated
    using (true);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'skills'
      and policyname = 'Public can read skills'
  ) then
    create policy "Public can read skills"
    on public.skills
    for select
    to anon, authenticated
    using (true);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'experience'
      and policyname = 'Public can read experience'
  ) then
    create policy "Public can read experience"
    on public.experience
    for select
    to anon, authenticated
    using (true);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'tracks'
      and policyname = 'Public can read tracks'
  ) then
    create policy "Public can read tracks"
    on public.tracks
    for select
    to anon, authenticated
    using (true);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'reviews'
      and policyname = 'Public can read reviews'
  ) then
    create policy "Public can read reviews"
    on public.reviews
    for select
    to anon, authenticated
    using (true);
  end if;
end;
$$;

commit;
