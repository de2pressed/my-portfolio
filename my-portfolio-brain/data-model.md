# Data Model

## Source Of Truth

The portfolio uses two storage modes:

- Supabase when the environment is configured
- local in-memory fallback data when Supabase is not configured or a Supabase read fails

The fallback data lives in `lib/seed-data.ts` and is cloned into `lib/fallback-store.ts`.

## Core Types

Shared types are defined in `lib/types.ts`.

Important types:

- `SiteContentEntry`
- `SkillEntry`
- `ExperienceEntry`
- `ProjectEntry`
- `ReviewEntry`
- `AnalyticsEvent`
- `SettingEntry`
- `PortfolioData`
- `AnalyticsSummary`
- `ContentResource`

## Table And Field Shape

The Supabase schema is defined in `supabase/migrations/0001_portfolio_init.sql`.

Tables:

- `site_content`
- `skills`
- `experience`
- `projects`
- `reviews`
- `analytics_events`
- `settings`

Important fields:

- `site_content.content` is JSONB so it can store either strings or structured objects.
- `experience.description` is stored as JSONB array of strings.
- `projects.description` is stored as JSONB array of strings.
- `projects.tech_stack` is stored as a text array.
- `reviews.is_visible` controls what the public site can see.
- `analytics_events.metadata` stores arbitrary JSON payloads.

## Fallback Store Behavior

`lib/fallback-store.ts` creates a process-local store in `global.__portfolioFallbackStore__`.

This means:

- local preview mode can read and write content without Supabase
- changes persist only for the current Node process
- a restart resets the fallback state back to seeds

## Repository Layer

`lib/content-repository.ts` is the main data access layer.

It provides:

- `getPortfolioData()`
- `getPublicPortfolioData()`
- `getSettingValue()`
- `listResource()`
- `createResource()`
- `updateResource()`
- `deleteResource()`
- `listReviews()`
- `createReview()`
- `updateReview()`
- `deleteReview()`
- `storeAnalyticsEvent()`
- `getAnalyticsSummary()`

Behavior rules:

- If Supabase is configured and available, the repository uses the service client.
- If a Supabase read or write fails, the code falls back to seeded data.
- Public review reads filter out hidden reviews.
- Public pages only show reviews where `is_visible = true`.

## Seed Data

`lib/seed-data.ts` contains the canonical starter content for:

- hero text
- about copy
- location, email, phone
- education
- skills
- experience
- projects
- reviews
- settings

The default music URL is also defined there.

## Supabase Clients

`lib/supabase/server.ts` creates:

- a service role client for server-side data access
- an auth client for the login route

`lib/supabase/client.ts` creates a browser client for client-side Supabase usage if needed.

## Current Data Flow For Content Changes

Admin editors call the API routes, which then call the repository helpers, which then write to Supabase or the fallback store.

That chain is important:

- UI component
- API route
- repository helper
- storage backend

If a new field is added, update all four layers together.

