# Release Notes v1.0.3

This note records the work completed from `CHANGELOG-4.md` and the version bump from `v1.0.2` to `v1.0.3`.

## Summary

This release closes the remaining runtime gaps from the changelog audit and pushes the site toward a darker, violet-black premium glass surface.

## Implemented Changes

- Added looping playback for single-video music sources when the YouTube player reaches `ENDED`.
- Raised the custom cursor above the loading and consent overlays and redesigned it as a high-contrast pointer arrow.
- Kept the minimized music player in a square card form instead of an oval pill.
- Lowered glass opacity across shared tokens and key surfaces so the background shows through more clearly in the dark theme.
- Shifted the ambient mood toward a deeper magenta-violet glow so the page reads closer to the intended dark-mode reference.
- Fixed the theme context so extracted palettes no longer force a warm canvas and dark text; the page now keeps a dark background with light text while still using the palette for accents.
- Styled text selection to use the theme accent instead of the browser default blue.
- Increased ambient background density with more particles, smaller fast movers, and more varied orbital paths.
- Removed redundant chip labels and implementation-flavored copy from the loading, cookie, and footer surfaces.
- Tuned public and admin-facing glass surfaces so they feel darker, lighter, and more consistent with the new theme.
- Bumped the site version to `v1.0.3`.

## Follow-Up Fixes

- Tightened the root canvas and ambient fill to an almost-black base so the page no longer reads as grey-washed.
- Reduced the custom cursor size so it matches the reference screenshots more closely.
- Increased selection contrast so drag-selected text is clearly visible in the dark theme.
- Guarded music URL refreshes so the current soundtrack title is not overwritten by an unchanged settings response.
- Triggered playback from the cookie decision action so the first accepted visit can start audio without requiring a reload.
- Set the floating music player to start minimized by default while still honoring saved user preference.
- Added an autoplay retry path so the hidden YouTube player keeps trying until first-load playback actually starts.
- Hardened the player `onReady` path so metadata and mute failures do not abort control registration, and the player now falls back to a non-loading title when YouTube metadata is unavailable.
- Spread the ambient background across edges and corners so the whole viewport feels populated instead of center-heavy.
- Boosted the ambient particle palette so the canvas colors hold closer to the thumbnail's saturation and read less washed out in motion.
- Normalized the remaining admin panel form and error text to the light ink palette so dark browser defaults do not leak through.

## Changelog-5 Execution

- Fixed YouTube playlist parsing so playlist URLs no longer pass a conflicting `videoId` into the initial player boot.
- Hardened the music bootstrap path so autoplay recovery restores audio before the first explicit play gesture and the loading title only clears when real metadata exists.
- Added a same-origin YouTube thumbnail proxy and tightened palette extraction so the ambient colors track the actual thumbnail instead of collapsing into dark swatches.
- Increased ambient blob opacity and reduced blur more aggressively so the background reads brighter and more vibrant during playback.
- Reworked the floating player to footer takeover into a single choreographed motion, with a later fade window for the player and a spring-like arrival for the footer card.
- Added a fine-pointer cursor trail, a header scroll progress ring, a minimized-player waveform ring, hero parallax depth, and palette-reactive review card glow.

## Files To Know

- `components/music/YouTubeEngine.tsx`
- `components/ui/GlassCursor.tsx`
- `components/music/MusicPlayer.tsx`
- `components/background/AmbientBackground.tsx`
- `components/layout/Header.tsx`
- `components/layout/Footer.tsx`
- `components/sections/Hero.tsx`
- `components/sections/Reviews.tsx`
- `hooks/useMusicFrequency.ts`
- `lib/colorExtractor.ts`
- `lib/youtube.ts`
- `app/api/youtube-thumbnail/route.ts`
- `styles/design-tokens.css`
- `styles/globals.css`
- `components/loading/LoadingScreen.tsx`
- `components/loading/CookieConsent.tsx`
- `components/sections/About.tsx`
- `components/admin/AdminLoginForm.tsx`
- `components/admin/MusicLinkEditor.tsx`

## Continuation Rule

If you continue from here, read this note first, then update the brain docs whenever you touch the music loop, cursor, glass tokens, background canvas, loading flow, or any versioned site setting.
