# Release Notes v1.0.1

This note records the work completed from `CHANGELOG-2.md` and the version bump from `v1.0.0` to `v1.0.1`.

## Summary

The release improves the public experience, admin entry point, and shared runtime shell. The biggest changes are the new thumbnail resolution flow, the playback progress bar, the loading-to-cookie handoff animation, and the stronger footer/music integration.

## Implemented Changes

- YouTube thumbnails now resolve through a fallback chain of `maxresdefault`, `sddefault`, then `hqdefault` instead of relying on a single image URL.
- The music player now exposes track progress and seeking.
- The one-time loading-to-cookie transition now has a dedicated handoff animation instead of reusing the plain loading exit.
- The admin login page now has a more intentional wall-like visual treatment.
- The footer music takeover now blends into the footer more smoothly so the player feels like part of the layout instead of a floating widget.
- The ambient background now reacts more strongly to music energy and palette changes.
- The custom cursor now differentiates interactive hover states on anchors, buttons, and role-button elements.
- The header now tracks the active section and highlights the matching nav item.
- The version badge now renders consistently on admin routes once the shell is revealed.

## Runtime Details

- Thumbnail resolution is handled on the client so palette extraction always uses the best available image.
- Music state now includes current time, duration, and seek support so the player and engine stay in sync.
- The loading screen and cookie consent flow now share a handoff state so the transition feels continuous.
- The footer takeover progress is still driven by scroll position, but the music card now animates toward the footer instead of popping out of view.

## Files To Know

- `context/MusicContext.tsx`
- `components/music/YouTubeEngine.tsx`
- `components/music/MusicPlayer.tsx`
- `components/layout/Footer.tsx`
- `components/layout/ExperienceShell.tsx`
- `components/loading/LoadingScreen.tsx`
- `components/loading/CookieConsent.tsx`
- `components/admin/AdminLoginForm.tsx`
- `components/layout/Header.tsx`
- `components/ui/GlassCursor.tsx`
- `components/background/AmbientBackground.tsx`
- `lib/youtube.ts`
- `hooks/useResolvedYouTubeThumbnail.ts`

## Continuation Rule

If you continue from here, read this note first, then update the brain docs whenever you change the public experience, the admin shell, or the music pipeline.
