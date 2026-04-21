# CHANGELOG-5 — Music System Repairs, Ambient Reactivity, Playlist Fix, Footer Choreography & Five Feature Additions

> **Author:** Antigravity audit — fifth pass
> **Date:** 2025-04-21
> **Target:** Codex
> **Scope:** Five requested repairs + five curated new feature additions
> **Codebase version inspected:** v1.0.3
> **Brain docs read:** project-overview.md, architecture.md, data-model.md, routes-and-flows.md, file-map.md, working-guide.md

---

## Pre-flight: Current State Summary

Before the issue list, here is what the codebase inspection confirmed about the live state of the music system at v1.0.3. This context is important — it explains why each issue is happening, not just what is broken.

The `YouTubeEngine` boots the player with `autoplay: 1`, then immediately mutes it and calls `player.mute()` and `player.setVolume(0)` inside `onReady`. The intent is to satisfy browser autoplay policy by starting muted, then restoring audio when `PLAYING` fires. The problem is that `startPlayback` retries `player.playVideo()` up to six times at 220ms intervals, but on many browsers (especially Chromium on first visit), even muted autoplay is blocked until a genuine user gesture occurs. The retry loop exhausts without the player ever entering `PLAYING`, so `autoplayUnmutePendingRef` stays `true` forever, the audio is never restored, and the title remains `"Loading soundtrack..."` because `readCurrentTrack` returns a playlist title placeholder when `getVideoData()` returns an empty object before actual playback begins.

The `AmbientBackground` canvas reads `visualLevel` through a ref (`visualLevelRef`) that is updated by a `useEffect`, but the canvas `draw` loop was started in a separate `useEffect` with an **empty dependency array**. This means the draw loop captures the initial palette and visual level from mount time and never re-reads them. The refs are updated, but the loop reads `visualLevelRef.current` and `paletteRef.current` on each frame, so in principle this should work — however, the `boostCanvasColor` and `vibrantPalette` computations inside `draw` map over `paletteRef.current` on each frame call, which is correct. The real palette reactivity issue is that `extractPaletteFromImage` in `colorExtractor.ts` uses a 32-unit quantization bucket that collapses most YouTube thumbnail colors into near-black or near-grey buckets when the thumbnail is dark (which most music thumbnails are). The resulting palette passed to `AmbientBackground` ends up being `["#000000", "#202020", "#000000", "#000000", "#000000"]` instead of the vivid extracted hues, so the canvas blobs become invisible against the dark background.

The playlist URL `https://www.youtube.com/watch?v=ZAz3rnLGthg&list=RDZAz3rnLGthg` is parsed by `parseYouTubeSource`, which correctly extracts both `videoId: "ZAz3rnLGthg"` and `playlistId: "RDZAz3rnLGthg"`. The `YouTubeEngine` passes both `list` and `videoId` to the `playerVars`, which causes the YouTube IFrame API to immediately cue the specific video before the playlist is loaded. When a `videoId` is specified alongside a `list`, YouTube's IFrame API prioritizes the video and ignores the playlist order — the player plays just that one video and the `nextVideo()` / `playVideoAt()` calls have no playlist state to operate against. The fix is architectural: when a `playlistId` is present, `videoId` must not be passed to `playerVars`, so the API loads the full playlist from its first entry.

The footer takeover animation currently animates the floating `MusicPlayer` downward and fades it out, while independently fading the footer music card in. These two motions are unrelated — one goes down and disappears, the other appears from below, and there is no spatial connection between them. The issue is both in the easing curves and in the fact that the player's `y` translation (`footerTakeover * 320`) pushes the widget far below the viewport, not toward the footer's position on the page.

---

## Issue 1 — Music Player Controls Non-Functional, Name Stuck on "Loading soundtrack...", No Autoplay

### Files

`components/music/YouTubeEngine.tsx`, `components/layout/ExperienceShell.tsx`, `context/MusicContext.tsx`

### Root Cause Analysis

There are three compounding problems that together make the music system appear dead on first load.

