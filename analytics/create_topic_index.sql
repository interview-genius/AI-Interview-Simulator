-- Step 4 (Person A): GIN index for fast topic lookups inside structured_reports.rounds
--
-- rounds is JSONB, shaped like:
--   [{"type": ["technical"], "topics": ["graphs","bfs","dfs"], "difficulty": "medium"}, ...]
--
-- Default GIN (jsonb_ops) supports the @> containment operator, which works
-- correctly here: rounds @> '[{"topics": ["graphs"]}]' matches any report
-- where at least one round object's "topics" array contains "graphs" —
-- exactly the inverted-index lookup we need, no jsonb_array_elements required
-- at query time for the indexed path.

CREATE INDEX IF NOT EXISTS idx_structured_reports_rounds_gin
    ON structured_reports
    USING GIN (rounds);

-- Sanity check query (run manually to confirm the index is used):
-- EXPLAIN ANALYZE
-- SELECT raw_report_id
-- FROM structured_reports
-- WHERE rounds @> '[{"topics": ["graphs"]}]'::jsonb;