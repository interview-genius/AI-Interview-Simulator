"""
Step 3 -- final step: run the validated combined extraction (identity +
rounds/tone) across ALL raw_reports rows (not just the 10-row test sample),
and insert results into structured_reports.

Idempotent by design: raw_reports.processed and a UNIQUE index on
structured_reports.raw_report_id mean re-running this script is safe --
already-processed rows get skipped, not duplicated or re-billed against the
Groq API.

Usage:
    python -m extraction.insert_structured_reports          # process everything unprocessed
    python -m extraction.insert_structured_reports --limit 5  # just the next 5, for a quick test
"""

import argparse
import json
import os
import time

import psycopg2
import psycopg2.extras
from dotenv import load_dotenv
from groq import BadRequestError, RateLimitError
from pydantic import ValidationError

from extraction.combined_prompt import call_groq
from extraction.combined_schema import CombinedExtraction

load_dotenv()

DB_URL = os.getenv("SUPABASE_DB_URL") or os.getenv("DATABASE_URL")
if not DB_URL:
    raise ValueError("Neither SUPABASE_DB_URL nor DATABASE_URL found in .env")


def ensure_table_exists(conn):
    with open("extraction/create_structured_reports.sql") as f:
        sql = f.read()
    with conn.cursor() as cur:
        cur.execute(sql)
    conn.commit()


def fetch_unprocessed(conn, limit=None):
    query = "SELECT id, source, source_url, raw_text FROM raw_reports WHERE processed = FALSE ORDER BY id"
    if limit:
        query += f" LIMIT {int(limit)}"
    with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
        cur.execute(query)
        return cur.fetchall()


def call_groq_with_retry(raw_text: str, max_retries: int = 4) -> str | None:
    for attempt in range(max_retries):
        try:
            return call_groq(raw_text)
        except RateLimitError:
            wait = 5 * (attempt + 1)
            print(f"    [rate limited] waiting {wait}s (retry {attempt+1}/{max_retries})...")
            time.sleep(wait)
        except BadRequestError as e:
            # Usually means the response got truncated before finishing valid
            # JSON (long reports with many rounds) -- max_tokens increase in
            # combined_prompt.py should mostly prevent this, but if it still
            # happens, don't crash the whole batch over one row.
            print(f"    [error] Groq rejected the generation (likely truncated): {e}")
            return None
    return None


def extract(raw_text: str) -> CombinedExtraction | None:
    raw_output = call_groq_with_retry(raw_text)
    if raw_output is None:
        return None
    try:
        data = json.loads(raw_output)
    except json.JSONDecodeError as e:
        print(f"    [error] invalid JSON: {e}")
        return None
    try:
        return CombinedExtraction.model_validate(data)
    except ValidationError as e:
        print(f"    [error] schema mismatch: {e}")
        return None


def insert_structured_report(conn, raw_report_id: int, extraction: CombinedExtraction):
    with conn.cursor() as cur:
        cur.execute(
            """
            INSERT INTO structured_reports (raw_report_id, company, role, year, rounds, tone, outcome)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (raw_report_id) DO UPDATE SET
                company = EXCLUDED.company,
                role = EXCLUDED.role,
                year = EXCLUDED.year,
                rounds = EXCLUDED.rounds,
                tone = EXCLUDED.tone,
                outcome = EXCLUDED.outcome
            """,
            (
                raw_report_id,
                extraction.company,
                extraction.role,
                extraction.year,
                json.dumps([r.model_dump() for r in extraction.rounds]),
                extraction.tone,
                extraction.outcome,
            ),
        )
        cur.execute("UPDATE raw_reports SET processed = TRUE WHERE id = %s", (raw_report_id,))
    conn.commit()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--limit", type=int, default=None,
                         help="Only process this many rows (for a quick test run)")
    args = parser.parse_args()

    conn = psycopg2.connect(DB_URL)
    ensure_table_exists(conn)

    rows = fetch_unprocessed(conn, limit=args.limit)
    print(f"{len(rows)} unprocessed rows to extract.\n")

    succeeded, failed = 0, 0
    for row in rows:
        print(f"--- id={row['id']} [{row['source']}] {row['source_url'][:55]} ---")
        extraction = extract(row["raw_text"])
        if extraction:
            insert_structured_report(conn, row["id"], extraction)
            print(f"  OK: company={extraction.company}  rounds={len(extraction.rounds)}")
            succeeded += 1
        else:
            print("  EXTRACTION FAILED -- left unprocessed, will retry next run")
            failed += 1
        print()
        time.sleep(3)  # stay under free-tier TPM cap

    conn.close()
    print(f"Done. {succeeded} inserted, {failed} failed (left as processed=FALSE for retry).")


if __name__ == "__main__":
    main()