**Problem A — Autoplay blocked before user gesture, retry loop has no fallback unmute.**
The engine starts the player muted, calls `startPlayback` (which retries `playVideo()` six times), and sets `autoplayUnmutePendingRef = true`. The restore-audio logic lives inside `onStateChange`, in the branch `if (playing && autoplayUnmutePendingRef.current)`. For the unmute to fire, the player must emit a `PLAYING` state event. On first visit, browsers block autoplay even when muted unless the page was interacted with. The retry loop calls `playVideo()` six times but the player never enters `PLAYING`, so the `PLAYING` state event never fires, so `restoreAudio` is never called, and `autoplayUnmutePendingRef` never clears. The `toggle` control in `registerControls` also guards against this scenario — it checks `autoplayUnmutePendingRef` and calls `restoreAudio` instead of `pauseVideo`, which is correct — but the user never sees a play button because `isPlaying` is `false` and the title is stuck at the placeholder.

**Problem B — Title stays "Loading soundtrack..." because `getVideoData()` returns empty before playback.**
Inside `onReady`, `readCurrentTrack` is called and it calls `player.getVideoData()`. At the moment `onReady` fires, the YouTube player has not yet loaded any video data — `getVideoData()` returns `{ title: "", video_id: "" }`. The title fallback logic in `readCurrentTrack` checks `videoData?.title?.trim()` first, and since it is empty, falls back to `"Playlist track ${playlistIndex + 1}"` if the playlist index is readable, or `"Playlist soundtrack"`. Both of these are different from the actual track title but not as bad as `"Loading soundtrack..."`. However, `setTitle` in `MusicContext.syncTrack` only updates the title when `payload.title` is truthy. If `readCurrentTrack` returns a non-empty placeholder like `"Playlist soundtrack"`, it will set that. But if `readCurrentTrack` returns the empty string (because the playlist index is also -1 at mount time), `syncTrack` receives a falsy title and skips the update, so `"Loading soundtrack..."` persists. The poll loop at 400ms eventually calls `readCurrentTrack` again and picks up the real title once the player has buffered, but only if playback is running, which it is not.

**Problem C — The `toggle` control calls `restoreAudio` as its first-click handler, but `restoreAudio` checks `player.isMuted()` which returns `false` after the initial `player.mute()` call in some player configurations, causing it to bail early without unmuting.**
The condition in `restoreAudio` is: `if (!player.isMuted() && player.getVolume() > 0 && !autoplayUnmutePendingRef.current) return`. This early-return is meant to guard against double-unmuting. But `player.getVolume()` returns `0` (because `player.setVolume(0)` was called in `onReady`), so the guard correctly does not trigger. However, `player.isMuted()` may return `false` in some IFrame API versions even though the player was muted via the API, which would make the first condition false and the second condition also false (`getVolume() > 0` is false when volume is 0), meaning the function would proceed. This is inconsistent across browser/API versions.

### Required Fix

The music boot sequence needs to be simplified and made more robust. The muted-autoplay strategy should be kept (it is the only approach that works within browser autoplay policy), but the audio restoration must be tied to **the first user interaction with any element on the page**, not exclusively to the `PLAYING` state event.

Specifically:

The `ExperienceShell` already has the right architecture for this. When `handleDecision` is called (cookie accept/reject), it calls `play()`. For return visitors (no cookie dialog), the existing `useEffect` in `ExperienceShell` calls `play()` when the engine becomes ready and consent is not `"unknown"`. These paths already call `togglePlayback` or `play` on the controls. What is missing is that `play()` must also call `restoreAudio` to clear the muted state when `autoplayUnmutePendingRef` is true.

The `play` control registered in `registerControls` must be updated so that when `autoplayUnmutePendingRef.current === true`, it calls `restoreAudio` **before** calling `player.playVideo()`. This ensures that the first explicit `play()` call from `ExperienceShell` both unmutes and starts playback simultaneously, regardless of whether the browser's autoplay attempt succeeded.

