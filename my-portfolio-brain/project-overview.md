# Project Overview

Current release: `v1.0.3`

## What This Project Is

This is a music-driven personal portfolio for Jayant Kumar.

The public site is intentionally immersive. It combines:

- a cinematic loading and consent flow
- a dark glass and ambient visual system
- a YouTube-backed soundtrack player
- dynamic palette extraction from the current track thumbnail
- public reviews and section analytics
- a custom pointer cursor and footer takeover that stay visible above overlays

The admin area is a protected control room for editing the content that appears on the public site.

## Primary Product Goals

- Present the portfolio as an experience, not a plain resume.
- Let content be editable without changing the React components.
- Work with Supabase when configured, but still run locally with seeded fallback data.
- Keep the music, color palette, and footer takeover linked to the current track.
- Keep the theme darker and the glass surfaces more transparent than the earlier warm variant.

## Tech Stack

- Next.js App Router
- React 18
- Tailwind CSS
- Framer Motion
- Supabase
- YouTube IFrame API

## Public Experience

The public homepage is built from these sections:

- Header
- Hero
- About
- Skills
- Experience
- Projects
- Reviews
- Footer

The public route loads portfolio data through `getPublicPortfolioData()`, which filters reviews so only visible entries appear.

## Admin Experience

The admin panel can:

- edit site copy in `site_content`
- create, edit, and delete skills, experience, and projects
- moderate reviews
- update the music URL and site version
- inspect anonymous analytics

The admin area uses a cookie-backed session and server-side route protection.

## What Makes The App Stateful

The app is not stateless React UI.

Important state comes from:

- cookie consent stored in localStorage
- music engine readiness and playback state
- thumbnail-derived palette state
- footer takeover progress driven by scroll
- analytics opt-in and event collection
- Supabase data when available, otherwise fallback store data
