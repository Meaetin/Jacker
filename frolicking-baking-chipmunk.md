# Job Application Tracker — Project Scaffolding Plan

## Context
Building a Job Application Tracker MVP as a Next.js fullstack app. The user wants to deploy it on Vercel with a demo account for interviewers. The spec is in `job-application-tracker-mvp.md`. This plan covers scaffolding the entire project structure with all files in place — empty shells for later implementation.

## Architecture
- **Next.js 15 App Router** (frontend + API routes, no separate backend)
- **Supabase Cloud** (Postgres + Auth + RLS)
- **OpenAI gpt-4o-mini** (AI email parsing)
- **Gmail API** (email ingestion via Vercel Cron)
- **Tailwind v4** (CSS-first config, semantic component classes)
- **Deploy target: Vercel** with cron for polling

## Project Structure

```
job-tracker/
├── .env.example
├── .gitignore
├── next.config.ts
├── package.json
├── postcss.config.mjs
├── tsconfig.json
├── vercel.json                          # Vercel cron config
├── middleware.ts                         # Supabase auth session refresh
│
├── supabase/
│   ├── config.toml
│   ├── migrations/
│   │   ├── 00001_create_raw_emails.sql
│   │   ├── 00002_create_applications.sql
│   │   ├── 00003_create_parse_logs.sql
│   │   ├── 00004_create_user_tokens.sql
│   │   └── 00005_enable_rls.sql
│   └── seed-demo.sql                    # Pre-seeded fake data for demo account
│
└── src/
    ├── app/
    │   ├── globals.css                  # Tailwind v4 + @theme tokens + semantic component classes
    │   ├── layout.tsx                   # Root layout (html, body, fonts, metadata)
    │   ├── page.tsx                     # Landing: redirect to /dashboard or /login
    │   │
    │   ├── login/
    │   │   ├── page.tsx                 # Email/password login form
    │   │   └── actions.ts              # Server actions: login, signup
    │   │
    │   ├── demo-login/
    │   │   ├── page.tsx                 # "Try Demo" button page
    │   │   └── actions.ts              # Server action: sign in as demo user
    │   │
    │   ├── auth/
    │   │   └── confirm/
    │   │       └── route.ts            # Email confirmation callback
    │   │
    │   └── dashboard/
    │       ├── layout.tsx              # Dashboard shell (sidebar, auth guard, demo banner)
    │       ├── page.tsx                # Main application list/table + filters
    │       ├── loading.tsx             # Skeleton loader
    │       └── [id]/
    │           ├── page.tsx            # Application detail view
    │           └── edit/
    │               └── page.tsx        # Edit form for manual corrections
    │
    ├── components/
    │   ├── application-table.tsx
    │   ├── application-card.tsx
    │   ├── status-badge.tsx
    │   ├── confidence-bar.tsx
    │   ├── filter-bar.tsx
    │   ├── application-form.tsx
    │   ├── email-source.tsx
    │   ├── parse-log-panel.tsx
    │   ├── demo-banner.tsx
    │   ├── nav-sidebar.tsx
    │   └── ui/
    │       ├── button.tsx
    │       ├── input.tsx
    │       ├── select.tsx
    │       ├── textarea.tsx
    │       ├── skeleton.tsx
    │       ├── card.tsx
    │       └── dialog.tsx
    │
    ├── lib/
    │   ├── gmail/
    │   │   ├── client.ts               # Gmail API client init
    │   │   ├── fetch-emails.ts         # Fetch recent emails via search queries
    │   │   └── parse-raw.ts            # Decode Gmail API payload → GmailMessage
    │   │
    │   ├── filter/
    │   │   ├── job-keywords.ts         # Keyword + ATS domain lists
    │   │   └── is-job-related.ts       # Pre-filter: boolean check before AI parsing
    │   │
    │   ├── parser/
    │   │   ├── openai-client.ts        # OpenAI client init
    │   │   ├── prompt.ts               # System prompt + prompt version
    │   │   ├── parse-email.ts          # Call OpenAI → validate with Zod → return result
    │   │   └── parse-log.ts            # Write parse_logs records
    │   │
    │   ├── ingest/
    │   │   ├── store-raw-email.ts      # Insert raw_emails (dedup by gmail_message_id)
    │   │   ├── match-application.ts    # Find existing app by thread_id or company+role
    │   │   ├── upsert-application.ts   # Insert or update application from parse result
    │   │   └── pipeline.ts            # Orchestrator: fetch → filter → parse → store
    │   │
    │   └── db/
    │       ├── applications.ts         # CRUD queries for applications
    │       ├── raw-emails.ts           # Query helpers for raw_emails
    │       └── parse-logs.ts           # Query helpers for parse_logs
    │
    ├── types/
    │   ├── application.ts              # ApplicationStatus, Application, ApplicationWithSource
    │   ├── email.ts                    # RawEmail, GmailMessage
    │   ├── parse-result.ts            # AIParseResult, EmailType
    │   └── schemas.ts                  # Zod schemas (single source of truth for validation)
    │
    └── utils/
        ├── supabase/
        │   ├── client.ts              # Browser Supabase client
        │   ├── server.ts              # Server Supabase client (cookies)
        │   ├── middleware.ts           # updateSession helper for middleware
        │   └── admin.ts               # Service-role client (seed scripts only)
        ├── cn.ts                       # clsx + tailwind-merge wrapper
        └── date.ts                     # Date formatting helpers
```

