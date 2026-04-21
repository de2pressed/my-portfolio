# My Portfolio

Next.js App Router portfolio optimized for Vercel, with Supabase handling content, auth, analytics, and reviews.

## Stack

- `Next.js` App Router
- `Supabase` for Postgres, Auth, and server-side data access
- `YouTube IFrame API` as the only music playback source
- `GSAP` for motion
- `CSS Modules` and design tokens for the glass / skeuomorphic UI

## Local Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Create `.env.local` from `.env.example` and fill in the Supabase values.
3. Start the app:
   ```bash
   npm run dev
   ```
4. Optional checks:
   ```bash
   npm run build
   npm run lint
   ```

## Environment Variables

Required for full Supabase functionality:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_ADMIN_EMAIL=
```

- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are used by the browser and auth session flow.
- `SUPABASE_SERVICE_ROLE_KEY` is server-only and unlocks content/admin mutations from route handlers.
- `SUPABASE_ADMIN_EMAIL` is the single Supabase account allowed to enter the admin surface.

If the Supabase variables are missing, the app falls back to the local JSON content snapshot so the UI still boots.

## Supabase Setup

1. Create a Supabase project.
2. Copy the project URL, anon key, and service role key into `.env.local` and your Vercel environment variables.
3. Apply the schema:
   ```bash
   supabase login
   supabase link --project-ref <project-ref>
   supabase db push
   ```
4. Load the seed data:
   ```bash
   supabase db reset
   ```
   or run the statements in [`supabase/seed.sql`](./supabase/seed.sql) against the database.

The schema is defined in [`supabase/migrations/0001_init.sql`](./supabase/migrations/0001_init.sql).

## Vercel Deployment

1. Import the repository into Vercel.
2. Set the environment variables listed above in the Vercel project settings.
3. Use the default build command:
   ```bash
   npm run build
   ```
4. Keep the remote image allowlist aligned with:
   - `img.youtube.com`
   - `i.ytimg.com`
   - `images.unsplash.com`

## Routes

- `/` public portfolio
- `/works/[slug]` work detail page
- `/admin-login` hidden admin entry
- `/admin` protected dashboard

The hidden admin trigger is the keyboard sequence `de2pressed`. It only reveals the login surface; Supabase auth still gates access.

## Version Badge

- The bottom-left badge is controlled by `src/lib/version.js`.
- Current display version: `ver 1.02`.
- Increase it by `0.01` for each new changelog.

## Source Notes

- Project brain: [`my-portfolio-brain/00_PROJECT_BRAIN.md`](./my-portfolio-brain/00_PROJECT_BRAIN.md)
- Bootstrap prompt: [`codex-prompts/00_INIT.md`](./codex-prompts/00_INIT.md)
