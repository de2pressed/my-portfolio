# My Portfolio Brain

This folder is the handoff pack for the portfolio project. It is written so another AI agent can read it, understand the system, and continue working without reverse-engineering the repo from scratch.

Start here, then read the linked docs in order:

1. [Release notes v1.0.1](./release-notes-v1.0.1.md)
2. [Project overview](./project-overview.md)
3. [Architecture](./architecture.md)
4. [Data model](./data-model.md)
5. [Routes and flows](./routes-and-flows.md)
6. [File map](./file-map.md)
7. [Working guide](./working-guide.md)

## One-Screen Summary

- The app is a Next.js App Router portfolio with a public experience and a protected admin area.
- Public content is rendered from a portfolio data layer that can read from Supabase or fall back to local seeded data.
- The public site includes a music engine driven by the YouTube IFrame API, a palette derived from the current track thumbnail, cookie consent, analytics tracking, and a footer music takeover.
- Admin pages let you edit content, manage collections, moderate reviews, update the music URL, and inspect analytics.
- Current release: `v1.0.1`
- The repo already includes fixes for the important runtime issues noted in the changelog:
  - `/admin` now redirects to `/admin/login`
  - `/login` now redirects to `/admin/login`
  - the YouTube player no longer gets rebuilt on every volume change
  - social metadata points at local preview assets

## Current Repo Structure

The important directories are:

- `app/` - route handlers, pages, and the root layout
- `components/` - UI, layout, music, admin, loading, and section components
- `context/` - theme, cookie, and music state providers
- `lib/` - data access, Supabase clients, utilities, seeded data, and shared types
- `styles/` - global CSS and design tokens
- `supabase/` - schema migration and seed SQL
- `public/` - favicon and social preview assets

## How To Continue Safely

- Read `architecture.md` before changing the runtime shell, music, or palette systems.
- Read `data-model.md` before changing content fields or Supabase tables.
- Read `routes-and-flows.md` before touching any page, redirect, or API route.
- Read `working-guide.md` before starting a new feature or refactor.

## Build And Check

- `npm run dev` starts local development.
- `npm run build` verifies the app compiles and type checks.
- If PowerShell blocks `npm`, use `npm.cmd` on Windows.
