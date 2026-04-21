# Initialize — Jayant Kumar Personal Portfolio Website

## Goal

Build the complete foundation of a deeply personal, music-driven, immersive portfolio website for Jayant Kumar — a DevOps-focused developer with a strong creative identity. This is not a template portfolio. It is a living art piece that breathes with music, shifts its palette with the currently playing track, and delivers a cinematic, premium browsing experience across both desktop and mobile. The website must be fully functional, fully styled, and production-ready by the end of this initialization.

---

## Refined Concept

The website is a single destination where Jayant presents his work, projects, skills, education, and personal identity — while immersing every visitor in a curated audiovisual experience. Music is always present. The background reacts to it. The color palette shifts with the thumbnail art of whatever is playing. Every transition is intentional, weighted, and satisfying enough that users change pages just to see the animation again.

The site is built on Next.js (App Router), deployed on Vercel, and backed by Supabase for all editable content, authentication, reviews, and analytics. The project is already connected to both Vercel and Supabase — all work must respect this existing infrastructure.

The public site is a single-page scroll experience containing all portfolio sections. Admin functionality lives in a separate route namespace, accessed through a hidden keyboard shortcut and protected by Supabase authentication. All portfolio content (about text, skills, experience entries, project entries, music URL) is stored in Supabase and editable from the admin panel — Jayant should never need to touch code to update his portfolio text.

### Design Language

The art direction is a hybrid of **glassmorphism** and **skeuomorphism**: frosted glass panels with tactile depth, soft light refraction, translucent overlays, and surfaces that feel physically present. The design must feel premium, polished, and intentional — never flat, never generic, never template-like.

### Music as Core Identity

Music is not a feature bolted onto the portfolio. It is the heartbeat of the entire experience. The background pulses subtly with the audio. The dominant colors of the YouTube thumbnail bleed into the overall palette, creating an ambient theatre effect. The footer transforms into a music-centric immersive zone as the user scrolls to the bottom. The music player is always accessible, always beautiful, and loaded before the user ever sees the site.

---

## Requirements

### Tech Stack

- **Framework:** Next.js with App Router (latest stable version).
- **Hosting:** Vercel (already connected).
- **Database, Auth, Storage:** Supabase (already connected).
- **Styling:** Tailwind CSS with a custom design-token layer using CSS custom properties.
- **Animation:** Framer Motion for page transitions and component-level motion; custom CSS keyframes for ambient and looping effects.
- **Music Source:** YouTube IFrame Player API — no self-hosted audio files.

### Environment & Configuration

- Environment variables must be configured for Supabase: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.
- A `.env.local` file must exist at the project root for local development.
- Vercel environment settings must mirror the same variables for production.

### Supabase Schema

The following tables must be created in Supabase to support all features:

**`site_content`** — Stores all editable text blocks for the public site.
- Fields: `id`, `section` (e.g., "about", "hero_tagline"), `content` (text/JSON), `updated_at`.
- Behavior: The admin panel reads and writes to this table. The public site reads from it.

**`skills`** — Stores the skill entries displayed on the public site.
- Fields: `id`, `name`, `category` (e.g., "Cloud & OS", "CI/CD & Version Control"), `icon` (optional), `sort_order`, `created_at`.

**`experience`** — Stores experience/project entries.
- Fields: `id`, `title`, `organization`, `date_range`, `description` (rich text or bullet-list JSON), `link` (optional), `sort_order`, `created_at`.

**`projects`** — Stores project showcase entries.
- Fields: `id`, `title`, `description`, `tech_stack` (array of strings), `link` (optional), `image_url` (optional), `sort_order`, `created_at`.

**`reviews`** — Stores visitor reviews/guestbook entries.
- Fields: `id`, `email`, `display_name`, `message`, `created_at`, `is_visible` (boolean, default true).

**`analytics_events`** — Stores anonymized analytics data.
- Fields: `id`, `event_type` (e.g., "page_view", "section_scroll", "session_start", "session_end"), `visitor_id` (cookie-based anonymous string, never personal data), `metadata` (JSON — page, section, duration, etc.), `created_at`.

