# Job Tracker

A personal AI-powered job application tracker. Connect your Gmail and the app automatically reads your job-related emails, extracts structured application data, and keeps your pipeline organised — no manual entry required.

---

## Features

### Automatic email ingestion
Connect Gmail once. The app syncs your inbox on a schedule, reads job-related emails, and creates or updates application records automatically. It deduplicates across email threads so a single application doesn't appear twice when new emails arrive in the same conversation.

### Dashboard — Kanban & Table views
Switch between a drag-and-drop Kanban board and a searchable table. On the Kanban, drag a card to update its status. Right-click any card for quick actions. On the table, filter by status or search by company and role.

### Job Fit Analysis
Paste a job posting URL or text. The app compares it against your profile and CV, then returns a fit score, strengths, skill gaps, and specific recommendations for that role.

### Document generation
From any job analysis, generate a personalised cover letter or application email in one click. Both are tailored to the specific role using your profile narrative and proof points. Download as markdown when ready.

### Candidate Profile
Upload your CV as a PDF. The app structures it into a rich profile: contact details, target roles, career narrative, proof points with metrics, and compensation expectations. Every field is editable manually.

### AI Career Chat
A chat assistant aware of your profile and any job analyses you've run. Use it to prepare for interviews, think through offers, or get targeted advice on gaps before applying to a role.

### Chrome Extension
A companion browser extension for job boards. While viewing a job posting, click **Extract & Send to Job Tracker** to send it directly to the Job Analysis workspace — no copy-pasting.

---

## Loading the Chrome extension

The extension is unpacked (no Chrome Web Store listing) and needs to be loaded manually in developer mode.

1. Open Chrome and go to `chrome://extensions`
2. Enable **Developer mode** (toggle in the top-right corner)
3. Click **Load unpacked**
4. Select the `chrome-extension/` folder from this repo
5. The **Job Tracker Extractor** icon will appear in your toolbar — pin it for easy access

**Before using the extension:**
- The Job Tracker app must be open in a browser tab (either `localhost` in dev, or your Vercel deployment)
- Navigate to a job posting on any job board
- Click the extension icon and press **Extract & Send to Job Tracker**
- The app will come to focus with the job description pre-filled in the Job Analysis workspace

> If you see "No Job Tracker tab found", open the dashboard first, then try again.

---

## Application statuses

| Status | Meaning |
|---|---|
| Applied | Application submitted, awaiting response |
| Interview | Interview scheduled or confirmed |
| Assessment | Take-home task or technical screen in progress |
| Offer | Offer received |
| Rejected | Application declined |
| Unknown | Email parsed but status could not be determined |

---

## Stack

- **Frontend & backend:** Next.js 15 (App Router, TypeScript)
- **Database & auth:** Supabase (Postgres + OAuth)
- **AI:** OpenAI API
- **Email:** Gmail API via OAuth
- **Deployment:** Vercel
- **Browser extension:** Chrome (Manifest V3)
