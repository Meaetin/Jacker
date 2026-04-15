# Job Tracker

## Codebase Navigation

A knowledge graph of this codebase lives in `graphify-out/`. Use it before touching unfamiliar areas.

- **`graphify-out/graph.html`** — interactive visualization, open in any browser. Nodes are colored by community; click any node to see its connections.
- **`graphify-out/GRAPH_REPORT.md`** — god nodes, surprising connections, knowledge gaps.
- **`graphify-out/graph.json`** — raw graph data for programmatic queries.

### Key communities (23 detected)

| Community | Cohesion | Core files |
|---|---|---|
| Job Fit Analysis & Profile | 0.09 | `lib/profile/`, `app/dashboard/job-analysis/` |
| Gmail Client & Auth Layer | 0.08 | `lib/gmail/`, `utils/supabase/` |
| Application Table & Display | 0.09 | `components/application-table.tsx`, `utils/date.ts` |
| Forms & UI Components | 0.10 | `components/application-form.tsx`, `components/ui/` |
| Job Analysis Chat UI | 0.12 | `components/job-analysis/` |
| Dashboard Interactions | 0.12 | `app/dashboard/page.tsx` |
| Email Ingestion & Filter | 0.15 | `lib/gmail/`, `lib/filter/`, `lib/ingest/` |
| Application Database CRUD | 0.14 | `lib/db/applications.ts`, `lib/ingest/` |
| Profile Workspace | 0.17 | `components/profile-workspace.tsx` |
| Design System Tokens | 0.15 | `app/globals.css`, `CLAUDE.md` |
| Document Export | 0.46 | `lib/profile/generate-document.ts` |
| Job Posting Scraper | 0.73 | `lib/profile/scrape-job-posting.ts` |
| Chrome Ext Background/Popup/Bridge | — | `src/` extension files |

### God nodes (highest betweenness — touch these carefully)

1. `Warm/Organic Design System` — 13 edges, bridges design tokens and the full UI layer
2. `updateProfile()` — 7 edges, central to profile workspace and analysis flow
3. `AI Parser Component` — 7 edges, connects ingestion pipeline to DB and API
4. `scrapeJobPosting()` — 5 edges, tightly coupled within its own module (cohesion 0.73)

### Rule: Use the graph before searching the codebase

**Before using Grep, Glob, or Read to find code**, query the graph first:

1. Run `/graphify query "<what you're looking for>"` to find relevant nodes and their source files.
2. Use the returned `source_file` and `source_location` to go directly to the right file.
3. Only fall back to Grep/Glob if the graph returns no useful matches.

This applies to: finding where a feature lives, tracing a data flow, locating a component, understanding what calls what.

To query the graph: `/graphify query "<question>"` or `/graphify explain "<node name>"`
To update after code changes: `/graphify . --update`

## Design System — Warm/Organic Aesthetic

This project uses a **warm/organic** visual identity — sage greens, warm creams, soft shadows. Never default to generic blue/indigo, Inter font, or flat white surfaces.

### Typography

- **Body:** DM Sans (`font-body` / `--font-dm-sans`) — clean, warm sans-serif
- **Display/Headings:** Fraunces (`font-display` / `--font-fraunces`) — organic serif with character
- Use `font-display` for page headings, hero text, and branding. Use `font-body` for everything else.

### Color Tokens (defined in `globals.css` `@theme`)

