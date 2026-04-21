# Routes And Flows

## Route Map

- `/` - public homepage
- `/admin` - redirect to `/admin/login`
- `/login` - redirect to `/admin/login`
- `/admin/login` - admin login page
- `/admin/panel` - protected admin control panel

API routes:

- `/api/admin/login`
- `/api/admin/logout`
- `/api/content`
- `/api/reviews`
- `/api/analytics`

## Public Page Flow

1. `app/page.tsx` calls `getPublicPortfolioData()`.
2. `components/sections/PublicHome.tsx` renders the section stack.
3. `AppProviders` installs theme, cookie, and music state.
4. `ExperienceShell` controls loading, consent, and reveal timing.
5. `YouTubeEngine` boots the soundtrack and registers player controls.
6. `ThemeContext` extracts the active palette from the track thumbnail.
7. `Footer` uses scroll position to trigger the music takeover.

## Public Analytics Flow

When analytics consent is accepted:

1. `PublicHome` tracks session start and page view.
2. The intersection observer records section scroll events.
3. Visibility changes and unload events record session end.
4. `/api/analytics` stores the events.

If consent is not accepted, the analytics calls stay disabled.

## Music Flow

1. `MusicProvider` loads the configured music URL from `/api/content?resource=settings&key=music_url`.
2. `YouTubeEngine` loads the YouTube IFrame API.
3. On ready, it sets track info, volume, and the control methods.
4. The polling loop updates title, video id, and visual level.
5. `MusicPlayer` and `Footer` read the shared music context.

Important detail:

- the player effect must not depend on volume directly
- volume is mirrored into a ref so the effect does not rebuild the player

## Admin Login Flow

1. `AdminLoginForm` submits email and password to `/api/admin/login`.
2. The route checks Supabase Auth when configured.
3. In local preview mode it checks `DEMO_ADMIN_EMAIL` and `DEMO_ADMIN_PASSWORD`.
4. A signed cookie is written on success.
5. The form redirects to `/admin/panel`.

## Admin Panel Flow

1. `app/admin/panel/page.tsx` calls `getAdminSession()`.
2. If the session is missing, the route redirects to `/admin/login`.
3. If the session exists, the page loads `getPortfolioData()` and `getAnalyticsSummary()`.
4. `AdminPanel` renders the editing modules.

## Content Editing Flow

`/api/content` supports:

- `GET` - public or admin reads
- `POST` - create resource entry, admin only
- `PUT` - update resource entry, admin only
- `DELETE` - delete resource entry, admin only

Resources:

- `site_content`
- `skills`
- `experience`
- `projects`
- `settings`

## Review Flow

Public submission:

1. `Reviews` posts to `/api/reviews`.
2. The API validates the form fields.
3. The review is created with `is_visible = true`.

Admin moderation:

- `ReviewManager` sends `PATCH` to toggle visibility
- `ReviewManager` sends `DELETE` to remove a review

## Settings Flow

`MusicLinkEditor` updates `music_url` and `site_version` through `/api/content?resource=settings`.

After saving the music URL, the component dispatches a `portfolio:music-url-updated` event so the music context can load the new track immediately.