Additionally, the title placeholder fallback in `readCurrentTrack` should never produce a non-empty string when no real data is available yet. If `getVideoData().title` is empty and the playlist index is also not yet readable, the function should return `null` or an empty string for the title field, so that `syncTrack` skips the title update and the UI continues showing `"Loading soundtrack..."` rather than a wrong placeholder. The title will be correctly populated once the poll loop fires after playback begins.

Finally, the `startPlayback` retry loop should be extended with one final attempt at a longer delay (e.g. 3000ms) as a last resort, in case all six short retries fail due to network buffering. This is a belt-and-suspenders fallback, not the primary fix.

### Acceptance Criteria

- Clicking the play button on first visit, or accepting/rejecting the cookie dialog, must start audio playback with sound within 500ms.
- The title must update from `"Loading soundtrack..."` to the real track title within one poll cycle (400ms) after playback begins.
- Volume and mute controls must operate correctly on the first interaction.
- The play/pause button must toggle correctly and reflect the real `isPlaying` state.
- On browsers that do support muted autoplay, the music must start playing muted and then unmute without user intervention.

---

## Issue 2 — Ambient Background Not Reacting to Music or Album Colors

### Files

`components/background/AmbientBackground.tsx`, `lib/colorExtractor.ts`, `context/ThemeContext.tsx`

### Root Cause Analysis

There are two separate problems here, both of which must be fixed for the ambient background to feel reactive.

**Problem A — Palette extraction collapses dark thumbnail colors into near-black buckets.**
`colorExtractor.ts` uses a 32-unit quantization step: `Math.round(r / 32) * 32`. This means any channel value from 0–15 rounds to 0, 16–47 rounds to 32, 48–79 rounds to 64, and so on. For a typical dark music thumbnail with lots of shadow and moody tones, the majority of pixels will have channel values below 80, meaning they all collapse into buckets at 0, 32, or 64. The five most frequent buckets are therefore all very dark, and the extracted palette ends up as shades of near-black. When this palette is passed to `AmbientBackground`, the `boostCanvasColor` function does raise saturation and lightness — but `boostCanvasColor` cannot conjure hue information that was destroyed in quantization. If the input is `#000000`, boosting lightness gives `#282828`, which is still invisible against the dark canvas background.

The fix is to use a finer quantization step (16 or even 8 units), which preserves more hue variation in the extracted colors. Additionally, after extraction, colors that are below a luminance threshold should be discarded or replaced with the fallback palette colors. The goal is that the extractor returns the most visually prominent *distinct* colors from the thumbnail, not just the most frequent pixels (which are often background blacks).

**Problem B — `visualLevel` reactivity is invisible because the energy range used in `AmbientBackground` is too narrow relative to the dark base background.**
The canvas base gradient goes from deep purple-black at the center to full black at the edges. Blob colors are rendered with `globalCompositeOperation = "screen"`, which means a blob with color `rgba(30, 20, 50, 0.2)` blended in screen mode against a near-black background is completely invisible. The `boostCanvasColor` function does lift the palette colors, and the screen blend mode is correct for the dark theme. The problem is that at `visualLevel = 0.06` (paused), the blob opacity is `0.18 + 0` = 0.18, and at `visualLevel = 0.94` (peak), it is `0.18 + 0.22` = 0.4. With dark source colors and screen compositing, even 0.4 opacity produces blobs that are barely visible. The opacity range needs to be wider — the minimum opacity at rest should be at least 0.28 for large blobs, and the peak should reach 0.72 or higher for full energy.

Furthermore, the canvas draw loop exits early on `visualLevel` check because `visualLevelRef.current` is read correctly on each frame. But `setVisualLevel` in `MusicContext` only runs when the poll loop in `YouTubeEngine` calls it, and the poll loop only runs when `playerRef.current` is not null. If playback never starts (Issue 1), `playerRef` is null, the poll loop does nothing, and `visualLevel` remains at its initial value of `0.2`. So Issues 1 and 2 are coupled — fixing Issue 1 is prerequisite to fully validating Issue 2.

### Required Fix

Two targeted changes are required:

