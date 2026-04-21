# My Portfolio Brain

> Source of truth for the portfolio rewrite.
>
> Current display version: `ver 1.02`

## Purpose

This project is a premium, music-reactive portfolio for Jayant Kumar. The current implementation is a Next.js App Router app optimized for Vercel and backed by Supabase.

The public site must stay immersive, readable, and editable. The music player is YouTube-first, the loader is full-screen and frosted, and the footer player should feel stitched into the page rather than floating above it.

## Current Stack

- `Next.js` App Router
- `Supabase` for content, auth, analytics, and reviews
- `YouTube IFrame API` as the only playback source
- `GSAP` for page motion and reveal effects
- `CSS Modules` plus shared design tokens
- `Vercel` as the deployment target

## Route Map

- `/` public landing page
- `/works/[slug]` work detail page
- `/admin-login` hidden admin entry
- `/admin` protected dashboard

The hidden `de2pressed` keyboard trigger only reveals the login surface. It is not authentication.

## Data Model

Supabase tables:

- `site_settings`
- `works`
- `skills`
- `experience`
- `tracks`
- `reviews`
- `analytics_sessions`
- `analytics_events`

Notes:

- Content is edited from the admin dashboard and persisted through server-side route handlers.
- Public pages read the current content bundle and re-render through the Next app shell.
- Analytics is consent-gated and stored in Supabase only after acceptance.
- Reviews are email-gated and deduplicated by email.

## Music Rules

- YouTube is the only playback source at runtime.
- Track records use `youtubeUrl` as the source of truth.
- The player background and ambient shell colors are driven by the current thumbnail.
- The footer player should dock into the footer on scroll and feel like part of the layout.

## Visual Rules

- The public site uses a dark, premium glass aesthetic with skeuomorphic controls.
- Buttons, sliders, and docked player controls should feel tactile and physical.
- Typography and button scaling must remain responsive across desktop and mobile.
- The loading screen is full-screen, frosted, and should show explicit status text.
- The version badge lives in the bottom-left corner and increments by `0.01` per changelog.

## Security Rules

- Admin access must be protected with Supabase Auth and server-side session checks.
- No browser-shared admin secret.
- No client-side Vite/Express runtime path.
- No direct audio file playback path.

## Deployment Rules

- Deploy on Vercel.
- Store secrets in environment variables only.
- Use Supabase migrations and seed scripts for database setup.
- Keep remote image allowlists current for YouTube thumbnails and any seeded artwork.

## Operational Notes

- Keep `README.md` in sync with the current setup steps.
- Keep `codex-prompts/00_INIT.md` aligned with this brain file.
- Bump `src/lib/version.js` by `0.01` for each new changelog entry.

