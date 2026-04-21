begin;

insert into public.site_settings (
  id,
  name,
  tagline,
  bio,
  email,
  location,
  github,
  hero_cta,
  youtube_url,
  default_track_id,
  last_updated
)
values (
  1,
  'Jayant Kumar',
  'DevOps Engineer. Builder. Artist.',
  'DevOps-focused BCA undergraduate building, automating, and deploying at the intersection of engineering and art.',
  'jayantdahiya1204@gmail.com',
  'Gurugram, India',
  'https://github.com/de2pressed',
  'Enter the atmosphere',
  'https://www.youtube.com/watch?v=ZAz3rnLGthg&list=RDZAz3rnLGthg',
  'main-theme',
  '2025-01-01'
)
on conflict (id) do update set
  name = excluded.name,
  tagline = excluded.tagline,
  bio = excluded.bio,
  email = excluded.email,
  location = excluded.location,
  github = excluded.github,
  hero_cta = excluded.hero_cta,
  youtube_url = excluded.youtube_url,
  default_track_id = excluded.default_track_id,
  last_updated = excluded.last_updated,
  updated_at = now();

insert into public.works (
  id,
  slug,
  title,
  summary,
  body,
  type,
  cover_url,
  external_url,
  repo_url,
  tags,
  gallery_urls,
  featured,
  published,
  sort_order
)
values
(
  'zomato-devops',
  'zomato-devops',
  'DevSecOps CI/CD Pipeline - Zomato Clone',
  'End-to-end automated CI/CD pipeline for a Node.js app using Jenkins, Docker, SonarQube, Trivy, OWASP, Prometheus, and Grafana on AWS EC2.',
  'End-to-end automated CI/CD pipeline for a Node.js app using Jenkins, Docker, SonarQube, Trivy, OWASP, Prometheus, and Grafana on AWS EC2.\n\nThis entry is seeded from the portfolio brain and can be edited from the admin dashboard.',
  'project',
  'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80',
  'https://github.com/de2pressed/Zomato-devops-project.git',
  'https://github.com/de2pressed/Zomato-devops-project.git',
  '["DevOps","Docker","Jenkins","AWS","Security"]'::jsonb,
  '["https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80"]'::jsonb,
  true,
  true,
  0
),
(
  'glass-study-01',
  'glass-study-01',
  'Glass Study 01',
  'A seeded art entry to establish the shared works system.',
  'A seeded art entry to establish the shared gallery/archive feel from day one.',
  'art',
  'https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&w=1200&q=80',
  '',
  '',
  '["Glass","Motion","Ambient"]'::jsonb,
  '["https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&w=1200&q=80","https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&w=1200&q=80"]'::jsonb,
  true,
  true,
  99
)
on conflict (id) do update set
  slug = excluded.slug,
  title = excluded.title,
  summary = excluded.summary,
  body = excluded.body,
  type = excluded.type,
  cover_url = excluded.cover_url,
  external_url = excluded.external_url,
  repo_url = excluded.repo_url,
  tags = excluded.tags,
  gallery_urls = excluded.gallery_urls,
  featured = excluded.featured,
  published = excluded.published,
  sort_order = excluded.sort_order,
  updated_at = now();

insert into public.skills (id, label, weight, category, icon_url)
values
  ('docker', 'Docker', 90, 'Core', ''),
  ('jenkins', 'Jenkins', 85, 'Core', ''),
  ('aws', 'AWS EC2', 75, 'Core', ''),
  ('linux', 'Ubuntu Linux', 88, 'Core', ''),
  ('prometheus', 'Prometheus', 78, 'Core', ''),
  ('grafana', 'Grafana', 75, 'Core', ''),
  ('sonarqube', 'SonarQube', 70, 'Core', ''),
  ('git', 'Git / GitHub', 90, 'Core', ''),
  ('javascript', 'JavaScript', 72, 'Core', ''),
  ('bash', 'Bash', 80, 'Core', ''),
  ('nodejs', 'Node.js', 68, 'Core', ''),
  ('java', 'Java 21', 60, 'Core', '')
on conflict (id) do update set
  label = excluded.label,
  weight = excluded.weight,
  category = excluded.category,
  icon_url = excluded.icon_url,
  updated_at = now();

insert into public.experience (id, type, title, organization, period, description, sort_order)
values
  (
    'bca-saitm',
    'education',
    'Bachelor of Computer Applications (BCA)',
    'SAITM Gurugram - Affiliated to MDU',
    '2024 - 2027 (Expected)',
    'Pursuing BCA with hands-on focus on DevOps, cloud infrastructure, and software engineering.',
    0
  )
on conflict (id) do update set
  type = excluded.type,
  title = excluded.title,
  organization = excluded.organization,
  period = excluded.period,
  description = excluded.description,
  sort_order = excluded.sort_order,
  updated_at = now();

insert into public.tracks (
  id,
  title,
  artist,
  artwork_url,
  youtube_url,
  accent_color,
  published,
  sort_order
)
values (
  'main-theme',
  'Main Theme',
  'Portfolio System',
  '',
  'https://www.youtube.com/watch?v=ZAz3rnLGthg&list=RDZAz3rnLGthg',
  '#f5c56a',
  true,
  0
)
on conflict (id) do update set
  title = excluded.title,
  artist = excluded.artist,
  artwork_url = excluded.artwork_url,
  youtube_url = excluded.youtube_url,
  accent_color = excluded.accent_color,
  published = excluded.published,
  sort_order = excluded.sort_order,
  updated_at = now();

commit;