**`settings`** — Stores global site settings managed by the admin.
- Fields: `id`, `key` (e.g., "music_url", "site_version"), `value` (text), `updated_at`.

### Placeholder Data

Seed the database (or hardcode as initial fallback) with the following data extracted from Jayant's resume:

**Identity:**
- Name: Jayant Kumar
- Location: Gurugram, India
- Email: jayantdahiya1204@gmail.com
- Phone: 9560573648

**Summary / About:**
DevOps-focused BCA undergraduate with hands-on experience building, automating, and deploying CI/CD pipelines, containerized applications, DevSecOps security scans, and monitoring solutions on AWS using Jenkins, Docker, Prometheus, and Grafana.

**Technical Skills:**
- Cloud & OS: AWS EC2, AWS IAM (basic), Ubuntu Linux 24.04
- CI/CD & Version Control: Jenkins (Declarative Pipelines), Git, GitHub
- Containers & DevSecOps: Docker, Docker Hub, SonarQube, Trivy, OWASP Dependency-Check, Docker Scout
- Monitoring & Observability: Prometheus, Node Exporter, Grafana
- Languages & Runtimes: Java 21, Node.js 25, JavaScript, Bash
- Tools: AWS CLI, systemd, NPM

**Projects:**
- Title: End-to-End DevSecOps CI/CD Pipeline – Zomato Clone
- Link: github.com/de2pressed/Zomato-devops-project.git
- Description bullets:
  - Designed and implemented an automated CI/CD pipeline for a Node.js application using Jenkins declarative pipelines.
  - Provisioned and configured AWS EC2 infrastructure including Linux services, networking, and port management.
  - Integrated SonarQube static code analysis and enforced quality gates before container image creation.
  - Implemented DevSecOps security scans using OWASP Dependency-Check, Trivy filesystem scans, and Docker Scout.
  - Containerized the application and automated Docker image build, tag, and push to Docker Hub.
  - Deployed the application as a Docker container on EC2 and validated runtime and port exposure.
  - Built a centralized monitoring stack by configuring Prometheus and Node Exporter as systemd services.
  - Integrated Jenkins and host metrics into Prometheus using custom scrape configurations.
  - Visualized infrastructure and CI/CD metrics using Grafana dashboards.
  - Used Java 21 and Node.js 25, adapting pipelines beyond tutorial-default runtime versions.

**Education:**
- Degree: Bachelor of Computer Applications (BCA)
- Institution: SAITM Gurugram (Affiliated to MDU)
- Duration: 2024–2027 (Expected)

**Additional:**
Comfortable with Linux environments, CI/CD workflows, DevSecOps practices, and monitoring-driven operations.

**Default Music URL:**
`https://www.youtube.com/watch?v=ZAz3rnLGthg&list=RDZAz3rnLGthg`

**Default Site Version:**
`v1.0.0`

---

## Folder Structure

Follow this structure strictly:

