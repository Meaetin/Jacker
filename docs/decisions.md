# Decisions

One line per settled choice: date, decision, why.

- 2026-09-18 — Autofill runs as a content script in the user's own browser, not a headless server browser. Job sites fingerprint automated browsers, and applications need the user's real logged-in sessions.
- 2026-09-18 — Autofill is layered: platform detection, then a per-ATS adapter, then generic label/name/autocomplete heuristics. Reliability comes from the adapters; the generic layer carries the long tail of smaller ATSes.
- 2026-09-18 — Adapter order for Singapore is Workday, then SAP SuccessFactors, then MyCareersFuture. Follows where local applications actually go, not US market share.
- 2026-09-18 — Autofill never answers sponsorship, demographic, salary, criminal-record or date-of-birth questions. Wrong answers there carry legal or negotiating weight, so they are reported to the user instead.
- 2026-09-18 — Autofill never submits. It fills and stops at the review step; clicking Submit stays the user's decision.
- 2026-09-18 — Existing values are never overwritten, so a partly finished application is safe to autofill.
- 2026-09-18 — Skills are one flat list on the profile, not categorised and without proficiency levels. Forms ask for a plain list, so anything richer would only be thrown away at fill time.
- 2026-09-18 — `degree` stores the qualification only; the field of study lives in its own column. Forms offer degree as a fixed dropdown of levels, and the API derives those aliases so a verbose CV wording still matches.
- 2026-09-18 — When a fixed skill list has no match for one of the user's skills, it is skipped rather than forced in as free text.
- 2026-09-18 — Re-uploading a CV merges into the saved profile instead of replacing it: an empty extracted value never blanks a stored one. A CV states far less than an application form asks for, so replacing destroyed hand-entered fields like address and gender.
- 2026-09-18 — Skills merge as a union on CV upload; education and work history are replaced when the CV has entries, since interleaving would create near-duplicates.
- 2026-09-18 — The profile form is never cleared before an upload. It stays mounted behind a "reading your CV" curtain, so a failed upload cannot take the user's unsaved edits with it.
