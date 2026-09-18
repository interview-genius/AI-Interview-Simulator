"""
Runs Person B's extraction (rounds, tone) against real rows pulled directly
from Supabase's raw_reports table -- not a local CSV.

WHY PULL FROM SUPABASE INSTEAD OF form_raw.csv:
The local CSV never had real database ids. Person A's schema
(identity_schema.py) links results back via raw_report_id -- a real Postgres
integer. For our two extraction passes to merge into one combined call later,
both of us need to be working against the SAME source of truth (the live
table), with real ids, not two separately-built local files that happen to
contain similar text.

CONNECTION:
Uses the Supabase Session Pooler connection string (same choice Person A
made -- the Direct connection had a DNS/IPv6 issue on her machine). Set
SUPABASE_DB_URL in .env -- get the exact string from Person A's Supabase
project settings (Database -> Connection string -> Session pooler).
"""

import json
import os

import psycopg2
import psycopg2.extras
from dotenv import load_dotenv
from pydantic import ValidationError

from extraction.rounds_tone_prompt import call_groq
from extraction.rounds_tone_schema import RoundsToneExtraction, RoundsToneExtractionResult

load_dotenv()

SUPABASE_DB_URL = os.getenv("SUPABASE_DB_URL")
if not SUPABASE_DB_URL:
    raise ValueError(
        "SUPABASE_DB_URL was not found in .env -- get the Session Pooler "
        "connection string from Person A / Supabase project settings."
    )


def fetch_rows(source_filter: str | None = None, limit: int | None = None):
    """Pull rows from raw_reports. source_filter e.g. 'form' to test on Form
    data first, matching the spec's guidance to validate on the cleaner
    source before running on everything."""

    query = "SELECT id, source, source_url, raw_text FROM raw_reports"
    params = []
    if source_filter:
        query += " WHERE source = %s"
        params.append(source_filter)
    query += " ORDER BY id"
    if limit:
        query += " LIMIT %s"
        params.append(limit)

    with psycopg2.connect(SUPABASE_DB_URL) as conn:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(query, params)
            return cur.fetchall()


def extract_row(row: dict) -> RoundsToneExtractionResult | None:
    raw_output = call_groq(row["raw_text"])

    try:
        data = json.loads(raw_output)
    except json.JSONDecodeError as e:
        print(f"    [error] row {row['id']}: model did not return valid JSON: {e}")
        return None

    try:
        extraction = RoundsToneExtraction.model_validate(data)
    except ValidationError as e:
        print(f"    [error] row {row['id']}: schema mismatch: {e}")
        return None

    return RoundsToneExtractionResult(
        raw_report_id=row["id"],
        source_url=row["source_url"],
        extraction=extraction,
        raw_model_output=raw_output,
    )


def main():
    # Start with Form data, per the spec: "cleaner data, good for testing
    # nested extraction first." Once validated, drop source_filter to run
    # on everything.
    rows = fetch_rows(source_filter="form")
    print(f"Fetched {len(rows)} rows from raw_reports (source=form).\n")

    results = []
    for row in rows:
        print(f"--- id={row['id']}  {row['source_url'][:60]} ---")
        result = extract_row(row)
        if result:
            r = result.extraction
            print(f"  rounds: {[(rd.type, rd.difficulty) for rd in r.rounds]}")
            print(f"  tone: {r.tone}")
            result_dict = result.model_dump()
            result_dict["_raw_text_for_eval"] = row["raw_text"]  # kept for
            # evaluate_rounds_tone.py's ground-truth check; not part of the
            # schema itself, just carried along for spot-checking accuracy
            results.append(result_dict)
        else:
            print("  EXTRACTION FAILED")
        print()

    print(f"Successfully extracted {len(results)}/{len(rows)} rows.")

    os.makedirs("results", exist_ok=True)
    with open("results/rounds_tone_form.json", "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2)
    print("Saved results/rounds_tone_form.json")


if __name__ == "__main__":
    main()
