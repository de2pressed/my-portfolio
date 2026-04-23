# Release Notes v1.0.4

## Overview

This release focuses on improving the ambient background music reactivity, modernizing the UI by removing outdated white outlines, and adding subtle interactive polish to the footer music player.

## Changes

### Ambient Background Music Reactivity

**Problem:** The ambient background was not reacting to music playback as intended. Colors extracted from thumbnails were inaccurate (e.g., red appearing when album art had no red), and the blob scaling was too snappy and minimal rather than precise and smooth.

**Solution:**

**Color Extraction Improvements (`lib/colorExtractor.ts`):**
- Replaced fallback colors from magenta/purple (`#b93ca7`, `#7a57e8`) with neutral grayscale palette to prevent unwanted red/pink tones
- Improved quantization precision from 16-unit to 8-unit steps for more accurate color capture
- Increased canvas size from 128x128 to 200x200 for better sampling resolution
- Reduced `boostCanvasColor` intensity to preserve original thumbnail colors (saturation boost: 1.5→1.15, lightness boost: 1.14→1.05)
- Increased sampling rate from every 16th pixel to every 4th pixel

**Energy Calculation Improvements (`components/music/YouTubeEngine.tsx`):**
- Added 5-value moving average to energy calculations to reduce high-frequency fluctuations
- Increased smoothing factor from 0.15 to 0.05 for buttery smooth transitions (~8 seconds to reach target)
- Reduced frequency multipliers for more deliberate changes (bass: 3.0→2.0, mid: 8.0→5.0, high: 16.0→10.0)
- Reduced volume scaling impact (power: 1.8→1.5, multiplier: 0.5→0.4)

**Blob Scaling Improvements (`components/background/AmbientBackground.tsx`):**
- Reduced pulse multiplier from 1.18 to 0.6 for large blobs, 0.9 to 0.4 for small blobs
- Added min/max constraints: large blobs capped at 1.5x, small blobs at 1.3x their base size
- This prevents blobs from growing too large too quickly

### UI Modernization - Removed White Outlines

**Problem:** White outlines on various UI components gave the site an outdated look.

**Solution:** Removed white borders from all public-facing components:

**Music Player (`components/music/MusicPlayer.tsx`):**
- Removed border from main container
- Removed border from artwork container
- Removed border from artwork inset
- Removed border from progress bar input

**Header (`components/layout/Header.tsx`):**
- Removed border from main header
- Reduced SVG scroll progress circle stroke opacity from 0.18 to 0.06
- Removed border from active nav items (desktop and mobile menu)

**Other Components:**
- `components/ui/VersionBadge.tsx` - removed border
- `components/sections/About.tsx` - removed border from education card
- `components/loading/LoadingScreen.tsx` - removed borders from loading shapes and top border
- `components/sections/Reviews.tsx` - removed borders from all input fields

### Footer Music Player Hover Animation

**Enhancement (`components/layout/Footer.tsx`):**
- Added 3D float hover animation to footer music player
- On hover: lifts up (y: 12 vs 22 base), scales up (0.92 vs 0.88 base), reduces rotation (1.5° vs 2° base)
- Enhanced shadow on hover with larger blur (32px vs 24px) and stronger accent glow

### YouTube Player Bug Fixes

**Problem:** Multiple runtime errors were still occurring with the YouTube music player:
- postMessage origin mismatch warnings when controlling playback
- controls updating React state without actually controlling the player
- `Cannot read properties of null (reading 'src')` error from YouTube widget API
- playlist sources getting stuck on the first track or losing next/previous order

**Solution (`components/music/YouTubeEngine.tsx`):**

**Stable Player Lifecycle:**
- Rewrote the engine so the YouTube player is created once, not rebuilt on volume changes or other unrelated state updates
- Source changes now flow through a dedicated load bridge instead of recreating the iframe
- Cleanup now destroys the active player before clearing the hidden host element

**Guarded Direct API Methods:**
- Kept the official YouTube Player API method path instead of custom postMessage commands
- Added iframe-mounted guards around play, pause, seek, mute, unmute, volume, and playlist navigation calls
- This avoids both origin mismatch warnings and the widget API null `src` crash that happens when a detached player object is used

**Control Bridge Repair (`context/MusicContext.tsx`):**
- Restored forwarding for `setVolume`, `seekTo`, and `loadMusicUrl` so the UI controls reach the real player again
- Kept pending first-play behavior intact so the cookie handoff and first gesture still wake the soundtrack correctly

**Playlist Recovery:**
- Added playlist index recovery from the active video ID when YouTube reports `getPlaylistIndex() === -1`
- Reloaded playlist sources through the stable load bridge when the queue is missing instead of falling back into single-video behavior
- Single videos still loop on `ENDED`, while playlist sources advance through the queue