For the **palette extractor**, reduce the quantization step from 32 to 16. After collecting the top five buckets, filter out any color whose perceived luminance (using the standard `0.299R + 0.587G + 0.114B` formula) is below 28 out of 255. Replace any filtered-out entry with the next most frequent non-dark bucket. If fewer than two non-dark colors are found, supplement with the fallback palette colors starting from index 2 (so the very dark fallback background colors at indices 0 and 3 are not used as blob colors). This ensures the extracted palette always contains at least a few vibrant, non-black hues that are visible in screen blend mode against the dark canvas.

For the **AmbientBackground blob rendering**, increase the opacity range. For large blobs (size >= 96), the stop-0 opacity should be `0.28 + level * 0.44` at the center. For small blobs, it should be `0.22 + level * 0.38`. This makes blobs clearly visible even at rest (level 0.06) and dramatically more vivid at peak energy (level 0.94). The `filter` blur reduction at low energy should also be more pronounced — at `level = 0`, the blur should be at its maximum (`blur(22px)` for large blobs), creating a soft diffuse glow at rest, while at peak energy the blur reduces to `blur(6px)`, making the colors punch through with higher contrast.

### Acceptance Criteria

- When a YouTube track is playing, the background blobs must visibly change color to reflect the dominant hues of the track's thumbnail within two poll cycles (800ms) of the thumbnail loading.
- The background must pulse noticeably — not aggressively — when music is playing versus when it is paused.
- Colors extracted from a thumbnail like the one at `https://www.youtube.com/watch?v=ZAz3rnLGthg` (which has warm amber and dark tones) must produce visible amber/warm blobs, not invisible dark patches.
- The paused state and playing state must be visually distinguishable to a casual observer within two seconds.

---

## Issue 3 — Playlist Not Loading in Order, Random Song Playing Instead

### Files

`components/music/YouTubeEngine.tsx`, `lib/youtube.ts`

### Root Cause Analysis

The music URL in `seed-data.ts` is `https://www.youtube.com/watch?v=ZAz3rnLGthg&list=RDZAz3rnLGthg`. `parseYouTubeSource` extracts both `videoId: "ZAz3rnLGthg"` and `playlistId: "RDZAz3rnLGthg"` from this URL.

In `YouTubeEngine`'s boot effect, the `new api.Player()` call passes `playerVars` with both `videoId: source.videoId` as the constructor argument AND `list: source.playlistId` and `listType: "playlist"` inside `playerVars`. When both are present, the YouTube IFrame API interprets this as "play this specific video, and also know about this playlist." The result is that the API plays the single `videoId` as a standalone video. The playlist is not loaded as a queue — `getPlaylist()` returns an empty array because no playlist context was properly initialized, and `getPlaylistIndex()` returns -1. The `movePlaylist` function's fallback to `player.nextVideo()` / `player.previousVideo()` does nothing meaningful when there is no playlist loaded.

The `RDZAz3rnLGthg` prefix on the playlist ID is specifically a YouTube "radio/mix" playlist (the `RD` prefix means it is an auto-generated radio mix). These playlist types require the IFrame API to be initialized without a `videoId` — only with `list` and `listType: "playlist"` in `playerVars` — so that YouTube initializes the full mix queue starting from the first entry.

Additionally, `disableShuffle` is called inside `onReady` for playlists. However, `setShuffle(false)` has no documented effect on radio/mix playlists (`RD*` IDs) — YouTube's auto-generated mixes do not respect this call. The playlist will still play in a semi-random order unless loaded without a conflicting `videoId`.

### Required Fix

`parseYouTubeSource` should be updated to recognize the case where both a `videoId` and `playlistId` are present. When a `playlistId` is detected, the returned `videoId` should be set to `null`. The playlistId is the authoritative source when both are present. This is a one-line logic change in the parser.

In `YouTubeEngine`, the player constructor's `videoId` argument (the second positional parameter to `new api.Player(hostRef.current, { videoId: ... })`) must be `undefined` when `source.playlistId` is set. The `playerVars.list` and `playerVars.listType` fields correctly handle playlist loading — the `videoId` constructor argument must be absent to allow the playlist to initialize properly.

