# Working Guide For Future Agents

## Where To Start

If you are continuing work in this repo, read in this order:

1. `README.md`
2. `architecture.md`
3. `data-model.md`
4. `routes-and-flows.md`
5. `working-guide.md`

## Safe Edit Checklist

- If you change a field in the data model, update `lib/types.ts`, `lib/seed-data.ts`, `supabase/migrations/0001_portfolio_init.sql`, `supabase/seed.sql`, and any admin editor that touches that field.
- If you change a route or redirect, check both the page file and any client navigation that points to it.
- If you change music behavior, review `context/MusicContext.tsx` and `components/music/YouTubeEngine.tsx` together.
- If you change theme or palette logic, review `context/ThemeContext.tsx` and the CSS custom properties in `styles/design-tokens.css` and `styles/globals.css`.
- If you change admin auth, review `lib/admin-session.ts`, `/api/admin/login`, `/api/admin/logout`, and the admin pages.

## Common Failure Modes

- Rebuilding the YouTube player on unrelated state updates.
- Breaking the fallback store by updating one layer but not the seeds or types.
- Forgetting to keep hidden reviews out of public reads.
- Forgetting that `/admin` and `/login` should both end up at `/admin/login`.
- Changing metadata without keeping `public/favicon.svg` and `public/og.png` in sync.
- Skipping the release note when a changelog item changes runtime behavior.

## Current Constraints And Conventions

- The project prefers the App Router and server components where possible.
- Client components are used only when browser APIs, local state, or motion are required.
- The public experience is intentionally visual and layered, so avoid replacing it with a plain default layout.
- Keep the glass UI and warm palette direction consistent unless the task is explicitly a rebrand.
- Prefer minimal, targeted changes over broad refactors.

## Commands That Matter

- `npm run dev` - start local development
- `npm run build` - verify the project still compiles
- `npm run lint` - run lint checks

If the shell is Windows PowerShell and `npm` is blocked, use `npm.cmd`.

## When A New Feature Is Added

Follow this order:

1. Extend or add the type in `lib/types.ts`.
2. Add seed data if the feature needs a default local preview state.
3. Update the repository layer.
4. Add or update the API route.
5. Add or update the UI component.
6. Run a build.

## Notes About The Existing Runtime Fixes

Do not reintroduce these problems:

- `components/music/YouTubeEngine.tsx` must stay stable across volume changes
- `context/MusicContext.tsx` and `context/ThemeContext.tsx` should keep stable callbacks
- `app/admin/page.tsx` should continue redirecting to `/admin/login`
- `app/login/page.tsx` should continue redirecting to `/admin/login`
- `release-notes-v1.0.4.md` records the latest implemented changelog items and version bump

## If You Need A Fast Mental Model

- `app/page.tsx` loads public data and renders the experience.
- `ExperienceShell` governs the user journey.
- `MusicContext` and `ThemeContext` drive the visual and audio system.
- `content-repository.ts` is the data access layer.
- `supabase/` is the canonical schema and seed source.
