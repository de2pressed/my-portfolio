create extension if not exists pgcrypto;

create table if not exists public.site_content (
  id text primary key,
  section text not null unique,
  content jsonb not null,
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.skills (
  id text primary key,
  name text not null,
  category text not null,
  icon text,
  sort_order integer not null default 1,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.experience (
  id text primary key,
  title text not null,
  organization text not null,
  date_range text not null,
  description jsonb not null default '[]'::jsonb,
  link text,
  sort_order integer not null default 1,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.projects (
  id text primary key,
  title text not null,
  description jsonb not null default '[]'::jsonb,
  tech_stack text[] not null default '{}',
  link text,
  image_url text,
  sort_order integer not null default 1,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.reviews (
  id text primary key,
  email text not null,
  display_name text not null,
  message text not null,
  created_at timestamptz not null default timezone('utc', now()),
  is_visible boolean not null default true
);

create table if not exists public.analytics_events (
  id text primary key,
  event_type text not null,
  visitor_id text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.settings (
  id text primary key,
  key text not null unique,
  value text not null,
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.site_content enable row level security;
alter table public.skills enable row level security;
alter table public.experience enable row level security;
alter table public.projects enable row level security;
alter table public.reviews enable row level security;
alter table public.analytics_events enable row level security;
alter table public.settings enable row level security;

create policy "Public can read site content"
on public.site_content
for select
using (true);

create policy "Public can read skills"
on public.skills
for select
using (true);

create policy "Public can read experience"
on public.experience
for select
using (true);

create policy "Public can read projects"
on public.projects
for select
using (true);

create policy "Public can read visible reviews"
on public.reviews
for select
using (is_visible = true);

create policy "Public can insert reviews"
on public.reviews
for insert
with check (true);

create policy "Public can insert analytics events"
on public.analytics_events
for insert
with check (true);

create policy "Public can read settings"
on public.settings
for select
using (true);