The `applySource` function used for hot-reloading a new URL already calls `player.loadPlaylist` when a `playlistId` is present and does not call `loadVideoById`, which is correct. The fix is only needed in the initial boot call.

After this fix, `getPlaylist()` will return the full playlist array, `getPlaylistIndex()` will return the current index, and `movePlaylist` will correctly use `playVideoAt` for navigation.

### Acceptance Criteria

- After the fix, loading the site with the default URL `https://www.youtube.com/watch?v=ZAz3rnLGthg&list=RDZAz3rnLGthg` must initialize the playlist queue, not a single video.
- `getPlaylist()` must return a non-empty array after the player reaches `PLAYING` state.
- The next/previous controls must advance and retreat through the playlist order.
- Saving a new playlist URL in the admin panel must correctly load the new playlist without a page reload.
- A plain video URL with no `list` parameter must still load as a single video.

---

## Issue 4 — Music Player to Footer Transform Animation Needs More Graphic Realism

### Files

`components/music/MusicPlayer.tsx`, `components/layout/Footer.tsx`, `context/MusicContext.tsx`

### Root Cause Analysis

The current animation is mechanically correct but visually unconvincing as a "takeover" because the two objects — the floating widget and the footer music card — behave like independent elements that happen to fade at similar times. There is no spatial storytelling that connects them.

The floating `MusicPlayer` currently:
- Fades out linearly: `opacity: 1 - takeoverFade` where `takeoverFade` ramps from 0 to 1 as `footerTakeover` goes from 0.12 to 0.72.
- Translates: `x: footerTakeover * -40`, `y: footerTakeover * 320`.
- Scales: `scale: 1 + footerTakeover * 0.14`.
- Rotates: `rotate: footerTakeover * -2`.

The issue is that at `footerTakeover = 1.0`, the player has been fully invisible since `takeoverFade = 1.0` at `footerTakeover = 0.72`. The player disappears in the upper-right corner of the screen while the user is still scrolling, long before the footer card appears. The footer card only starts becoming visible at `footerTakeover = 0.6` (opacity formula: `(footerTakeover - 0.6) * 2.5`). So there is a gap between `0.72` and `0.6` where both elements are partially invisible simultaneously — which is precisely the wrong moment to be showing nothing.

The more fundamental issue is that the player does not visually travel toward the footer. The `y: footerTakeover * 320` translation pushes the widget downward off the bottom-right of the viewport. But the footer music card is in the bottom-center/right of the page — the player should be seen drifting toward that position, not falling off the screen.

A cinematic "takeover" needs the widget to appear to physically travel from its corner resting place into the footer card, as if they are the same object morphing. The way to achieve this without a shared-element transition (which Next.js/Framer does not trivially support across components) is to use carefully tuned motion curves that make the two independent elements feel connected.

### Required Fix

The animation system needs to be rebuilt around a single choreography timeline where the player's departure and the card's arrival overlap deliberately.

The **floating player** should:
- Remain fully visible until `footerTakeover = 0.52`, then fade to zero by `footerTakeover = 0.78`. This is a narrower, later fade window.
- Its `y` translation should accelerate into a downward curve — using an ease-in curve so the widget appears to be falling toward the footer's position. The total `y` translation should be approximately `footerTakeover^2 * 480` (squared for natural acceleration) rather than linear.
- Its `scale` should grow from `1.0` to `1.24` (not just 1.14) as it travels, simulating the widget growing as it approaches the "camera" of the footer zone.
- A subtle `rotate` from `0` to `-3` degrees adds physicality.
- A `blur` filter of `0px` to `8px` on the exit makes it look like the widget is moving through depth-of-field as it falls.

The **footer music card** should:
- Remain invisible until `footerTakeover = 0.64` (not 0.6, to create a deliberate beat after the player disappears).
- Animate in with a spring-based entrance: it should start slightly below and behind (negative `y`, and a scale of 0.88), then spring forward and upward into its final position. This creates the impression that the widget has "landed" in the footer and settled.
- The card's arrival animation must use `type: "spring"` with a `stiffness` and `damping` chosen so that it slightly overshoots and settles — like a physical object being set down. A slight `rotate` from `2deg` to `0deg` during the spring enhances the physical feel.
- A very brief `boxShadow` bloom on arrival (shadow growing and then settling) adds a cinematic "impact" moment.

