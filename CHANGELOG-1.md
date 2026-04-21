# CHANGELOG-1 — Issues & Required Fixes

> **Author:** Antigravity audit  
> **Date:** 2025-04-21  
> **Target:** Codex  
> **Scope:** Full codebase review of `My-Portfolio` (Next.js 14, App Router, Tailwind, Framer Motion, YouTube IFrame API)

---

## 🔴 Critical

### 1. YouTube player destroyed on every volume change

**File:** `components/music/YouTubeEngine.tsx` — line 212  
**Problem:** `volume` is included in the dependency array of the main `useEffect` that boots the YouTube IFrame player. Every time the user drags the volume slider, this effect re-runs — it destroys the existing player instance, creates a new one, and loses playback state entirely. The volume slider is effectively broken.  
**Fix:** Remove `volume` from the dependency array. Store `volume` in a `useRef` so `deriveEnergy()` can read the current value without triggering the effect. The `setVolume` control registered via `registerControls` already calls `player.setVolume()` directly, so the effect doesn't need to re-run.

---

### 2. `/admin` route shows homepage instead of redirecting

**Files:** `app/admin/` directory  
**Problem:** There is no `app/admin/page.tsx`. The only pages are `app/admin/login/page.tsx` and `app/admin/panel/page.tsx`. When a user navigates to `/admin`, Next.js falls through to the root layout and renders the homepage content inside the admin route shell. On the live deployment, `/admin` currently shows the full portfolio page instead of any admin interface.  
**Fix:** Create `app/admin/page.tsx` that imports `redirect` from `next/navigation` and redirects to `/admin/login`.

---

### 3. Music context functions create new references every render

**File:** `context/MusicContext.tsx`  
**Problem:** `registerControls`, `syncTrack`, `setPlayerReady`, `setPlayerError`, `setVisualLevel`, `setVolume`, `togglePlayback`, `playNext`, `playPrevious`, `play`, `pause`, `mute`, `unmute`, and `loadMusicUrl` are all plain functions defined inside the `MusicProvider` component body. They produce new references on every render. Since `YouTubeEngine.tsx` lists several of these (`registerControls`, `setPlayerReady`, `setPlayerError`, `syncTrack`, `setVisualLevel`) in its effect dependency array, the player-boot effect re-runs on unrelated re-renders. This compounds bug #1.  
**Fix:** Wrap all of these functions in `useCallback`. Each one either depends only on `controls` (which is state) or on nothing at all — the dependency arrays are straightforward.

---

### 4. Theme context functions create new references every render

**File:** `context/ThemeContext.tsx`  
**Problem:** `setPaletteFromThumbnail` and `resetPalette` are plain functions. `MusicContext.tsx` destructures both from `useTheme()` and uses them in a `useEffect` dependency array (line 121). Because they're new references every render, the thumbnail-palette effect fires on every render, repeatedly extracting colors from the same image.  
**Fix:** Wrap `setPaletteFromThumbnail` in `useCallback` (depends on nothing — `extractPaletteFromImage` is a module import and `setPalette` is a state setter which is stable). Wrap `resetPalette` in `useCallback` (depends on nothing — `getFallbackPalette` is a module import).

---

## 🟡 Moderate

### 5. `/login` route 404

**Observed:** The browser tab shows a 404 at `https://my-portfolio-ten-iota-uezn9vq1ge.vercel.app/login`.  
**Problem:** The login page lives at `/admin/login`, not `/login`. There is no `app/login/` directory. Any external link or bookmark pointing to `/login` will 404.  
**Fix:** Either create `app/login/page.tsx` that redirects to `/admin/login`, or add a `redirects` entry in `next.config.mjs`:
```js
async redirects() {
  return [{ source: '/login', destination: '/admin/login', permanent: true }];
}
```

---

### 6. `cursor: none` hides the native cursor on all fine-pointer devices

