-- Records who last set an application's status: the ingest pipeline, or the
-- user editing it by hand.
--
-- This is provenance, not a rule. Resolution still goes by email date (see
-- resolve-status-update.ts), so an email dated after a manual edit still wins.
-- The column exists so a status you corrected yourself is visibly distinct from
-- one the parser guessed, and so that rule can be tightened later without a
-- second migration.

alter table applications
  add column status_source text not null default 'email'
    check (status_source in ('email', 'manual'));

-- Every existing row was created by the ingest pipeline, so the 'email' default
-- is already correct for all of them.