Both components must continue reading `footerTakeover` from `MusicContext`, and the `setFooterTakeover` scroll handler in `Footer` must not change. Only the animation value mappings inside the two components change.

### Acceptance Criteria

- Scrolling toward the footer creates a clearly choreographed experience where the floating player visibly accelerates downward and disappears, followed by the footer card springing into its resting position.
- The arrival of the footer card feels physically motivated — it springs, slightly overshoots, and settles.
- The transition feels like a single entity transforming, not two independent fades.
- The experience works on mobile and desktop at all scroll speeds.
- When scrolling back up from the footer, the reverse transition (card fades, player reappears) is equally clean.

---

## Issue 5 — Five New Features Suited to This Portfolio Theme

The five features selected below were chosen based on three criteria: they align with the "living art piece" intent from `idea.txt`, they are buildable within the existing architecture without structural changes, and they meaningfully elevate the experience rather than adding noise.

---

### Feature 5A — Magnetic Cursor Trail with Chromatic Dissolve

**Files to create/modify:** `components/ui/GlassCursor.tsx`

**What it is:**
The custom glass cursor currently follows the pointer with a smooth lerp. This feature adds 4–6 trailing "echo" particles behind the cursor that each independently lerp toward the cursor's position at different speeds (the slowest trail element is furthest behind). Each echo particle uses the current `--accent-rgb` value so that when the theme palette changes with a new track, the trail color shifts too. The particles dissolve over a short distance (roughly 80px from the cursor's tip), fading from 0.4 opacity to zero as they trail further behind.

**Why it fits:**
The trail is visual evidence of movement — it makes the cursor feel like it has mass and momentum. When the user moves quickly, the trail stretches; when they stop, it collapses into the cursor. This directly reinforces the site's goal of making every interaction feel deliberate and cinematic. The color tie to the music palette makes even cursor movement part of the ambient music reaction.

