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
The shell also treats consent resolution as the first playback gesture and retries playback once the music engine reports ready so first-load audio does not depend on a manual reload.

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
- the player retries startup a few times on boot so muted autoplay has a chance to settle on the first visit
- playlist sources are loaded without a conflicting constructor `videoId` so YouTube can initialize the queue in order
- the boot path restores audio before the first explicit play gesture when autoplay is still pending
- if a playlist boot fails, the engine falls back to the track's video ID so the player does not get stuck in a hard unavailable state
- if YouTube exposes no playlist queue on first load, the engine explicitly reloads the playlist so next/previous navigation has a real queue to work with
- if the player reports a playlist index of `-1`, the engine resolves the current track from the loaded video ID before deciding whether to advance
- player commands use direct YouTube Player API methods (playVideo, pauseVideo, setVolume, mute, unMute, seekTo, setShuffle) instead of postMessage to avoid origin mismatch errors
- every player command checks that the hidden YouTube iframe is still mounted before touching the widget API
- source changes are pushed through a dedicated load bridge instead of rebuilding the player instance
- the music context forwards volume, seek, and source-load actions to the registered controls so the UI and iframe stay in sync
- polling reads current time and duration through safe helpers so early or stale player reads do not crash the shell
- player creation destroys any existing instance before clearing the hidden host element, and cleanup follows the same order
- current time, duration, and seek position are part of the shared music state
- the current track thumbnail drives the palette and the music artwork
- the music context seeds thumbnail extraction from the raw music URL when the parsed playlist source does not carry a video ID
- the Supabase seed mirrors the default soundtrack URL so a reset does not reintroduce the old radio mix
- the default soundtrack now points at the provided `cxKs2b5lRsA` playlist URL so local fallback and Supabase seed stay in sync
- the floating player applies its blur as a plain style value instead of an animated filter so Framer Motion does not emit invalid negative blur keyframes
- thumbnail extraction now uses a same-origin proxy so the browser can read YouTube pixels and extract palette colors reliably
- the footer and compact player now crop the thumbnail more tightly and avoid a brown wash overlay so the album art reads cleaner
- the footer takeover is now derived from the footer panel entering the viewport instead of whole-page scroll percentage
- the footer renders its own integrated music-zone card, and the floating player only hands off pointer control once that footer card is ready
- the floating player now uses the same reveal threshold as the footer card before dropping pointer control, and the footer card raises above the floating layer during takeover so footer controls do not get intermittently blocked
- the floating player and footer music card now share a softer merge curve with reduced rotation, later fade, and pane-like depth so the handoff feels cleaner
- the floating player and footer card now use a shared pointer-driven tilt helper on fine pointers, so the visible panel rotates in 3D under the cursor instead of relying on static faux-depth alone
- the glass treatment now avoids always-on content blur and uses denser panel fill with lighter sheen overlays so text stays readable while the surface still feels glazed
- the floating player can collapse into a minimized disc mode and persists that preference in `localStorage`
- the minimized disc now carries a waveform ring that responds to the shared music energy level
- if a thumbnail is not available in higher quality, the resolver falls back through `maxresdefault`, `sddefault`, and `hqdefault`

## Theme Pipeline

`context/ThemeContext.tsx` extracts a color palette from the current thumbnail.

The extracted palette is written to CSS custom properties on `document.documentElement`.
The theme context keeps the core canvas dark and the ink light so extracted colors only steer accents, glows, and ambient surfaces.
The latest pass pushes the canvas closer to near-black, removes the grey wash from the ambient layers, and keeps glass surfaces more transparent so the content reads against a cleaner dark field.
The ambient canvas now places glow anchors across the corners and edges too, instead of clustering the motion around the middle.
The ambient particles also use a boosted rendition of the thumbnail palette so their color energy reads closer to the artwork instead of flattening into the dark background.
- palette extraction now quantizes in 8-step buckets for more precise color capture and uses neutral grayscale fallback colors to prevent unwanted red/pink tones
- the ambient canvas uses wider blob opacities and a tighter blur falloff so the motion reads brighter instead of washed out
- ambient background now uses a 5-value moving average on energy calculations and increased smoothing factor (0.05) for buttery smooth transitions
- blob pulse multipliers are reduced (0.6 for large, 0.4 for small) with min/max constraints to prevent excessive scaling
- energy frequency multipliers are reduced (bass: 2.0, mid: 5.0, high: 10.0) for more deliberate, less snappy visual changes
- the review section and cursor now reuse the active accent color so the music palette affects more than just the background

Those variables are consumed by:

- `styles/design-tokens.css`
- `styles/globals.css`
- Tailwind theme tokens
- glass UI classes

If extraction fails, the theme falls back to a default palette.
The background canvas also reads the palette and the music visual level so it can amplify the atmosphere when playback energy rises.
The glass system now uses a darker base, lower-opacity fill, and stronger backdrop blur so the surfaces read as premium glass instead of opaque panels.
Text selection and focus accents are also derived from the active theme accent so browser defaults do not leak through.

## Interaction Layer

The interaction layer includes:

- `components/layout/Header.tsx` for active section tracking and navigation highlighting
- `components/ui/GlassCursor.tsx` for custom cursor behavior on fine pointers

The header now uses intersection observers to keep the active section highlighted. The cursor is a topmost pointer arrow that changes size and emphasis on interactive targets such as links and buttons.
The cursor was recently reduced in size so it feels lighter and closer to the reference treatment.
- the header now includes a scroll progress ring that fills from the top of the page toward the footer
- the cursor now emits a small accent-colored trail on fine pointers, but suppresses the trail while hovering interactive targets
- the cursor movement now uses damped interpolation without spring overshoot so it settles cleanly instead of wiggling at rest
- the hero section applies a lightweight parallax offset so the text column and feature card separate slightly as the page scrolls
- the review cards carry a subtle palette-driven glow pulse that rises with the music energy
- the floating music player and footer card now use a single takeover choreography with a shared scroll ramp instead of independent fades

## Consent And Analytics

`context/CookieContext.tsx` handles cookie consent and analytics opt-in.

Public analytics are only enabled when consent is accepted.

The public page sends:

- session start
- page view
- section scroll
- session end

These events are collected through `app/api/analytics/route.ts`.

The cookie decision handler also serves as the first reliable user gesture for playback. On the first visit, accepting or rejecting the consent sheet now kicks the hidden YouTube player so the soundtrack can start without a page reload.

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
- `components/music/YouTubeEngine.tsx` now loops single-track playback on `ENDED`
- `components/music/YouTubeEngine.tsx` uses direct YouTube API methods instead of postMessage to fix origin mismatch errors
- `components/music/YouTubeEngine.tsx` now guards every control call behind an iframe-mounted check to avoid widget API null `src` errors
- `components/music/YouTubeEngine.tsx` includes safe polling helpers and playlist index recovery
- `context/MusicContext.tsx` forwards volume, seek, and source-load changes to the registered player controls
- `components/ui/GlassCursor.tsx` now sits above overlays and renders as a high-contrast pointer
- `app/admin/page.tsx` redirects to `/admin/login`
- `app/login/page.tsx` redirects to `/admin/login`
- `app/layout.tsx` includes metadata and preview assets