```
/
├── app/
│   ├── layout.tsx                  — Root layout: mounts all global providers, background, music engine, cursor
│   ├── page.tsx                    — Public homepage: single-page scroll with all portfolio sections
│   ├── admin/
│   │   ├── login/page.tsx          — Admin login page (themed, guarded)
│   │   └── panel/page.tsx          — Admin control panel (protected, full CRUD)
│   └── api/
│       ├── analytics/route.ts      — Analytics event ingestion endpoint
│       ├── reviews/route.ts        — Review CRUD (public POST, admin DELETE)
│       └── content/route.ts        — Content CRUD for admin edits
├── components/
│   ├── layout/
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   └── PageTransition.tsx
│   ├── ui/
│   │   ├── GlassCursor.tsx
│   │   ├── VersionBadge.tsx
│   │   └── GlassCard.tsx
│   ├── loading/
│   │   ├── LoadingScreen.tsx
│   │   └── CookieConsent.tsx
│   ├── music/
│   │   ├── MusicPlayer.tsx
│   │   ├── YouTubeEngine.tsx       — Hidden YouTube IFrame bridge
│   │   └── MusicContext.tsx        — Global music state provider
│   ├── background/
│   │   └── AmbientBackground.tsx   — Generative, music-reactive canvas
│   ├── sections/
│   │   ├── Hero.tsx
│   │   ├── About.tsx
│   │   ├── Skills.tsx
│   │   ├── Experience.tsx
│   │   ├── Projects.tsx
│   │   └── Reviews.tsx
│   └── admin/
│       ├── ContentEditor.tsx
│       ├── ReviewManager.tsx
│       ├── MusicLinkEditor.tsx
│       └── AnalyticsDashboard.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts               — Supabase browser client
│   │   └── server.ts               — Supabase server client (API routes)
│   ├── colorExtractor.ts           — Extracts dominant colors from YouTube thumbnails
│   ├── analytics.ts                — Client-side analytics event helpers
│   └── adminKeyListener.ts         — Keyboard shortcut detector for "de2pressed"
├── context/
│   ├── MusicContext.tsx
│   ├── ThemeContext.tsx             — Dynamic palette derived from thumbnail colors
│   └── CookieContext.tsx
├── hooks/
│   ├── useMusicFrequency.ts        — Normalized audio amplitude for background reactivity
│   └── useThemeColors.ts           — Current dynamic color palette
├── styles/
│   ├── globals.css
│   └── design-tokens.css           — CSS custom properties for the glassmorphism design system
├── public/
│   └── (static assets, fonts, favicon)
├── my-portfolio-brain/             — Living project documentation (do not modify contents)
└── .env.local
```

---

## UI / Experience Direction

### Overall Feel

The website must feel like stepping into a personal world — not visiting a webpage. The design language is rich, tactile, and immersive. Glass panels float over a breathing, music-reactive background. Elements have depth, shadow, and translucency. Nothing feels flat or mass-produced.

### Color Palette

- **Base palette:** Warm, bright, and livable. Colors that feel like home — something a person could stare at for hours. Not neon. Not corporate. Think soft amber, muted coral, warm ivory, gentle lavender, deep teal accents.
- **Dynamic palette:** The base palette is continuously influenced by the dominant colors extracted from the currently playing YouTube video's thumbnail. The effect should be ambient and theatre-like — as if the room lighting shifts with the album art. This affects backgrounds, glass tint, text accent colors, and border glows.
- **Implementation:** Extract 3–5 dominant colors from the YouTube thumbnail using a canvas-based color extraction approach. Map these to CSS custom properties that propagate through the design token system. Transitions between palettes must be smooth (at least 1–2 seconds of crossfade).

### Typography

Use a clean, modern sans-serif font family. The font should feel human and warm, not cold and technical. Consider pairing a geometric sans (for headings) with a humanist sans (for body). Load via Google Fonts or self-host for performance.

### Glass Cursor

A custom cursor that replaces the system default on desktop. The cursor is a small frosted glass circle — translucent, with a subtle blur and a faint border glow matching the current dynamic accent color. It must track the mouse position smoothly, with a very slight trailing ease (not laggy, just soft). On mobile, the cursor does not render. The cursor must never interfere with click targets, scrolling, or text selection.

### Version Badge

A small, unobtrusive text in the bottom-left corner of the viewport displaying the current site version (e.g., `v1.0.0`). It is always visible on the public site. It matches the glassmorphism style — frosted, translucent, with very subtle text. Tapping or hovering does nothing. It is purely informational.

---

## Feature Specifications

### 1. Loading Screen

**Behavior:**
- Appears every time the site is loaded or reloaded — not just the first visit.
- Covers the entire viewport. Nothing of the website is visible beneath or beside it.
- Displays a visually rich, art-forward loading animation that matches the glassmorphism/skeuomorphism identity of the site. This is not a spinner. It is an experience. Think: abstract shapes forming, glass panels assembling, particles converging, a cinematic reveal.
- During the loading screen, the YouTube music engine must be initialized and the audio must begin buffering. By the time the loading screen completes, the music must be ready to play with zero delay.
- The loading screen waits for: all critical assets loaded, music engine initialized, Supabase data fetched for the homepage.
- When everything is ready, the loading screen transitions out.