### Footer Takeover And Control Follow-Up

**Problem:** After stabilizing playback, the floating player still did not feel connected to the footer and some visible controls could appear dead once the old global-scroll takeover logic started disabling pointer interaction too early.

**Solution:**
- Rebased footer takeover progress on the footer panel entering the viewport instead of total document scroll percentage
- Added an integrated footer music-zone card so the floating player has a real destination to hand off into
- Delayed pointer handoff until the footer card is actually ready, which keeps the floating player's buttons and sliders interactive longer
- Added `onInput` handling for progress and volume sliders so drag interactions feel immediate
- Relaxed the hidden-player mounted check so valid player controls are not blocked by an overly strict iframe `src` test

### Motion And Glass Polish

**Problem:** The footer handoff still felt slightly mechanical, the custom cursor could wiggle as it settled, and the music surfaces lacked the thicker 3D pane quality from the visual reference.

**Solution:**
- Smoothed the player/footer merge with softer easing, reduced rotation, and a later fade so the floating card feels like it is docking instead of dropping away
- Reworked the cursor motion to use clean damped interpolation instead of spring momentum, which removes the end-of-motion wobble while keeping the trailing glow
- Added layered pane highlights, interior edge lighting, and top-sheen bloom to both the floating player and the footer music-zone card so both states read as thicker glass surfaces

### Glass Readability And True Hover Tilt

**Problem:** The floating player was still slightly soft because its merge wrapper kept a baseline blur filter applied even while idle, and the prior "3D" look was mostly static styling instead of an actual hover-driven panel rotation.

**Solution:**
- Removed the always-on wrapper blur from the floating player so titles and control labels render crisp again
- Tightened the glass surface with denser fill and lower overlay haze so the panel reads clearly against the animated background
- Added a shared pointer-driven tilt hook for the floating player and footer music card, so both visible panels rotate in 3D as the cursor moves across them without interfering with the existing footer takeover or playback controls

### Footer Control Handoff Alignment

**Problem:** Footer playback controls could feel inconsistent because the floating player stayed interactive above the footer for longer than the footer card's own reveal threshold, leaving a scroll range where the fixed player could still steal clicks.

**Solution:**
- Aligned the floating player's pointer handoff threshold with the footer card's actual reveal threshold
- Lowered the floating player in the stack once handed off and raised the footer music card above it during takeover so footer buttons reliably receive input
- Moved the docked card's tilt onto a non-interactive shell and kept the footer control row on a `pointer-events-auto` content layer so the transformed glass surface no longer interferes with button clicks
- Marked the footer section's ambient full-bleed overlay as non-interactive and lifted the content grid above it so the decorative background cannot block clicks on the docked controls

## Files Modified

- `lib/colorExtractor.ts`
- `components/background/AmbientBackground.tsx`
- `components/music/YouTubeEngine.tsx`
- `components/music/MusicPlayer.tsx`
- `context/MusicContext.tsx`
- `hooks/useMusicFrequency.ts`
- `hooks/usePanelTilt.ts`
- `components/layout/Header.tsx`
- `components/layout/Footer.tsx`
- `components/ui/VersionBadge.tsx`
- `components/sections/About.tsx`
- `components/loading/LoadingScreen.tsx`
- `components/sections/Reviews.tsx`
- `my-portfolio-brain/architecture.md`
- `my-portfolio-brain/README.md`
- `my-portfolio-brain/project-overview.md`
- `my-portfolio-brain/working-guide.md`

## Testing Checklist

- [ ] Verify ambient background colors match thumbnail colors accurately
- [ ] Verify no unwanted red/pink tones appear in background when album art lacks those colors
- [ ] Verify blob scaling is smooth and gradual, not snappy
- [ ] Verify blob sizes stay within reasonable limits
- [ ] Verify white borders are removed from all listed components
- [ ] Verify footer music player has smooth 3D float hover effect
- [ ] Test across different album art thumbnails to ensure color extraction works consistently
- [ ] Verify no postMessage origin mismatch warnings in console
- [ ] Verify music plays and volume changes work without recreating or killing the player
- [ ] Verify track title and cover art appear correctly
- [ ] Verify no YouTube widget API null src errors
- [ ] Verify seek and mute controls update the real player, not just React state
- [ ] Verify playlist URLs advance in order and next/previous do not collapse into first-track looping
- [ ] Verify music player initializes cleanly on page load
- [ ] Verify music player cleans up properly on unmount
- [ ] Verify the floating player remains interactive until the footer music zone is visibly ready
- [ ] Verify the footer music zone appears and the floating player hands off into it as the footer enters view
- [ ] Verify the cursor stops cleanly without visible wobble after pointer movement ends
- [ ] Verify both floating and footer music cards keep their new 3D glass pane treatment without breaking existing controls or takeover timing
