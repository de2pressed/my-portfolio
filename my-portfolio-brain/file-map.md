# File Map

## Top Level Files

- `app/layout.tsx` - root layout, metadata, fonts, and global providers
- `app/page.tsx` - public homepage route
- `app/admin/page.tsx` - redirect to admin login
- `app/login/page.tsx` - redirect to admin login
- `next.config.mjs` - Next.js config and remote image patterns
- `package.json` - scripts and dependencies
- `README.md` in this folder - entry point for the AI handoff docs
- `release-notes-v1.0.3.md` - latest handoff note for CHANGELOG-4 and the v1.0.3 bump

## App Router

- `app/admin/login/page.tsx` - admin login page
- `app/admin/panel/page.tsx` - protected admin panel
- `app/api/admin/login/route.ts` - create session cookie
- `app/api/admin/logout/route.ts` - clear session cookie
- `app/api/content/route.ts` - content CRUD and settings reads
- `app/api/reviews/route.ts` - review submission and moderation
- `app/api/analytics/route.ts` - analytics write and summary

## Context Layer

- `context/CookieContext.tsx` - consent and analytics opt-in
- `context/MusicContext.tsx` - playback state, track metadata, controls, and first-play queuing
- `context/ThemeContext.tsx` - palette extraction, near-black canvas defaults, and CSS variable updates

## Layout And Shell

- `components/layout/AppProviders.tsx` - provider composition
- `components/layout/ExperienceShell.tsx` - loading, consent, first-gesture playback, reveal, and shell orchestration
- `components/layout/Header.tsx` - public site header
- `components/layout/Footer.tsx` - footer takeover and music-driven end of page
- `components/layout/PageTransition.tsx` - page motion wrapper

## UI And Loading

- `components/loading/LoadingScreen.tsx` - initial loading surface and handoff animation
- `components/loading/CookieConsent.tsx` - consent overlay and reveal animation that also serves as a playback gesture
- `components/ui/GlassCursor.tsx` - smaller custom pointer treatment for fine pointer devices
- `components/ui/VersionBadge.tsx` - displayed version marker

## Hooks

- `hooks/useResolvedYouTubeThumbnail.ts` - client-side thumbnail resolution with quality fallback

## Music System

- `components/music/YouTubeEngine.tsx` - boots the YouTube IFrame API, uses muted autoplay, syncs metadata, and registers controls
- `components/music/MusicPlayer.tsx` - floating playback widget with seek, volume, and minimize mode

## Public Sections

- `components/sections/PublicHome.tsx` - data assembly and section composition
- `components/sections/Hero.tsx` - hero block
- `components/sections/About.tsx` - about block
- `components/sections/Skills.tsx` - skill list
- `components/sections/Experience.tsx` - timeline
- `components/sections/Projects.tsx` - project cards
- `components/sections/Reviews.tsx` - guestbook and submission form

## Admin UI

- `components/admin/AdminLoginForm.tsx` - login form
- `components/admin/AdminPanel.tsx` - admin dashboard layout
- `components/admin/ContentEditor.tsx` - site content editing
- `components/admin/CollectionManager.tsx` - generic collection CRUD UI
- `components/admin/ReviewManager.tsx` - moderation controls
- `components/admin/MusicLinkEditor.tsx` - music URL and version settings
- `components/admin/AnalyticsDashboard.tsx` - analytics summary

## Data And Utilities

- `lib/content-repository.ts` - main data access layer
- `lib/fallback-store.ts` - in-memory fallback store
- `lib/seed-data.ts` - seeded local data
- `lib/types.ts` - shared types
- `lib/admin-session.ts` - session cookie encode/decode
- `lib/utils.ts` - helpers
- `lib/youtube.ts` - YouTube URL parsing and thumbnail lookup
- `lib/colorExtractor.ts` - palette extraction
- `lib/supabase/server.ts` - server Supabase clients
- `lib/supabase/client.ts` - browser Supabase client

## Styling

- `styles/design-tokens.css` - CSS variables and token definitions for the near-black glass theme
- `styles/globals.css` - base styles, glass UI classes, selection accents, and global behavior

## Supabase

- `supabase/migrations/0001_portfolio_init.sql` - canonical schema and policies
- `supabase/seed.sql` - seed data for Supabase