**Behavioral rules:**
- Trail particles are rendered in the same rAF loop as the cursor — no separate component needed.
- Particle positions are stored in an array of `{ tx, ty }` objects. Each particle's `tx` and `ty` lerp toward the previous particle's (or the cursor's) position at a speed multiplier that decreases with index (first particle at 0.18, last at 0.05).
- Trail is only rendered on fine-pointer devices, same as the cursor.
- No trail on interactive element hover — when the cursor is in its expanded hover state, the trail opacity fades to 0 so it does not clutter the interaction feedback.

**Acceptance criteria:**
- The cursor leaves a visible color trail during movement that matches the current theme accent.
- The trail dissolves naturally when the cursor is stationary.
- Performance must not degrade — rAF budget must remain under 2ms for the combined cursor+trail render.

---

### Feature 5B — Section Scroll Progress Ring on the Header

**Files to create/modify:** `components/layout/Header.tsx`

**What it is:**
A thin SVG ring (approximately 26px diameter) sits to the left of the site name in the header. This ring acts as a page scroll progress indicator — it fills from 0% to 100% as the user scrolls from the top of the page to the bottom. The ring is drawn as a `strokeDashoffset` SVG circle that animates in real-time with `requestAnimationFrame`. The ring stroke color uses `rgb(var(--accent-rgb))`, so it follows the music palette. A very faint track circle is always visible underneath (opacity 0.18) so the ring has a visible housing even before scrolling begins.

**Why it fits:**
The ring is a reference to vinyl records, audio meters, and the general circular language of music players. It also gives the header a functional element that is visually interesting without being decorative noise. Users on long scroll portfolios benefit from a passive sense of location, and the ambient color reaction makes it feel connected to the audio system.

**Behavioral rules:**
- Scroll progress is calculated as `scrollY / (documentHeight - viewportHeight)`, clamped to 0–1.
- The SVG is rendered inline inside the header component, not as a separate file.
- On mobile, the ring is hidden to preserve header space.
- The ring must not interfere with the active section tracking already in the header.

**Acceptance criteria:**
- The ring visibly fills as the user scrolls down.
- It empties when the user scrolls back to the top.
- The stroke color changes when the music palette changes.
- No layout shift — the ring is absolutely positioned within its container.

---

### Feature 5C — Waveform Visualizer Ring Around the Disc in Minimized Player Mode

**Files to create/modify:** `components/music/MusicPlayer.tsx`, `context/MusicContext.tsx`

**What it is:**
When the music player is in its minimized disc mode (the spinning circle in the bottom-right corner), a live waveform ring animates around the outer edge of the disc. The ring is an SVG element positioned absolutely around the disc. It renders 48 equally spaced radial tick marks whose height is modulated by a combination of `visualLevel` and a time-varying sine function — creating the appearance of a simple frequency bar graph wrapped into a circle, like the equalizer ring on a vinyl record player or a speaker cone seen from above. The tick marks are colored with `rgba(var(--accent-rgb), alpha)` where alpha rises with each bar's height.

**Why it fits:**
This is the most visually direct expression of music in the entire interface. The disc already spins with `animationPlayState: isPlaying ? "running" : "paused"`, which is a strong signal. Adding the waveform ring turns the player widget into a mini music visualization object that the user can glance at from anywhere on the page and immediately see that music is playing and pulsing.

**Behavioral rules:**
- The ring is only rendered in minimized mode. In expanded mode, the seek bar already provides progress feedback.
- Tick heights are computed on each animation frame using `visualLevel` from `MusicContext` via `useMusicFrequency`.
- Each of the 48 ticks has a phase offset so they do not all pulse simultaneously — the result should look like a waveform rotating around the disc, not a uniform ring expansion.
- When `isPlaying` is false, all ticks collapse to their minimum height (2px) over 400ms.
- The ring must not affect click handling on the disc — it sits as a purely decorative overlay with `pointer-events: none`.

**Acceptance criteria:**
- The waveform ring is visible around the disc when music is playing.
- The tick heights respond to `visualLevel` — higher energy means taller ticks.
- The ring reacts to the current theme accent color.
- The ring collapses gracefully when music is paused.

---

### Feature 5D — Parallax Depth Scroll on Hero Section

**Files to create/modify:** `components/sections/Hero.tsx`

**What it is:**
The Hero section currently animates its elements in on first scroll into view using Framer Motion `whileInView`. This feature adds a continuous parallax depth effect that persists as the user scrolls past the hero. The hero's left text column moves slightly slower than the scroll speed (`translateY` at approximately 0.2× scroll offset), while the right panel card moves slightly faster (`translateY` at -0.15× scroll offset). The ambient background canvas already has its own parallax via fixed positioning, so the hero becomes a middle layer between the moving background and the foreground content.

**Why it fits:**
Parallax is one of the simplest ways to communicate depth and physical presence. On a site that is explicitly about creating an immersive experience, the hero section is the first thing the user sees after the loading screen and cookie dialog — it needs to feel like a window into a world, not a flat page. The slight differential motion between the text and the card makes the hero feel three-dimensional without requiring any 3D CSS that might conflict with the glass aesthetic.

**Behavioral rules:**
- Parallax values are calculated relative to the hero element's position on the screen, not the page origin, so the effect is consistent regardless of the header height.
- `useRef` on the hero section and a `scroll` event listener (passive, rAF-throttled) drive the transform values.
- The parallax is inactive when the section is fully scrolled past — a guard checks `rect.bottom < 0` and `rect.top > window.innerHeight` before applying transforms.
- On mobile, the parallax offsets are halved to avoid motion-sensitive issues and because the reduced viewport height makes strong offsets feel nauseating.
- The parallax must not interfere with the `whileInView` entry animations — entry animations run once, parallax runs continuously during scroll.

**Acceptance criteria:**
- Scrolling through the hero shows visible depth separation between the left text block and the right card.
- The effect is continuous, not a one-time animation.
- The effect is disabled on mobile or reduced to a safe, smaller magnitude.
- No layout reflows — only CSS `transform` is modified, never `top` / `left` / `margin`.

---

### Feature 5E — Ambient Palette Pulse on Review Cards When Music Plays

**Files to create/modify:** `components/sections/Reviews.tsx`, `hooks/useMusicFrequency.ts`

**What it is:**
Each review card in the guestbook section acquires a subtle glow ring — a `box-shadow` that pulses gently in sync with `visualLevel`. The glow uses `rgba(var(--accent-rgb), alpha)` where `alpha` is driven by the current music energy level. At rest (no music or paused), the glow is invisible. When music is playing at moderate energy, the glow softly breathes on each card. At peak energy, it brightens across all cards simultaneously, making the review section feel like it is also participating in the music experience.

**Why it fits:**
The review section is the most "human" part of the site — it is where other people's words live. Making this section visually responsive to the music creates a subtle implication that the music and the audience are connected, reinforcing the personal, art-driven concept of the project. It also solves an asymmetry: every other section (background, player, footer card) reacts to the music, but the review cards are static. This brings the entire page into the ambient music system.

**Behavioral rules:**
- The glow is applied via a CSS custom property `--review-glow-alpha` that is updated on each animation frame by a small `useEffect` inside `Reviews.tsx` that reads `visualLevel` through `useMusicFrequency`.
- The `box-shadow` on each card is `0 0 0 1px rgba(var(--accent-rgb), 0.12), 0 0 28px rgba(var(--accent-rgb), var(--review-glow-alpha))`.
- `--review-glow-alpha` maps from `0` at `visualLevel = 0` to `0.28` at `visualLevel = 1`. The mapping should use a gentle power curve (`visualLevel ^ 1.4`) so the glow does not appear too suddenly at low energy.
- The update is rAF-throttled to prevent unnecessary per-frame DOM writes. A single `requestAnimationFrame` loop in a `useEffect` updates the CSS variable on the section container.
- There must be no layout shift — only `box-shadow` changes, which do not affect layout.

**Acceptance criteria:**
- Review cards visibly glow when music is playing, with intensity proportional to energy.
- The glow color changes when the music palette changes.
- When music is paused, the glow fades to invisible within one second.
- No layout reflow occurs.

---

## File Reference

| Issue / Feature | Files |
|-----------------|-------|
| #1 Music controls broken, no autoplay | `components/music/YouTubeEngine.tsx`, `components/layout/ExperienceShell.tsx`, `context/MusicContext.tsx` |
| #2 Ambient background not reacting | `components/background/AmbientBackground.tsx`, `lib/colorExtractor.ts`, `context/ThemeContext.tsx` |
| #3 Playlist not loading in order | `components/music/YouTubeEngine.tsx`, `lib/youtube.ts` |
| #4 Footer takeover animation | `components/music/MusicPlayer.tsx`, `components/layout/Footer.tsx` |
| #5A Cursor trail | `components/ui/GlassCursor.tsx` |
| #5B Header scroll ring | `components/layout/Header.tsx` |
| #5C Waveform ring on disc | `components/music/MusicPlayer.tsx`, `context/MusicContext.tsx` |
| #5D Hero parallax depth | `components/sections/Hero.tsx` |
| #5E Review card ambient glow | `components/sections/Reviews.tsx`, `hooks/useMusicFrequency.ts` |

---

## Dependency Order

The five issues in this changelog have dependencies on each other that Codex must respect.

Issue 3 (playlist fix) must be implemented first. It changes how `source.videoId` is set when a `playlistId` is present. Issue 1 (autoplay fix) depends on the player being correctly initialized with a playlist, which requires Issue 3 to be correct first. Issue 2 (ambient reactivity) depends on Issue 1 being fixed because the poll loop that drives `visualLevel` only runs during active playback. Issue 4 (footer animation) is independent and can be implemented in any order. The five new features are all independent of each other and of the bug fixes.

Recommended implementation order: **3 → 1 → 2 → 4 → 5A → 5B → 5C → 5D → 5E**.