| Token | Hex | Usage |
|---|---|---|
| `surface` | `#faf8f5` | Page/card backgrounds — warm cream |
| `surface-raised` | `#f3efe9` | Elevated surfaces, hover states |
| `surface-overlay` | `#ebe5dc` | Modals, overlays |
| `border` | `#e0d6ca` | Borders — warm tan |
| `border-focus` | `#6b8f71` | Focus rings, active borders |
| `text-primary` | `#2a2118` | Body text — warm dark brown |
| `text-secondary` | `#7a6e62` | Labels, captions |
| `text-muted` | `#b0a498` | Placeholder, disabled |
| `brand` | `#6b8f71` | Primary actions, links — sage green |
| `brand-hover` | `#5a7f60` | Brand hover state |
| `brand-light` | `#e8f0e9` | Brand tint backgrounds, highlights |
| `status-applied` | `#5b8fb9` | Application status badges |
| `status-interview` | `#9b7fbf` | |
| `status-assessment` | `#d49b3a` | |
| `status-rejected` | `#c47070` | |
| `status-offer` | `#6b9f6b` | |
| `status-unknown` | `#9e9286` | |

### Rules When Creating UI

1. **Always use theme tokens.** Never hardcode colors like `bg-white`, `text-gray-700`, `border-gray-200`. Use `bg-surface`, `text-text-secondary`, `border-border` instead.
2. **Shadows use warm tones.** Always use `rgba(42, 33, 24, ...)` for shadow colors — never cold `rgba(0,0,0,...)`. Use `.shadow-soft` or `.shadow-soft-md` component classes.
3. **Status colors use the badge system.** Use `badge-status-{status}` classes. Never inline status colors.
4. **Semantic class names are required.** Every element gets a readable class alongside any utility classes: `kanban-card-company`, `sync-button-loading`, `nav-sidebar-logo`. No generic `div.className="flex items-center"` without a semantic name.
5. **Buttons:** Use `.btn-primary` (sage green) or `.btn-secondary` (warm outlined) component classes. For variant-specific buttons in shadcn components, pass `brand`-compatible tokens.
6. **Cards:** Use `.card` for standard cards, `.card-raised` for interactive cards with hover lift.
7. **Inputs:** Use `.input-field` component class. Focus rings use `brand-light` glow.
8. **Icons:** Use `lucide-react` — do not inline SVGs.

## Libraries & Patterns

- **Icons:** Always use `lucide-react`. Never inline SVGs. Available icons: `LayoutDashboard`, `FileText`, `Target`, `LogOut`, `RefreshCw`, `Trash2`, `Plus`, `ChevronDown`, `Check`, `LoaderCircle`, `X`, `ArrowLeft`, `Search`, `List`, `Columns3`, `Mail`
- **Animations:** Use `motion` library. Import from `"motion/react"` (NOT `"motion"`). Uses `AnimatePresence` and `motion` components. Currently used in Dialog overlays, profile sticky save bar.
- **Design skill:** When creating new pages or major UI sections, use `/impeccable` skill to ensure the design matches this project's warm/organic aesthetic.
- **Layout centering:** All page content uses `max-w-*xl mx-auto` to center within the sidebar layout. Dashboard: `max-w-6xl`, Profile/Job Analysis: `max-w-4xl`, Detail/Edit: `max-w-2xl`.
- **Flex overflow:** Main content area needs `min-w-0 overflow-hidden` to prevent kanban/flex children from squishing the sidebar.

## Tailwind CSS v4 Hover Pattern

Tailwind v4 uses native CSS cascade layers: `theme < base < components < utilities`.

**Rule:** Never mix component-layer hover styles with utility-layer base styles on the same element. The utility layer always wins, even on `:hover`.

**Bad** — hover in `@layer components`, base in utilities:
```tsx
<div className="my-card bg-surface border border-border shadow-sm">
```
```css
@layer components {
  .my-card:hover { background-color: var(--color-brand-light); }
  /* ^^^ Won't work — bg-surface (utilities) overrides this */
}
```

**Good** — all styling in one layer:
- **Option A:** Everything in component CSS — no utility classes that conflict with hover properties
- **Option B:** Everything as Tailwind utilities — hover variants are same layer as base
```tsx
<!-- Option A -->
<div className="my-card">
<!-- Option B -->
<div className="bg-surface border border-border shadow-sm hover:bg-brand-light hover:border-brand">
```
