-- Step 5: adds the embedding column structured_reports needs.
-- Safe to run once, by either person -- IF NOT EXISTS makes it idempotent.
-- pgvector extension was already enabled back in Step 2.

ALTER TABLE structured_reports
    ADD COLUMN IF NOT EXISTS embedding vector(768);
