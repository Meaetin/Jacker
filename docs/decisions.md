# Decisions

One line per settled choice: date, decision, why.

- 2026-09-18 — The ingest upsert phase matches applications in memory, not per email in SQL. The four-tier match cost up to four queries an email and three used `ilike('%company%')`, which a leading wildcard keeps off `idx_applications_company_role`.
- 2026-09-18 — `storeIfNew` inserts first and handles the unique violation, instead of checking for the row beforehand. `fetchRecentEmails` already removed every stored id, so the pre-check was near-always empty.
- 2026-09-18 — `application_viewed` means only "someone looked at it", never "we received it". Application confirmations are `application_update` with status `applied`, because that email is the first and often only proof the user applied.
- 2026-09-18 — A backlog larger than one run is drained by the client calling `/api/emails/sync` repeatedly while `remaining > 0`, not by looping inside one request. One round already fills the 300s budget, and Vercel can freeze a function once it has responded, so self-chaining on the server is unreliable.
- 2026-09-18 — The leftover count lives on `user_tokens.pending_emails`, not `sync_jobs`. The cron runs the pipeline without creating a job row, so only the token row stays true whichever path did the work.
- 2026-09-18 — `/api/emails/sync` returns 409 when a run is already in flight, and only retires `running` rows older than six minutes. Two pipelines for one user each match against their own snapshot of the applications and can insert the same job twice.
