"""
Step 3 -- Together: run the combined extraction (identity + rounds/tone in
one call) against 10 real combined examples spanning all three sources, per
the spec: "Test on 10 combined examples, fix whichever fields perform worst."

Picks ~4 Reddit, ~3 Medium, ~3 Form rows -- deliberately mixed rather than
all from one source, since each source has different text shape (Reddit/
Medium: free-form narrative; Form: semi-structured Q&A) and a combined
prompt needs to work across all of them, not just the one it happens to be
tuned on.
"""

import json
import os
import time

import psycopg2
import psycopg2.extras
from dotenv import load_dotenv
from groq import RateLimitError
from pydantic import ValidationError

from extraction.combined_prompt import call_groq
from extraction.combined_schema import CombinedExtraction, CombinedExtractionResult

load_dotenv()

DB_URL = os.getenv("SUPABASE_DB_URL") or os.getenv("DATABASE_URL")
if not DB_URL:
    raise ValueError("Neither SUPABASE_DB_URL nor DATABASE_URL found in .env")


def fetch_mixed_sample():
    query = """
        (SELECT id, source, source_url, raw_text FROM raw_reports
         WHERE source = 'reddit' ORDER BY id LIMIT 4)
        UNION ALL
        (SELECT id, source, source_url, raw_text FROM raw_reports
         WHERE source = 'medium' ORDER BY id LIMIT 3)
        UNION ALL
        (SELECT id, source, source_url, raw_text FROM raw_reports
         WHERE source = 'form' ORDER BY id LIMIT 3)
    """
    with psycopg2.connect(DB_URL) as conn:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(query)
            return cur.fetchall()


def call_groq_with_retry(raw_text: str, max_retries: int = 4) -> str:
    """Free-tier Groq has a tokens-per-minute cap (8000 TPM) -- long Medium
    articles can burn through that fast across several calls. Retry with
    backoff instead of letting one rate-limited row crash the whole run."""
    for attempt in range(max_retries):
        try:
            return call_groq(raw_text)
        except RateLimitError as e:
            wait = 5 * (attempt + 1)  # 5s, 10s, 15s, 20s
            print(f"    [rate limited] waiting {wait}s before retry ({attempt+1}/{max_retries})...")
            time.sleep(wait)
    # last attempt, let it raise if it still fails
    return call_groq(raw_text)


def extract_row(row: dict) -> CombinedExtractionResult | None:
    raw_output = call_groq_with_retry(row["raw_text"])

    try:
        data = json.loads(raw_output)
    except json.JSONDecodeError as e:
        print(f"    [error] row {row['id']}: invalid JSON: {e}")
        return None

    try:
        extraction = CombinedExtraction.model_validate(data)
    except ValidationError as e:
        print(f"    [error] row {row['id']}: schema mismatch: {e}")
        return None

    return CombinedExtractionResult(
        raw_report_id=row["id"],
        source=row["source"],
        source_url=row["source_url"],
        extraction=extraction,
        raw_model_output=raw_output,
    )


def main():
    rows = fetch_mixed_sample()
    print(f"Fetched {len(rows)} mixed rows ({sum(1 for r in rows if r['source']=='reddit')} reddit, "
          f"{sum(1 for r in rows if r['source']=='medium')} medium, "
          f"{sum(1 for r in rows if r['source']=='form')} form).\n")

    results = []
    for row in rows:
        print(f"--- id={row['id']} [{row['source']}] {row['source_url'][:55]} ---")
        result = extract_row(row)
        if result:
            e = result.extraction
            print(f"  company={e.company}  role={e.role}  year={e.year}  outcome={e.outcome}")
            print(f"  rounds={[(r.type, r.difficulty) for r in e.rounds]}")
            print(f"  tone={e.tone}")
            results.append(result.model_dump())
        else:
            print("  EXTRACTION FAILED")
        print()
        time.sleep(3)  # spread requests out to stay under the free-tier TPM cap

    print(f"Successfully extracted {len(results)}/{len(rows)} rows.")

    os.makedirs("extraction/results", exist_ok=True)
    with open("extraction/results/combined_extraction_10.json", "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2)
    print("Saved extraction/results/combined_extraction_10.json")


if __name__ == "__main__":
    main()