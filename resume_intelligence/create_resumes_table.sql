-- Step 7 -- Person B: resumes table.
--
-- user_id is a plain nullable INT, not yet a real FK, because Person A's
-- Step 7 half (users/profiles tables) doesn't exist yet. This mirrors how
-- structured_reports referenced raw_reports from day one in Step 3 --
-- add the real FK constraint once her table exists, in the "Together" step.

CREATE TABLE IF NOT EXISTS resumes (
    id SERIAL PRIMARY KEY,
    user_id INT,
    source_filename TEXT NOT NULL,
    raw_text TEXT NOT NULL,
    structured_data JSONB,
    uploaded_at TIMESTAMP DEFAULT NOW()
);
