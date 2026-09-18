# Learnings

One line per learning: issues faced, reasons, findings.

- 2026-09-18 — `application_viewed` and `job_alert` emails are dropped before upsert (`isLowSignal` in `pipeline.ts`), so they never create an application. On 30 days of real data, 12 of 24 `application_viewed` emails were for companies with no application row — roughly 10% of the tracker missing.
- 2026-09-18 — The parser split near-identical emails between `application_update` and `application_viewed` unpredictably: the same sender and subject ("Thanks for applying to …" from `noreply@candidates.workablemail.com`) landed in both. The cause was one word in the prompt — `application_viewed` covered mail that was "viewed, received, or is being reviewed", and "received" pulled in every application confirmation. Fixed in prompt v9.
- 2026-09-18 — `email_type` is read in exactly one place, the `isLowSignal` drop test in `pipeline.ts`. It decides whether an email reaches the upsert at all and has no other effect, so relabelling between non-dropped types changes nothing.
- 2026-09-18 — Prompt changes can be checked against reality: replay stored `parse_logs` bodies through the edited prompt and diff the new classification against the recorded one. Caught two prompt bugs that reading it would not have.
- 2026-09-18 — 30 days of parse logs contained zero `job_alert` emails, so the `job_alert` branch of the low-signal filter is currently dead weight.
- 2026-09-18 — `applications.updated_at` has no trigger and no writer, so it holds the creation time. Anything ordering by it is really ordering by "most recently created".
- 2026-09-18 — Replaying all 145 real parse logs through the old SQL matcher and the new in-memory one gave identical matches, and the old path cost 197 database round trips against the new one's 1.
- 2026-09-18 — A 150-email sync round does not fit the 300s serverless ceiling: `sync_jobs` holds one run that finished in 134.8s and another killed at 311.7s having processed 129 of 150. The cap is now 100 and `PARSE_CONCURRENCY` is 16.
- 2026-09-18 — A capped run leaves `last_sync_at` untouched, so calling `/api/emails/sync` again simply resumes the same window — already-stored ids are filtered out of the Gmail fetch. Continuation needs no new server state, only a caller that repeats while `remaining > 0`.
- 2026-09-18 — The dashboard derives `gmailConnected` from whether the `user_tokens` row loads, so adding a column to that `select` makes the page show "Connect Gmail" until the migration is applied. Migration first, then deploy.
