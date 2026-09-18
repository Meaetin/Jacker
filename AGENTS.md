# Job Tracker

A personal AI job application tracker. It reads job-related email from Gmail, extracts
structured application data, and keeps the pipeline up to date without manual entry.
Next.js App Router, TypeScript, Tailwind v4, Supabase. See `README.md` for the feature tour.

## Running it

npm, with `package-lock.json`. Copy `.env.example` to `.env` first.

| Command | What it does |
|---|---|
| `npm run dev` | Dev server on Turbopack, with a raised HTTP header limit for Gmail payloads |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint |
| `npm run verify:autofill` | Checks the extension's autofill field dictionary (no browser needed) |

## Layout

- `src/app/` — routes. `(app)/` is the signed-in area, `api/` the route handlers, `auth/` the Supabase callback.
- `src/lib/` — the domain code: `gmail/`, `ingest/`, `filter/`, `parser/`, `ai/`, `db/`, `profile/`, `kanban/`.
- `src/components/`, `src/hooks/`, `src/utils/`, `src/types/` — UI and shared helpers.
- `chrome-extension/` — the browser extension (background, content script, popup, bridge)
  and `autofill/`, the form-filling engine, field matcher and per-ATS adapters.
- `supabase/` — `migrations/` and demo seed data.
- `graphify-out/` — generated knowledge graph, see below.

## Detail docs

- [Design system](docs/design-system.md) — **read before writing any UI.** Warm/organic
  identity, colour tokens, the required class-naming rule, and the Tailwind v4 layer trap.
- [Codebase graph](docs/codebase-graph.md) — query `/graphify` before grepping for code.
- [Autofill research](docs/autofill-research.md) — how the extension autofill interacts
  with application forms: layered adapter design, per-obstacle techniques, references.

## Libraries

- **Icons:** `lucide-react` always. Never inline an SVG.
- **Animation:** the `motion` library, imported from `"motion/react"` — not from `"motion"`.
- **New pages or major UI sections:** use the `/impeccable` skill so the result matches the design system.
