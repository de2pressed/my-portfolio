# Jayant Kumar Portfolio

Music-driven personal portfolio built with Next.js App Router, Tailwind CSS, Framer Motion, and Supabase-ready content/auth/storage boundaries.

## Local setup

1. Install dependencies with `npm install`.
2. Fill `C:\Users\jayan\Desktop\My-Portfolio\.env.local` with your Supabase values.
3. Run `npm run dev`.

If Supabase is not configured yet, the app falls back to seeded local preview data and uses the demo admin credentials from `.env.local`.

## Included

- Single-page public portfolio with cinematic loader, cookie gate, glass cursor, ambient background, YouTube music engine, dynamic palette, and footer takeover
- Protected admin login and control panel
- CRUD APIs for site content, skills, experience, projects, reviews, settings, and analytics aggregation
- Supabase migration and seed SQL in `C:\Users\jayan\Desktop\My-Portfolio\supabase`

## Verification

- `npm run build`
- Runtime smoke check for `/` and `/admin/login` over HTTP
