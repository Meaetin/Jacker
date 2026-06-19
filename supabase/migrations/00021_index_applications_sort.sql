-- Deterministic sort index for the dashboard list + infinite scroll.
-- Order must be identical and total across the RSC initial page and every
-- /api/applications page, otherwise pagination duplicates or skips rows.
create index if not exists idx_applications_user_updated
  on applications (
    user_id,
    application_updated_at desc nulls last,
    id desc
  );
