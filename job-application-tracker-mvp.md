# Job Application Tracker MVP

## Goal
Build a simple system that reads job-related emails from Gmail, uses AI to extract structured application data, stores the results in a database, and displays everything in a small dashboard.

This MVP is meant to be:
- fast to build
- useful in real life
- easy to extend later
- strong enough to talk about as a project

---

## Core User Flow
1. User connects Gmail access.
2. System fetches recent job-related emails.
3. AI parser extracts structured fields from each email.
4. Backend stores or updates an application record.
5. Frontend dashboard shows applications by status.

---

## MVP Scope

### Included
- Gmail email ingestion
- AI-based parsing for job emails
- Basic application status tracking
- Simple dashboard UI
- Manual editing of parsed records

### Not included yet
- Auto-reply generation
- Calendar sync for interviews
- Notifications
- Resume tailoring
- Full thread intelligence
- Company enrichment from external sources

---

## Recommended Stack

### Frontend
- Next.js
- TypeScript
- Tailwind CSS

### Backend
- Node.js
- Express or Fastify

### Database
- Supabase Postgres

### AI Parsing
- OpenAI API with a lightweight structured extraction model
- Suggested starting model: `gpt-4o-mini`

### Auth
- Supabase Auth or simple local-only dev auth for MVP

---

## Why AI Parsing Instead of Traditional NLP
Traditional NLP with regex and keyword rules is cheaper, but job emails vary too much in tone and phrasing.

Examples:
- "Thank you for applying"
- "We regret to inform you"
- "We are moving forward with other candidates"
- "You have been shortlisted"
- "We would like to invite you"

These patterns are easy for an LLM to understand, but brittle to maintain with rules alone.

For this MVP, AI parsing is the better choice because it:
- handles messy real-world email wording
- reduces rule maintenance
- improves extraction quality across companies
- is faster to ship

---

## High-Level Architecture

```text
Gmail API
   ↓
Email Fetcher
   ↓
Job Email Filter
   ↓
AI Parser
   ↓
Backend API
   ↓
Postgres Database
   ↓
Dashboard UI
```

---

## Main System Components

## 1. Gmail Ingestion
Purpose: fetch relevant emails from the user's inbox.

### Approach
Start with polling instead of webhooks.

### MVP behavior
- run every few minutes
- fetch recent emails
- limit to inbox and sent mail if needed
- store raw email metadata before parsing

### Useful filters
Use Gmail search queries such as:
- `newer_than:30d`
- `application`
- `interview`
- `thank you for applying`
- `regret to inform`
- `move forward with other candidates`

### Stored raw fields
- gmail_message_id
- gmail_thread_id
- subject
- from_email
- from_name
- received_at
- snippet
- body_text

---

## 2. Job Email Filter
Purpose: avoid sending every email to the AI parser.

### MVP behavior
Apply a lightweight pre-filter before AI parsing.

### Example filter logic
Mark an email as a candidate if one or more of the following are true:
- sender domain looks like a company or ATS
- subject contains job-related terms
- body contains hiring or interview phrases

### Example keywords
- application
- interview
- recruiter
- candidate
- role
- position
- shortlisted
- regretted
- offer

This step is only for rough filtering. Final extraction comes from the AI parser.

---

## 3. AI Parser
Purpose: turn raw email text into structured application data.

This is the main parsing approach for the MVP.

### Input
- email subject
- sender name and email
- cleaned email body text

### Output schema
```json
{
  "is_job_related": true,
  "company": "Shopee",
  "role": "Backend Intern",
  "status": "rejected",
  "status_confidence": 0.94,
  "email_type": "application_update",
  "interview_date": null,
  "interview_time": null,
  "location": null,
  "notes": "Rejected after application review"
}
```

### Status enum
Use a small controlled set for MVP:
- applied
- interview
- assessment
- rejected
- offer
- unknown

### Suggested prompt
```text
You extract structured job application information from emails.

Return valid JSON only.

Classify whether the email is job-related.
If it is job-related, extract:
- company
- role
- status
- status_confidence
- email_type
- interview_date
- interview_time
- location
- notes

Rules:
- Use null when unknown.
- Keep status limited to: applied, interview, assessment, rejected, offer, unknown.
- Infer the status from the email meaning, not only exact keywords.
- If the email is not related to a job application, return is_job_related as false.
```

### Recommended reliability measures
- validate AI output against a schema
- reject malformed JSON
- fall back to `unknown` if extraction is incomplete
- allow user edits in UI
- store raw parser output for debugging

---

## 4. Backend API
Purpose: manage application records and parsing workflow.

### Suggested routes
#### `POST /emails/ingest`
Stores fetched raw emails.

#### `POST /emails/:id/parse`
Runs AI parsing on one raw email.

#### `GET /applications`
Returns all structured application records.

#### `PATCH /applications/:id`
Allows manual corrections.

#### `GET /applications/:id`
Returns full application details and related email source.