**First-visit flow (cookie consent needed):**
1. Loading screen plays its full animation.
2. A special, one-time-only transition animation transforms the loading screen into the cookie consent dialog. This transition must be distinct and memorable — it only ever happens once per user. It should feel like the loading screen is opening up, revealing the consent message within it, or morphing into a new form.
3. The cookie consent dialog appears. The website remains hidden behind it.
4. After the user accepts or rejects cookies, the consent dialog transitions out and the website is revealed.

**Returning-visit flow (cookie consent already handled):**
1. Loading screen plays its full animation.
2. Loading screen transitions directly into the website — no cookie dialog, no extra step.
3. The transition from loading screen to website must be different from the loading-to-cookie transition. It should feel like a smooth cinematic reveal — the loading screen dissolves, slides apart, or fades into the ambient background.

**Cookie consent specifics:**
- Only shown once per user, ever. Tracked via a cookie or localStorage flag.
- The dialog must clearly state that cookies are used purely to improve the website experience through anonymous data collection. No personal data is collected.
- Two options: Accept and Reject. Both dismiss the dialog and reveal the website. If accepted, analytics tracking begins. If rejected, no analytics events are recorded for that user.
- The dialog must match the glassmorphism theme — frosted glass panel, centered, with soft glow and premium typography.

### 2. Header

**Behavior:**
- Fixed to the top of the viewport on both desktop and mobile.
- Glassmorphism style: frosted, translucent backdrop with a subtle bottom border or glow.
- Contains Jayant's name or logo on the left and navigation links on the right.
- Navigation links correspond to the scroll sections on the homepage: About, Skills, Experience, Projects, Reviews. Clicking a link smooth-scrolls to that section.
- On mobile, the header collapses into a hamburger menu with a glass-panel slide-out or overlay menu. The mobile menu must not feel like an afterthought — it must be as polished as the desktop version.
- The header must never feel heavy or obstructive. It should soothe the eyes, not compete with the content. Thin, elegant, translucent.

### 3. Hero Section

**Behavior:**
- The first section visible after the loading screen / cookie consent flow.
- Full viewport height.
- Displays Jayant's name prominently, a tagline or summary, and a subtle downward scroll indicator.
- The hero text should have a staggered entrance animation — letters or words arriving in sequence with smooth easing.
- The ambient background is fully visible behind the hero. The hero content floats above it.
- The hero must feel personal, confident, and inviting. Not generic. Not template.

### 4. About Section

- Displays the about/summary text from Supabase (`site_content` table, section "about").
- Glassmorphism card presentation. The card should feel like a floating glass panel with depth.
- Smooth scroll-triggered entrance animation.

### 5. Skills Section

- Displays all skill entries from the `skills` table, grouped by category.
- Each skill can be shown as a tag, chip, or badge. The visual treatment should match the glass aesthetic — translucent, bordered, subtly glowing.
- Scroll-triggered stagger animation: skills appear in sequence as the user scrolls into view.

### 6. Experience Section

- Displays experience entries from the `experience` table.
- Timeline or card layout. Each entry shows title, organization, date range, and description.
- Glass card design with scroll-triggered entrance.

### 7. Projects Section

- Displays project entries from the `projects` table.
- Each project card shows title, description, tech stack tags, and an optional link.
- Cards should have hover effects (slight lift, glow intensification, parallax tilt).
- Scroll-triggered stagger entrance.

### 8. Reviews / Guestbook Section

**Public behavior:**
- Positioned at the very end of the main content, just above the footer.
- Displays approved reviews in a visually appealing layout (glass cards, masonry, or horizontal scroll).
- A "Leave a Review" button opens a form that asks for: display name, email, and message.
- Email is required for submission but is never displayed publicly.
- After submission, show a confirmation message. The review is stored in the `reviews` table with `is_visible = true` by default.

