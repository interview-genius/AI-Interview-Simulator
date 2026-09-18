-- Step 3: structured_reports table
-- Matches the schema from Interview_Simulator_Work_Split_v3.pdf exactly.

CREATE TABLE IF NOT EXISTS structured_reports (
    id SERIAL PRIMARY KEY,
    raw_report_id INT REFERENCES raw_reports(id),
    company TEXT,
    role TEXT,
    year INT,
    rounds JSONB,
    tone TEXT,
    outcome TEXT
);

-- One row per raw_reports row that's been extracted -- enforce that at the
-- DB level so re-running the insert script can't accidentally create
-- duplicate structured rows for the same source report.
CREATE UNIQUE INDEX IF NOT EXISTS idx_structured_reports_raw_report_id
    ON structured_reports(raw_report_id);