### Backend responsibilities
- deduplicate by Gmail message ID
- map parsed result into database fields
- update existing applications when new emails arrive
- log parser failures

---

## 5. Database Design

## Table: `raw_emails`
```sql
id uuid primary key
gmail_message_id text unique not null
gmail_thread_id text
subject text
from_email text
from_name text
received_at timestamptz
snippet text
body_text text
created_at timestamptz default now()
```

## Table: `applications`
```sql
id uuid primary key
company text
role text
status text not null default 'unknown'
status_confidence numeric
source_email_id uuid references raw_emails(id)
gmail_thread_id text
interview_date date
interview_time text
location text
notes text
created_at timestamptz default now()
updated_at timestamptz default now()
```

## Table: `parse_logs`
```sql
id uuid primary key
raw_email_id uuid references raw_emails(id)
model_name text
prompt_version text
raw_response jsonb
parsed_success boolean
error_message text
created_at timestamptz default now()
```

### Basic indexes
- index on `applications(status)`
- index on `applications(created_at desc)`
- unique index on `raw_emails(gmail_message_id)`

---

## Application Matching Logic
A company may send multiple emails for the same role. The system should avoid creating duplicate applications when possible.

### MVP matching strategy
Try to match by:
1. `gmail_thread_id`
2. company + role
3. sender domain + recent application record

If matching is uncertain, create a new record and allow manual merging later.

---

## Frontend Dashboard
Purpose: give a clear view of all job applications.

### MVP layout
Use a simple table first, or a basic kanban board.

### Recommended columns
- company
- role
- status
- date
- source
- notes

### Useful filters
- status
- company
- date added
- search by role

### Detail view
Each application page can show:
- parsed data
- original email snippet
- manual edit controls
- parse confidence

---

## Manual Edit Support
AI parsing will not be perfect, so user correction is part of the MVP.

### Editable fields
- company
- role
- status
- interview date
- interview time
- location
- notes

This makes the system practical even if parsing is not fully accurate.

---

## Simple Build Order

## Phase 1
- Set up Next.js frontend
- Set up backend server
- Create database tables

## Phase 2
- Connect Gmail API
- Fetch and store raw emails

## Phase 3
- Add rough job-email filter
- Add AI parsing endpoint
- Validate and store parsed result

## Phase 4
- Build dashboard list page
- Add edit form

## Phase 5
- Add deduping and basic matching
- Improve prompt quality

---

## Example End-to-End Flow
1. Gmail fetcher pulls a message:
   - Subject: "Thank you for applying to the Backend Internship"
2. Raw email is stored in `raw_emails`.
3. Filter marks it as likely job-related.
4. AI parser returns:
   - company: Infineon
   - role: Backend Internship
   - status: applied
5. Backend inserts a row into `applications`.
6. Dashboard shows the record under `applied`.

Later:
1. Another email arrives in the same thread:
   - "We would like to invite you for an interview"
2. Parser extracts status `interview`.
3. Existing application is updated instead of creating a duplicate.

---

## Risks and MVP Tradeoffs

### 1. AI cost
Mitigation:
- pre-filter emails before parsing
- only parse likely job-related emails
- store results and avoid reprocessing

### 2. Wrong extraction
Mitigation:
- schema validation
- manual edits
- parse logs for debugging

### 3. Duplicate records
Mitigation:
- use Gmail thread ID first
- add basic matching logic

### 4. Gmail auth complexity
Mitigation:
- start with single-user personal use
- avoid multi-user auth in first version

---

## Why Node.js Is Better for This MVP
Node.js is the better default choice for this project because:
- it matches the rest of your frontend stack
- it reduces context switching
- it is fast enough for Gmail ingestion and API work
- it keeps the whole app in one language

Python is still good, but mainly if you want this project to lean more into:
- data pipelines
- classical NLP experimentation
- local model workflows
- offline parsing systems

For this MVP, Python is not necessary.

---

## When Python Would Be Worth Adding Later
Consider adding Python only if you later want:
- a separate parsing microservice
- model benchmarking across extraction strategies
- heavier NLP preprocessing
- fine-tuned classification pipelines

A later hybrid architecture could be:

```text
Next.js frontend
   ↓
Node.js API
   ↓
Python parser service
   ↓
Postgres
```

But this should come after the first usable version is working.

---

## Strong Resume Framing
You can describe the project like this:

Built an AI-powered job application tracker that ingests Gmail messages, extracts structured application status updates using LLM-based parsing, and presents them in a dashboard for managing interviews, assessments, rejections, and offers.

Shorter version:

Built a Gmail-based job tracker with AI parsing to automatically structure and monitor job application progress.

---

## Best MVP Decision Summary
Use:
- Next.js for frontend
- Node.js for backend
- Supabase Postgres for storage
- Gmail API for ingestion
- AI parsing as the main extraction method

Skip for now:
- Python
- traditional NLP
- webhooks
- advanced automation
- multi-user support

The best first version is the simplest one that works reliably for one user and can be improved later.
