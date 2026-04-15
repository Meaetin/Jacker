# Graph Report - C:/Projects/job-tracker  (2026-04-16)

## Corpus Check
- Corpus is ~30,507 words - fits in a single context window. You may not need a graph.

## Summary
- 292 nodes · 422 edges · 23 communities detected
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 7 edges (avg confidence: 0.86)
- Token cost: 0 input · 0 output

## God Nodes (most connected - your core abstractions)
1. `Warm/Organic Design System` - 13 edges
2. `updateProfile()` - 7 edges
3. `Job Tracker Architecture Plan` - 7 edges
4. `Core User Flow (5 Steps)` - 7 edges
5. `AI Parser Component (gpt-4o-mini)` - 7 edges
6. `scrapeJobPosting()` - 5 edges
7. `syncUrl()` - 4 edges
8. `decodeBody()` - 4 edges
9. `cleanText()` - 4 edges
10. `Supabase (Postgres + Auth + RLS)` - 4 edges

## Surprising Connections (you probably didn't know these)
- `Frontend Dashboard (Table/Kanban with Status Filters)` --references--> `Warm/Organic Design System`  [INFERRED]
  job-application-tracker-mvp.md → CLAUDE.md
- `Job Tracker Architecture Plan` --conceptually_related_to--> `MVP Goal: Gmailâ†’AIâ†’DBâ†’Dashboard Pipeline`  [INFERRED]
  frolicking-baking-chipmunk.md → job-application-tracker-mvp.md
- `AI Parser Component (gpt-4o-mini)` --implements--> `OpenAI gpt-4o-mini (AI Email Parsing)`  [INFERRED]
  job-application-tracker-mvp.md → frolicking-baking-chipmunk.md
- `Backend API Routes` --implements--> `Next.js 15 App Router`  [INFERRED]
  job-application-tracker-mvp.md → frolicking-baking-chipmunk.md
- `Database Schema (raw_emails, applications, parse_logs)` --implements--> `Supabase (Postgres + Auth + RLS)`  [INFERRED]
  job-application-tracker-mvp.md → frolicking-baking-chipmunk.md

## Hyperedges (group relationships)
- **Core Email Ingestion Pipeline** — mvp_gmail_ingestion, mvp_email_filter, mvp_ai_parser, mvp_database_schema [EXTRACTED 1.00]
- **Job Tracker Technology Stack** — scaffolding_nextjs15, scaffolding_supabase, scaffolding_openai_gpt4o_mini, scaffolding_gmail_api, scaffolding_vercel_cron [EXTRACTED 1.00]
- **Design System Color Tokens** — claudemd_color_token_surface, claudemd_color_token_brand, claudemd_color_token_status_applied, claudemd_color_token_status_rejected, claudemd_color_token_status_offer [EXTRACTED 1.00]
- **Application Status Values (applied, interview, rejected, offer)** — claudemd_color_token_status_applied, claudemd_color_token_status_rejected, claudemd_color_token_status_offer, mvp_ai_parser_output_schema [INFERRED 0.85]

## Communities

### Community 0 - "Job Fit Analysis & Profile"
Cohesion: 0.09
Nodes (7): normalizeProfileData(), normalizeString(), normalizeStringArray(), buildCleanedText(), extractJobDescription(), checkRateLimit(), pruneEntry()

### Community 1 - "Gmail Client & Auth Layer"
Cohesion: 0.08
Nodes (2): toRpcParams(), trackUsage()

### Community 2 - "Application Table & Display"
Cohesion: 0.09
Nodes (2): formatDate(), formatDateTime()

### Community 3 - "Forms & UI Components"
Cohesion: 0.1
Nodes (0): 

### Community 4 - "MVP Spec & CV Data"
Cohesion: 0.1
Nodes (24): Example CV: Alex Chen (Full-stack AI Engineer), Skill: Kubernetes, Skill: PyTorch, Skill: TypeScript, AI Parser Component (gpt-4o-mini), AI Parser Output Schema, Rationale: AI Parsing over Traditional NLP, Application Matching Logic (thread_id, company+role, sender domain) (+16 more)

### Community 5 - "Job Analysis Chat UI"
Cohesion: 0.12
Nodes (3): handleKeyDown(), handleSuggestionClick(), sendMessage()

### Community 6 - "Dashboard Interactions"
Cohesion: 0.12
Nodes (4): handleSearchChange(), handleStatusChange(), handleViewChange(), syncUrl()

