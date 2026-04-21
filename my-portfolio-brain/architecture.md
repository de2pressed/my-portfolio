# Architecture

## Route Shell

The root layout in `app/layout.tsx` wraps the whole app with:

- `AppProviders`
- `ExperienceShell`

That means every route is rendered inside the same runtime shell unless a route exits early with a redirect.

## Provider Stack

The provider order is:

1. `ThemeProvider`
2. `CookieProvider`
3. `MusicProvider`

This order matters because the music layer reads the theme palette helpers, and the shell reads both cookie and music readiness.

## Runtime Shell

`components/layout/ExperienceShell.tsx` is the orchestration layer for the public experience.

It renders:

- `AmbientBackground`
- `YouTubeEngine`
- `GlassCursor`
- `PageTransition`
- `MusicPlayer`
- `VersionBadge`
- `LoadingScreen`
- `CookieConsent`

It also owns the phase state for:

- loading
- handoff
- cookie
- none

The shell hides content until the site is ready, then reveals the public page. On the public route it can show cookie consent before full reveal.
The loading and consent phases now have a dedicated handoff animation so the transition feels continuous instead of like two separate overlays.

## Music Pipeline

The music stack is split into three layers:

- `context/MusicContext.tsx` stores the playback and UI state.
- `components/music/YouTubeEngine.tsx` boots the YouTube IFrame player and registers player controls.
- `components/music/MusicPlayer.tsx` and `components/layout/Footer.tsx` render the playback UI.
- `hooks/useResolvedYouTubeThumbnail.ts` resolves the best thumbnail candidate on the client.

Important behavior:

- track data is synced from the player
- current volume is stored in state and also mirrored in a ref for the player effect
- autoplay starts muted, then unmutes after the player enters `PLAYING`
- current time, duration, and seek position are part of the shared music state
- the current track thumbnail drives the palette and the music artwork
- the footer takeover grows as the user scrolls toward the footer
- the floating player can collapse into a minimized disc mode and persists that preference in `localStorage`
- if a thumbnail is not available in higher quality, the resolver falls back through `maxresdefault`, `sddefault`, and `hqdefault`

## Theme Pipeline

`context/ThemeContext.tsx` extracts a color palette from the current thumbnail.

The extracted palette is written to CSS custom properties on `document.documentElement`.

Those variables are consumed by:

- `styles/design-tokens.css`
- `styles/globals.css`
- Tailwind theme tokens
- glass UI classes

If extraction fails, the theme falls back to a default palette.
The background canvas also reads the palette and the music visual level so it can amplify the atmosphere when playback energy rises.
The glass system now uses a stronger frosted fill and more visible edge highlight so the surfaces read as real glass instead of a faint blur.

## Interaction Layer

The interaction layer includes:

- `components/layout/Header.tsx` for active section tracking and navigation highlighting
- `components/ui/GlassCursor.tsx` for custom cursor behavior on fine pointers

The header now uses intersection observers to keep the active section highlighted. The cursor changes size and emphasis on interactive targets such as links and buttons.

## Consent And Analytics

`context/CookieContext.tsx` handles cookie consent and analytics opt-in.

Public analytics are only enabled when consent is accepted.

The public page sends:

- session start
- page view
- section scroll
- session end

These events are collected through `app/api/analytics/route.ts`.

## Admin System

The admin UI is split into specialized panels:

- `AdminLoginForm`
- `ContentEditor`
- `CollectionManager`
- `ReviewManager`
- `MusicLinkEditor`
- `AnalyticsDashboard`

The protected admin page is `app/admin/panel/page.tsx`. It checks the session before rendering the admin panel.
The login screen now uses a more deliberate wall-like treatment so the admin entry point reads as a separate control surface.

## Recent Fixes Already In The Code

The current code already contains the important hardening changes:

- `context/MusicContext.tsx` now uses stable callbacks
- `context/ThemeContext.tsx` now uses stable callbacks
- `components/music/YouTubeEngine.tsx` no longer rebuilds on every volume change
- `app/admin/page.tsx` redirects to `/admin/login`
- `app/login/page.tsx` redirects to `/admin/login`
- `app/layout.tsx` includes metadata and preview assets