**Admin behavior:**
- In the admin panel, reviews are listed with full details (including email).
- Admin can delete (or toggle visibility of) any review.

### 9. Music Player

**Behavior:**
- Always visible in a bottom corner of the viewport (bottom-right preferred, but must not conflict with the version badge in the bottom-left).
- Compact by default. Shows the YouTube thumbnail (cropped to fit perfectly — no black bars, no letterboxing), the track title (if available from YouTube API), and playback controls: play/pause, next, previous, volume slider or toggle.
- "Powered by YouTube" text displayed subtly somewhere within or near the player.
- The player must match the glassmorphism theme: frosted glass panel, translucent, with the thumbnail blending into the glass surface.
- On mobile, the player must be smaller and touch-friendly but still fully functional. It must not obstruct critical content or navigation.

**Music engine:**
- Uses the YouTube IFrame Player API to play audio from a YouTube video or playlist link.
- The video link or playlist link is stored in the `settings` table (key: `music_url`) and is editable from the admin panel.
- The IFrame is hidden (off-screen or zero-size). Only the custom player UI is visible.
- Music begins loading during the loading screen so there is zero delay when the user first sees the site.
- The player must support: play, pause, next track (if playlist), previous track (if playlist), and volume control.

**Thumbnail extraction:**
- The currently playing video's thumbnail URL is extracted from the YouTube API.
- The thumbnail image is used both in the player UI and as the source for the dynamic color extraction that feeds into the ambient palette.

### 10. Music-Reactive Background

**Behavior:**
- A generative, abstract, full-viewport background canvas that runs behind all content.
- Reacts subtly to the music's audio signal — frequency data or amplitude. The reaction should be gentle, ambient, and atmospheric. Not a visualizer. Not a waveform. Think: slow-breathing particles, color washes shifting tempo, glass-like shapes pulsing almost imperceptibly.
- The background must never overpower content. It is always in the background layer, behind all glass panels and text.
- When no music is playing, the background should still display a calm, slowly animating abstract state.
- On lower-end devices or when performance is impacted, the background should gracefully degrade (reduce particle count, simplify animations, or fall back to a static gradient).

### 11. Footer — Immersive Music Takeover

**Behavior:**
- As the user scrolls to the bottom of the page and the footer comes into view, the music player transforms. It expands, takes over the footer area, and delivers a rich, immersive music experience.
- The footer zone becomes dominated by the album art (thumbnail), large playback controls, and atmospheric visual effects derived from the music and thumbnail palette.
- The transition from compact player to footer takeover must be smooth and scroll-driven. As the footer scrolls into view, the player progressively expands. As the user scrolls back up, it progressively collapses back to the compact corner player.
- The footer should also contain standard footer information: Jayant's name, a copyright line, and optionally social or contact links.
- This footer experience should feel like nothing the user has encountered before — a reason to scroll all the way down.

### 12. Page Transitions

**Behavior:**
- Navigating between distinctly different pages (e.g., public homepage → admin login, admin login → admin panel) triggers a cinematic page transition animation.
- The transition should be satisfying enough that users want to navigate just to see it again. Think: glass panels shattering and reassembling, content sliding through dimensional layers, a morphing curtain effect.
- The transition must not be slow. It must feel swift yet substantial — around 600–900ms total.
- Within the public homepage, section-to-section scrolling does not trigger page transitions. Sections animate into view via scroll-triggered entrance animations.

### 13. Admin Keyboard Shortcut

**Behavior:**
- On the public website, a global keyboard listener silently listens for the sequence `d-e-2-p-r-e-s-s-e-d` typed in order, without any input field focused.
- When the full sequence is detected, the user is navigated to the admin login page (`/admin/login`) with a page transition.
- There is no visible hint, button, or link to the admin section anywhere on the public site. It is completely invisible.
- On mobile, provide no alternative access method on the public site. The admin login URL can be navigated to directly if known, but it must never be discoverable from the public UI.

### 14. Admin Login Page