### Community 7 - "Email Ingestion & Filter"
Cohesion: 0.15
Nodes (7): extractDomain(), isLikelyJobRelated(), decodeBody(), decodePart(), getHeader(), parseGmailMessage(), stripHtml()

### Community 8 - "Application Database CRUD"
Cohesion: 0.14
Nodes (3): isJobBoard(), resolveCompany(), upsertApplication()

### Community 9 - "Profile Workspace"
Cohesion: 0.17
Nodes (9): handleSave(), splitLines(), updateArchetypes(), updateCandidateField(), updateCompensationField(), updateLocationField(), updateNarrativeField(), updateProfile() (+1 more)

### Community 10 - "Design System Tokens"
Cohesion: 0.15
Nodes (13): Button Component: .btn-primary, Card Component: .card / .card-raised, Color Token: brand (#6b8f71 sage green), Color Token: status-applied (#5b8fb9), Color Token: status-offer (#6b9f6b), Color Token: status-rejected (#c47070), Color Token: surface (#faf8f5), Warm/Organic Design System (+5 more)

### Community 11 - "Document Export"
Cohesion: 0.46
Nodes (7): buildDocumentHtml(), buildFilename(), downloadAsDoc(), downloadAsPdf(), escapeHtml(), parseInlineBold(), parseMarkdownToPdfMake()

### Community 12 - "Auth Actions"
Cohesion: 0.33
Nodes (0): 

### Community 13 - "Job Posting Scraper"
Cohesion: 0.73
Nodes (5): cleanText(), extractJobDescription(), fetchHtml(), parseTitleAndCompany(), scrapeJobPosting()

### Community 14 - "Loading States"
Cohesion: 0.33
Nodes (0): 

### Community 15 - "Chrome Ext Background"
Cohesion: 1.0
Nodes (2): handlePrefill(), waitForTabLoad()

### Community 16 - "Chrome Ext Popup"
Cohesion: 0.67
Nodes (0): 

### Community 17 - "Chrome Ext Bridge"
Cohesion: 1.0
Nodes (0): 

### Community 18 - "Next.js Environment"
Cohesion: 1.0
Nodes (0): 

### Community 19 - "Next.js Config"
Cohesion: 1.0
Nodes (0): 

### Community 20 - "Content Script"
Cohesion: 1.0
Nodes (0): 

### Community 21 - "Parse Log Panel"
Cohesion: 1.0
Nodes (0): 

### Community 22 - "PDF Types"
Cohesion: 1.0
Nodes (0): 

## Knowledge Gaps
- **22 isolated node(s):** `Job Tracker Project`, `DM Sans Font (Body)`, `Fraunces Font (Display/Headings)`, `Color Token: surface (#faf8f5)`, `Color Token: brand (#6b8f71 sage green)` (+17 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Chrome Ext Bridge`** (2 nodes): `tracker-bridge.js`, `dispatchPrefill()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Next.js Environment`** (1 nodes): `next-env.d.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Next.js Config`** (1 nodes): `next.config.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Content Script`** (1 nodes): `content.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Parse Log Panel`** (1 nodes): `parse-log-panel.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `PDF Types`** (1 nodes): `pdf-parse.d.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Warm/Organic Design System` connect `Design System Tokens` to `MVP Spec & CV Data`?**
  _High betweenness centrality (0.008) - this node is a cross-community bridge._
- **Why does `Frontend Dashboard (Table/Kanban with Status Filters)` connect `MVP Spec & CV Data` to `Design System Tokens`?**
  _High betweenness centrality (0.007) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `AI Parser Component (gpt-4o-mini)` (e.g. with `OpenAI gpt-4o-mini (AI Email Parsing)` and `Example CV: Alex Chen (Full-stack AI Engineer)`) actually correct?**
  _`AI Parser Component (gpt-4o-mini)` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `Job Tracker Project`, `DM Sans Font (Body)`, `Fraunces Font (Display/Headings)` to the rest of the system?**
  _22 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Job Fit Analysis & Profile` be split into smaller, more focused modules?**
  _Cohesion score 0.09 - nodes in this community are weakly interconnected._
- **Should `Gmail Client & Auth Layer` be split into smaller, more focused modules?**
  _Cohesion score 0.08 - nodes in this community are weakly interconnected._
- **Should `Application Table & Display` be split into smaller, more focused modules?**
  _Cohesion score 0.09 - nodes in this community are weakly interconnected._