**File:** `styles/globals.css` — lines 55-59  
**Problem:** The `GlassCursor` component provides a custom cursor, but hiding the native cursor entirely (`cursor: none`) creates accessibility issues: users can't see where they're clicking during text selection, form input focus, or link hovering if the custom cursor component fails to render or lags.  
**Fix:** At minimum, keep `cursor: auto` on `input`, `textarea`, `select`, `a`, and `button` elements so interactive elements always show a native cursor. Alternatively, only apply `cursor: none` when the `GlassCursor` component has mounted and confirmed it's tracking.

---

### 7. No favicon or social preview assets

**Directory:** `public/`  
**Problem:** The `public` directory contains no favicon, no OG image, and no social preview card. The deployed site loads with the browser's default blank favicon. Social shares (Twitter, LinkedIn, Discord) will show no preview image.  
**Fix:** Add a `favicon.ico` (or `favicon.svg`) to `public/`. Add an OG image (`public/og.png`, recommended 1200×630). Update `app/layout.tsx` metadata to reference them:
```ts
export const metadata: Metadata = {
  // ...existing fields
  icons: { icon: '/favicon.ico' },
  openGraph: {
    images: [{ url: '/og.png', width: 1200, height: 630 }],
  },
};
```

---

### 8. Review form has no client-side rate limiting

**File:** `components/sections/Reviews.tsx`  
**Problem:** The review submission form calls `POST /api/reviews` with no throttling or debounce. A user could spam-click "Submit review" and send dozens of requests. The button is not disabled while the request is in flight.  
**Fix:** Disable the submit button while `status === "Sending review..."`. Add a simple `isSubmitting` state flag. Optionally debounce or add a cooldown.

---

## 🟢 Minor / Polish

### 9. Loading screen title flickers "Loading soundtrack..." even after track is ready

**File:** `context/MusicContext.tsx` — line 62  
**Problem:** `title` initializes as `"Loading soundtrack..."`. It only updates from the 400ms poll in `YouTubeEngine.tsx` after `getVideoData()` returns a real title. During the loading screen, the user briefly sees this placeholder. Since the `onReady` callback already has access to the player, the title could be set immediately.  
**Fix:** In `YouTubeEngine.tsx`, inside the `onReady` callback, call `syncTrack({ title: (player as ExtendedPlayer).getVideoData().title })` to set the title immediately on player ready.

---

### 10. `ExperienceShell` hard timeout could conflict with cookie dialog

**File:** `components/layout/ExperienceShell.tsx` — lines 51-65  
**Problem:** The 12-second hard timeout forces `phase` to `"none"` even if the cookie consent dialog is showing (`phase === "cookie"`). The check on line 57 only guards against `"loading"` and `"handoff"`, which is correct — but if the user hasn't decided yet and the timeout fires during a brief `"loading"` → `"handoff"` → `"cookie"` transition delay, the dialog could be skipped.  
**Fix:** Add `phase === "cookie"` to the early return at line 52, or ensure the timeout is cleared when `phase` transitions to `"cookie"`.

---

## File Reference

| File | Lines | Purpose |
|------|-------|---------|
| `components/music/YouTubeEngine.tsx` | 237 | YouTube IFrame API player boot, controls, poll loop |
| `context/MusicContext.tsx` | 259 | Music state, player controls, palette sync |
| `context/ThemeContext.tsx` | 83 | Dynamic color palette from thumbnail |
| `context/CookieContext.tsx` | 89 | Cookie consent state |
| `components/layout/ExperienceShell.tsx` | 111 | Loading → cookie → reveal orchestration |
| `components/music/MusicPlayer.tsx` | 106 | Floating music player widget |
| `components/layout/Footer.tsx` | 129 | Footer with music takeover |
| `components/sections/Reviews.tsx` | 149 | Guestbook with form submission |
| `styles/globals.css` | 152 | Global styles including cursor: none |
| `next.config.mjs` | 24 | Next.js config (no redirects currently) |
| `app/layout.tsx` | 38 | Root layout, metadata, fonts |
| `app/admin/login/page.tsx` | 17 | Admin login page |
| `app/admin/panel/page.tsx` | — | Admin panel page |