**Behavior:**
- A standalone page at `/admin/login`.
- Themed to match the glassmorphism identity of the site. It should feel like a secure, premium gateway — not a generic login form.
- Authenticates against Supabase Auth (email + password). Only one admin account exists (Jayant's).
- On successful login, redirect to `/admin/panel` with a page transition.
- On failed login, show an error message within the themed UI. No generic browser alerts.
- If an already-authenticated admin visits this page, redirect them directly to the panel.

### 15. Admin Control Panel

**Behavior:**
- A protected page at `/admin/panel`. If an unauthenticated user accesses this URL, they are redirected to `/admin/login`.
- The panel provides full CRUD control over all Supabase content tables:
  - **Content Editor:** Edit all `site_content` entries (about text, hero tagline, etc.).
  - **Skills Manager:** Add, edit, reorder, and delete skills.
  - **Experience Manager:** Add, edit, reorder, and delete experience entries.
  - **Projects Manager:** Add, edit, reorder, and delete project entries.
  - **Review Manager:** View all reviews (including email), delete reviews, toggle visibility.
  - **Music Link Editor:** View and update the YouTube music URL/playlist link stored in `settings`.
  - **Analytics Dashboard:** Display aggregated stats — total visits, unique visitors, average session duration, most viewed sections, recent activity. All derived from the `analytics_events` table. No personal data is ever displayed.
- The panel's design should match the overall site identity — glassmorphism, premium feel — but optimized for utility and usability. It is a control room, not a gallery.
- Include a "Logout" action that destroys the Supabase session and redirects to the public homepage.

### 16. Analytics System

**Behavior:**
- When cookies are accepted, the client tracks the following events and sends them to the `/api/analytics` endpoint, which inserts into the `analytics_events` table:
  - `session_start` — when the user first loads the site.
  - `session_end` — when the user leaves (via `beforeunload` or visibility change).
  - `page_view` — on initial load and any in-app navigation.
  - `section_scroll` — when a portfolio section scrolls into view.
- Each event includes a `visitor_id` — an anonymous, cookie-based UUID generated on first visit. This is not tied to any personal information.
- No analytics events are recorded if cookies were rejected.
- The admin dashboard aggregates this data to show meaningful stats without exposing individual user behavior.

---

## Behavioral Rules

1. **Nothing is visible until the loading screen completes.** The website content, header, footer, background, and music player are all hidden until the loading flow finishes.
2. **Cookie consent blocks the website exactly once.** After the first decision (accept or reject), the consent dialog never appears again for that user.
3. **The music player persists across all interactions.** It does not reset, pause, or restart when scrolling, navigating, or interacting with any part of the site (except explicit player controls).
4. **The dynamic color palette updates whenever the playing track changes.** The transition between palettes must be smooth, never jarring.
5. **All admin routes are protected.** Accessing `/admin/panel` without authentication always redirects to `/admin/login`.
6. **All editable content is served from Supabase.** No portfolio text is hardcoded in components after initialization. The placeholder data should be seeded into Supabase and read from there.
7. **The site must be fully responsive.** Every feature — music player, glass cursor (hidden on mobile), header, footer, sections, loading screen, cookie consent, admin panel — must work correctly and look premium on both desktop and mobile viewports.
8. **Performance matters.** The music-reactive background should not cause frame drops. Use `requestAnimationFrame`, canvas optimizations, and graceful degradation as needed.

---

## Edge Cases

- **YouTube video unavailable or restricted:** If the configured YouTube URL fails to load, the music player should display a graceful "Music unavailable" state. The background should fall back to its calm, non-reactive default animation. The color palette should use the base palette without dynamic influence.
- **Supabase unreachable:** If Supabase is temporarily down, the public site should still render with cached or fallback content where possible. The admin panel should show a clear error state.
- **No cookies / localStorage disabled:** If the browser blocks cookies, the cookie consent dialog should still appear, but analytics tracking should be silently disabled regardless of the user's choice.
- **Admin shortcut collision:** If the user is typing in an input field (e.g., the review form), the admin keyboard shortcut listener must not trigger. It only activates when no input element is focused.
- **Multiple tabs:** The music player should handle multiple tabs gracefully. If the user opens the site in a second tab, the music should not play in both — either pause in the background tab or let the browser's native autoplay policy handle it.
- **Extremely long review messages:** Truncate display with a "read more" expansion. Do not let a single review break the layout.
- **Empty states:** If there are no skills, no experience, no projects, or no reviews — each section should display a graceful empty state rather than a blank void. Something like "More coming soon" in a subtle glass card.

---

## Integration Notes

- **Supabase client initialization** must use the environment variables from `.env.local` (or Vercel env). The browser client uses the anon key. API routes use the service role key for admin operations.
- **YouTube IFrame API** must be loaded asynchronously and initialized during the loading screen. The hidden iframe must persist at root layout level.
- **Framer Motion** should handle page transitions via `AnimatePresence` wrapping the page content in the root layout.
- **The ambient background canvas** must be mounted at the root layout level, beneath all other content, and must never unmount during navigation.
- **The music context** must be at the root layout level so the player state is globally accessible.
- **The theme context** must be at the root layout level so the dynamic palette is available to every component through CSS custom properties.
- **The cookie context** must be at the root layout level and must gate the analytics system.

---

## Acceptance Criteria

The feature is complete when:

1. Running `npm run dev` serves a fully functional portfolio website locally.
2. The loading screen appears on every page load with a rich, themed animation.
3. First-time visitors see a cookie consent dialog after the loading screen, with a unique transition animation.
4. Returning visitors skip the cookie dialog and go straight from loading screen to the website.
5. The public homepage displays all portfolio sections (Hero, About, Skills, Experience, Projects, Reviews) in a single-page scroll layout with scroll-triggered entrance animations.
6. The header is fixed, translucent, glassmorphic, and responsive — with a mobile hamburger menu.
7. The music player loads a YouTube video/playlist, plays audio, shows the thumbnail (no black bars), displays playback controls, and works on both desktop and mobile.
8. The background canvas reacts subtly and continuously to the music's audio signal.
9. The dominant colors from the YouTube thumbnail dynamically influence the site's color palette with smooth transitions.
10. The footer transforms into an immersive music experience as it scrolls into view, then collapses back when scrolling up.
11. A custom frosted-glass cursor replaces the system cursor on desktop (hidden on mobile).
12. The version badge (`v1.0.0`) is visible in the bottom-left corner.
13. Typing `de2pressed` on the keyboard (while no input is focused) navigates to the admin login page.
14. The admin login page authenticates against Supabase and redirects to the admin panel on success.
15. The admin panel provides full CRUD for: content, skills, experience, projects, reviews, music URL, and displays analytics.
16. Page transitions between routes are cinematic, smooth, and satisfying.
17. The review section allows visitors to submit reviews (with email), and reviews appear on the public site.
18. Analytics events are recorded when cookies are accepted, and the admin dashboard shows aggregated stats.
19. The entire site is responsive and looks premium on mobile.
20. All portfolio content is served from Supabase — nothing is hardcoded after initial seeding.

---

## Notes for Codex

- This is the full initialization prompt. Build everything described above from scratch — the project directory currently contains no application code.
- Read the `my-portfolio-brain/` documentation folder for architectural decisions and project identity context, but do not modify those files.
- Use the placeholder data from the resume to seed all content.
- The music URL to use by default is: `https://www.youtube.com/watch?v=ZAz3rnLGthg&list=RDZAz3rnLGthg`
- The admin keyboard shortcut sequence is the string `de2pressed` — the letters d, e, 2, p, r, e, s, s, e, d typed in order.
- The site version to display is `v1.0.0`.
- Prioritize visual polish and premium feel. This is a personal art project, not a corporate site. Every pixel matters.
- Do not cut corners on animation. Transitions, entrances, hovers, and the loading screen animation are core to the identity.
- The glass cursor, music player, ambient background, and footer takeover are non-negotiable features — they are what make this portfolio unique.
- When in doubt about a design decision, choose the option that feels more immersive, more personal, and more cinematic.