## Key Decisions Beyond the Spec

1. **`user_id` on every table** — Spec didn't include it, but it's required for Supabase RLS and demo account isolation. Added to `raw_emails`, `applications`, `parse_logs`.

2. **`user_tokens` table** — Stores Gmail OAuth refresh tokens per user. Not in the spec, but needed for multi-user readiness and cleaner than env-var-only approach.

3. **API routes** — Mapped to the spec's routes but adapted for Next.js App Router:
   - `POST /api/emails/ingest` → manual trigger
   - `GET /api/cron/ingest` → Vercel Cron scheduled trigger (every 10 min)
   - `GET /api/applications` → list with filters
   - `GET/PATCH /api/applications/[id]` → single app + edits

4. **Tailwind v4** — CSS-first config in `globals.css` with `@theme` tokens. Semantic component classes (`.card`, `.btn-primary`, `.status-badge-applied`) defined in `@layer components`. No separate `tailwind.config.ts`.

5. **Demo account** — Pre-seeded via `seed-demo.sql` with ~15 fake applications across all statuses. Demo user authenticates via `/demo-login` with a "Try Demo" button. Dashboard shows a banner indicating demo mode. Demo account cannot trigger Gmail ingestion.

## Dependencies

```
next@^15.3, react@^19, react-dom@^19
@supabase/supabase-js@^2.49, @supabase/ssr@^0.6
openai@^4.90, googleapis@^144
zod@^3.24, clsx@^2.1, tailwind-merge@^3.0
tailwindcss@^4.2, @tailwindcss/postcss@^4.2
```

## Implementation Order

1. **Scaffold** — `create-next-app`, install deps, create all files as shells
2. **Types + schemas** — Define TypeScript types and Zod schemas first (everything depends on these)
3. **Database** — Write all migration SQL files
4. **Supabase utils** — Client/server/admin factories + middleware helper
5. **DB queries** — `src/lib/db/` query functions
6. **Gmail + filter + parser** — `src/lib/gmail/`, `src/lib/filter/`, `src/lib/parser/`
7. **Ingest pipeline** — `src/lib/ingest/` orchestration
8. **API routes** — Thin wrappers over lib functions
9. **Components** — UI building blocks
10. **Pages** — Dashboard, login, demo-login, detail, edit views
11. **Seed data** — `seed-demo.sql` with fake applications
12. **Config** — `vercel.json`, `middleware.ts`, env vars, `.gitignore`

## Verification
- `npm run dev` starts without errors
- `npm run build` completes successfully
- All TypeScript types resolve (no `any` leaks)
- Database migrations run cleanly on Supabase Cloud via SQL editor
- Demo seed data inserts without constraint violations
