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

## Files Modified

- `lib/colorExtractor.ts`
- `components/background/AmbientBackground.tsx`
- `components/music/YouTubeEngine.tsx`
- `components/music/MusicPlayer.tsx`
- `components/layout/Header.tsx`
- `components/layout/Footer.tsx`
- `components/ui/VersionBadge.tsx`
- `components/sections/About.tsx`
- `components/loading/LoadingScreen.tsx`
- `components/sections/Reviews.tsx`
- `my-portfolio-brain/architecture.md`

## Testing Checklist

- [ ] Verify ambient background colors match thumbnail colors accurately
- [ ] Verify no unwanted red/pink tones appear in background when album art lacks those colors
- [ ] Verify blob scaling is smooth and gradual, not snappy
- [ ] Verify blob sizes stay within reasonable limits
- [ ] Verify white borders are removed from all listed components
- [ ] Verify footer music player has smooth 3D float hover effect
- [ ] Test across different album art thumbnails to ensure color extraction works consistently
