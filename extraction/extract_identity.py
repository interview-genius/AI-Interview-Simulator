"""
Runs identity extraction (company, role, year, outcome) on the 15 Reddit
records already in raw_reports. Does NOT touch Person B's rounds/tone
extraction or structured_reports.

Usage:
    python -m extraction.extract_identity
"""

import os
import json
import re
import psycopg2
from dotenv import load_dotenv
from pydantic import ValidationError

from extraction.identity_schema import IdentityExtraction, IdentityExtractionResult
from extraction.identity_prompt import call_gemini

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise ValueError("DATABASE_URL was not found in .env")

RESULTS_DIR = "extraction/results"
RESULTS_PATH = f"{RESULTS_DIR}/identity_extraction_results.json"


def fetch_reddit_reports(conn):
    """Fetch only the 15 Reddit rows from raw_reports. Read-only — no writes here."""
    cursor = conn.cursor()
    cursor.execute(
        """
        SELECT id, source_url, raw_text
        FROM raw_reports
        WHERE source = 'reddit'
        ORDER BY id;
        """
    )
    rows = cursor.fetchall()
    cursor.close()
    return rows


def strip_code_fences(text: str) -> str:
    """Gemini sometimes wraps JSON in ```json ... ``` despite instructions. Strip if present."""
    text = text.strip()
    text = re.sub(r"^```(?:json)?\s*", "", text)
    text = re.sub(r"\s*```$", "", text)
    return text.strip()


def extract_one(report_id: int, source_url: str, raw_text: str) -> IdentityExtractionResult:
    raw_output = call_gemini(raw_text)
    cleaned = strip_code_fences(raw_output)

    try:
        parsed = json.loads(cleaned)
    except json.JSONDecodeError as e:
        print(f"  ✗ JSON parse failed for id={report_id}: {e}")
        parsed = {}

    if not isinstance(parsed, dict):
        print(
            f"  ✗ Expected JSON object but received "
            f"{type(parsed).__name__} for id={report_id}"
        )
        parsed = {}

    try:
        extraction = IdentityExtraction.model_validate(parsed)
        print("  ✓ Valid extraction")
    except ValidationError as e:
        print(f"  ✗ Schema validation failed for id={report_id}: {e}")
        extraction = IdentityExtraction()

    return IdentityExtractionResult(
        raw_report_id=report_id,
        source_url=source_url,
        extraction=extraction,
        raw_model_output=raw_output,
    )


def main():
    os.makedirs(RESULTS_DIR, exist_ok=True)

    print("Connecting to PostgreSQL...")
    conn = psycopg2.connect(DATABASE_URL)

    print("Fetching Reddit records from raw_reports...")
    rows = fetch_reddit_reports(conn)
    conn.close()  # read-only pass, close immediately — no long-held connection needed

    print(f"Found {len(rows)} Reddit records.\n")

    results = []
    for report_id, source_url, raw_text in rows:
        print(f"Extracting id={report_id} ({source_url[:60]}...)")
        result = extract_one(report_id, source_url, raw_text)
        results.append(result.model_dump())

    with open(RESULTS_PATH, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2, default=str)

    print(f"\nDone. {len(results)} extractions saved to {RESULTS_PATH}")


if __name__ == "__main__":
    main()