# QuestUp

Turn your real-world tasks into a character sheet. QuestUp is a gamified productivity web app that translates everyday tasks into an RPG progression system — complete quests, level up attributes, build streaks, and earn rewards — with a server-enforced timer system that keeps the progression honest.

Built for the [Hackathon Name] problem statement (QuestUp), two-round format: 24-hour online build round + offline round.

---

## Live Demo

- **Live URL:** _TBD_
- **Walkthrough video:** _TBD_

---

## Overview

Traditional to-do lists suffer from delayed gratification — the payoff for reading, studying, or working out takes weeks to show up. Life RPG closes that gap with instant feedback: every completed task grants XP, levels up a relevant character attribute, and contributes to a weekly streak.

To prevent users from gaming their own progress, task completion is **timer-gated**: a task can't be marked complete until a self-assigned timer has actually run its course, and this is enforced server-side, not just in the UI.

### Theme

Minimalist "Guild Hall / Character Sheet" — dark charcoal palette with an amber/gold accent, ledger-style cards, clean typography. The app reads like a formal character sheet rather than a game HUD.

---

## Core Features (MVP)

- **Authentication & Security** — Google OAuth via Supabase Auth; Row-Level Security ensures users can only read/write their own data.
- **Database & CRUD** — Supabase (Postgres) backing Users, Tasks, Streaks, and Attributes, with full create/read/update/delete on tasks.
- **Streaks, Attributes & Points** — weekly consistency tracking, per-attribute XP (e.g. Coding → Intellect), and a points/currency system. All XP and streak updates are computed and applied server-side.
- **Non-linear leveling** — XP required per level increases with each level (`xpToNextLevel = base * level^1.5`).
- **Timer-gated task completion** — users set their own timer duration on a task; the complete action is rejected by the server until that duration has genuinely elapsed since the timer started, preventing fake streaks/points.
- **User search** — look up other users by username or public user ID.
- **Bot protection** — Cloudflare Turnstile verification gates the signup flow before any account is created.
- **Registration disclaimer** — shown once as a popup on first sign-up, tracked via an acceptance timestamp so it never reshows.
- **Responsive & accessible UI** — mobile-to-desktop layouts, full keyboard navigation, semantic HTML.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend |React , TailwindCSS  |
| Backend / API | Node JS | 
| Database & Auth | Supabase (Postgres, Row-Level Security, Supabase Auth) |
| Bot protection | Cloudflare Turnstile |
| Hosting |Vercel|

---

## Architecture Notes

- **Auth flow:** Frontend calls Supabase's `signInWithOAuth`/email signup directly; the backend never re-implements session management. Every protected backend request verifies the Supabase-issued JWT, and Postgres RLS policies (`auth.uid()`) act as the real access-control backstop.
- **Anti-cheat:** XP, streak, and level updates are never accepted as client-supplied values — they are calculated and written server-side in response to validated task-completion events.
- **Timer enforcement:** `timer_started_at` and `timer_duration` are persisted in the database (not local state), so the timer survives refreshes/disconnects, and the completion endpoint independently checks elapsed time before allowing a task to be marked done.

---

## Database Schema (high level)

- `users` — id, username, display_name, avatar, level, total_xp, points, disclaimer_accepted_at
- `tasks` — id, user_id, title, attribute_type, status, timer_started_at, timer_duration, completed_at
- `streaks` — user_id, date, completed_bool
- `attributes` — user_id, attribute_name, attribute_xp

All tables have Row-Level Security enabled, scoped to `user_id = auth.uid()`, with a narrower public-read policy on `users` (username, level, avatar only) to support user search.

---

## Getting Started

### Prerequisites

- Node.js (version _TBD_)
- A Supabase project
- A Cloudflare Turnstile site (site key + secret key)

### Setup

1. Clone the repository
   ```bash
   git clone <repo-url>
   cd iitbbsr
   ```
2. Install dependencies
   ```bash
   npm install
   ```
3. Copy the environment template and fill in your values
   ```bash
   cp .env.example .env
   ```
4. Run the Supabase migrations / schema setup
   ```bash
   # instructions TBD once migrations are added
   ```
5. Start the development server
   ```bash
   npm run dev
   ```


```

---

## Project Structure

```
/iitbbsr
├── frontend/         # UI (TBD framework)
├── backend/          # API routes, auth middleware, XP/timer logic
├── supabase/         # schema, migrations, RLS policies
├── .env.example
└── README.md
```

---



---

## Disqualification Checklist (self-audit before submission)

- [ ] Repo is public with 3+ chronological commits
- [ ] Backend code is included in the repo
- [ ] Live URL works in a clean/incognito session
- [ ] Data persists after a hard refresh (not localStorage-only)
- [ ] No unhandled runtime exceptions on basic usage
- [ ] Walkthrough video is public, under 100MB, 90–180 seconds, and shows signup/login → add/complete task → level up → refresh to prove persistence