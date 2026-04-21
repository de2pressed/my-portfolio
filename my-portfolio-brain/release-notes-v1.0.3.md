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

## Files To Know

- `components/music/YouTubeEngine.tsx`
- `components/ui/GlassCursor.tsx`
- `components/music/MusicPlayer.tsx`
- `components/background/AmbientBackground.tsx`
- `styles/design-tokens.css`
- `styles/globals.css`
- `components/loading/LoadingScreen.tsx`
- `components/loading/CookieConsent.tsx`
- `components/layout/Header.tsx`
- `components/layout/Footer.tsx`
- `components/sections/About.tsx`
- `components/sections/Reviews.tsx`
- `components/admin/AdminLoginForm.tsx`
- `components/admin/MusicLinkEditor.tsx`

## Continuation Rule

If you continue from here, read this note first, then update the brain docs whenever you touch the music loop, cursor, glass tokens, background canvas, loading flow, or any versioned site setting.
