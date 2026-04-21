# INIT - My Portfolio

## Current Baseline

This repository now uses:

- `Next.js` App Router
- `Supabase` for content, auth, analytics, and reviews
- `YouTube IFrame API` for music playback
- `Vercel` for deployment

Do not reintroduce the old Vite, Express, SQLite, or React Router runtime path.

## Core Rules

- Keep `youtubeUrl` as the source of truth for tracks.
- Keep the admin surface hidden behind the `de2pressed` trigger and Supabase auth.
- Keep the player docked into the footer on scroll.
- Keep the loader full-screen, frosted, and status-driven.
- Keep the version badge in the bottom-left corner and increment it by `0.01` per changelog.
- Keep public reads cached through the Next app shell and admin writes server-side.

## Setup Targets

- Local development: `npm run dev`
- Production build: `npm run build`
- Lint: `npm run lint`
- Supabase schema: `supabase/migrations/0001_init.sql`
- Seed data: `supabase/seed.sql`
- Environment variables: see `README.md` and `.env.example`

## Key Files

- `README.md`
- `my-portfolio-brain/00_PROJECT_BRAIN.md`
- `src/lib/version.js`
- `src/app/layout.jsx`
- `src/components/layout/AppShell.jsx`
- `src/components/layout/MusicPlayer.jsx`
- `src/components/gateway/LoadingScreen.jsx`
- `src/lib/content-store.js`

