# Learnings

One line per finding: what was hit, why, what it means.

- 2026-09-18 — CV uploads keep only the parsed markdown (`cv_markdown`), never the PDF bytes, so autofill cannot attach a resume file to an application. Needs a Supabase Storage bucket to fix.
- 2026-09-18 — The Supabase session cookie is `SameSite=Lax`, so the extension's service worker cannot call the app's API directly. The profile is read by a content script on an open Job Tracker tab and cached in `chrome.storage.local`.
- 2026-09-18 — Singapore's ATS mix is nothing like the US one: Workday (all of the public service, Grab, OCBC, UOB) and SAP SuccessFactors (Singtel, SIA, StanChart, Temasek, GIC) dominate, while Greenhouse/Lever/Ashby appear mainly at foreign tech offices. Adapter order follows this.
- 2026-09-18 — `raw_emails` sender domains are a usable proxy for which platforms actually get applied to, but they undercount platforms whose forms get abandoned mid-way.
- 2026-09-18 — CV re-upload destroyed hand-entered profile fields two ways at once: the UI reset the form to defaults before the request (so a failed upload also lost them), and the route replaced `profile_data` wholesale. Both fixed; `scripts/verify-profile-merge.mjs` pins the behaviour.
- 2026-09-18 — The education repeater required a `<fieldset>` or `role="group"` to recognise an entry panel. Most forms group nothing, so it found no panels, no Add button, and filled nothing. A section holding controls directly is now treated as its own single panel.
- 2026-09-18 — Unanchored abbreviations in the degree-level table made "Diploma" match `m\.?a\b` (the "ma" in "diplo-ma") and resolve to Master's Degree. Both-side `\b` anchors are mandatory for two-letter qualifications.
- 2026-09-18 — Node 26 strips TypeScript types natively, so `scripts/*.mjs` can import `src/**/*.ts` directly when those modules only use type-level imports. No test runner needed.
- 2026-09-18 — `node --check` only parses; it cannot see a reference to a variable that no longer exists. ESLint's `no-undef` now covers `chrome-extension/` via `npm run lint`, which is the only automated check that catches that class of bug in files no build ever touches.
- 2026-09-18 — A stale `.next` cache made every route return 500, including the login page. Clearing `.next` and restarting fixed it; suspect the cache when errors are broad rather than route-specific.
- 2026-09-18 — `toAutofillProfile` takes raw JSONB that may predate any field, so it defaults every group instead of destructuring. Passing the row without `personal_details` used to throw and surface as an opaque 500.
- 2026-09-18 — Calling `window.close()` in the same tick as `chrome.runtime.sendMessage` from a popup kills the context before Chrome dispatches the message, so the background never runs and nothing reports a failure. The background must `sendResponse` first and the popup must await it before closing.
- 2026-09-18 — Work moved into the background service worker has no UI, so every failure path needs `chrome.notifications`. An on-page overlay is not enough: it cannot be drawn when script injection itself is what failed.
- 2026-09-18 — Reporting only on fields autofill *attempted* hides the ones that matter: a field the dictionary never recognised, or one with no profile value, leaves no trace. The overlay now inspects the form for still-empty controls instead of counting failed attempts.
- 2026-09-18 — Candidate profiles saved before the CV prompt asked for `personal_details`, `education` and `work_experience` still have those empty. Re-uploading the CV repopulates them; nothing backfills automatically.
- 2026-09-18 — Workday puts "Country Phone Code" and "Device Type" beside the phone number, and all three read as phone fields without explicit `avoid` patterns.
- 2026-09-18 — The middleware redirected unauthenticated `/api/*` requests to `/login`, so any fetch caller got an HTML page with a 200 instead of a 401 and failed to parse it. API routes now return 401 JSON; only pages redirect. Middleware changes need a dev-server restart, not a hot reload.
- 2026-09-18 — Content scripts are not re-injected when the extension reloads, so an already-open tab keeps a dead script. Anything messaging a tab must inject on demand and retry.
- 2026-09-18 — Assigning `input.value` does nothing on React forms; the write must go through the prototype's native setter followed by a bubbling `InputEvent`. Every autofill path depends on this.
- 2026-09-18 — A readonly `<input>` is usually the visible half of a custom dropdown, so filtering readonly controls out of form scanning silently drops most custom dropdowns.
