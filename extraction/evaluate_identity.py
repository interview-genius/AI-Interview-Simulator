"""
Loads identity_extraction_results.json and prints each extraction next to
a snippet of the original text, for manual accuracy checking. Also prints
basic fill-rate stats.

Usage:
    python -m extraction.evaluate_identity
"""

import json
import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
RESULTS_PATH = "extraction/results/identity_extraction_results.json"


def fetch_raw_text_by_id(conn, report_id: int) -> str:
    cursor = conn.cursor()
    cursor.execute("SELECT raw_text FROM raw_reports WHERE id = %s;", (report_id,))
    row = cursor.fetchone()
    cursor.close()
    return row[0] if row else ""


def main():
    if not os.path.exists(RESULTS_PATH):
        raise FileNotFoundError(
            f"{RESULTS_PATH} not found — run extract_identity.py first."
        )

    with open(RESULTS_PATH, "r", encoding="utf-8") as f:
        results = json.load(f)

    conn = psycopg2.connect(DATABASE_URL)

    company_filled = role_filled = year_filled = 0
    outcome_known = 0

    print("=" * 80)
    for r in results:
        report_id = r["raw_report_id"]
        extraction = r["extraction"]
        raw_text = fetch_raw_text_by_id(conn, report_id)
        snippet = raw_text[:200].replace("\n", " ")

        print(f"\nID {report_id} — {r['source_url']}")
        print(f"  TEXT SNIPPET: {snippet}...")
        print(f"  EXTRACTED   : company={extraction['company']!r}, "
              f"role={extraction['role']!r}, year={extraction['year']!r}, "
              f"outcome={extraction['outcome']!r}")

        if extraction["company"] is not None:
            company_filled += 1
        if extraction["role"] is not None:
            role_filled += 1
        if extraction["year"] is not None:
            year_filled += 1
        if extraction["outcome"] != "unknown":
            outcome_known += 1

    conn.close()

    total = len(results)
    print("\n" + "=" * 80)
    print("FILL-RATE SUMMARY")
    print(f"  company filled : {company_filled}/{total}")
    print(f"  role filled    : {role_filled}/{total}")
    print(f"  year filled    : {year_filled}/{total}")
    print(f"  outcome known  : {outcome_known}/{total}")
    print("\nManually compare EXTRACTED values against TEXT SNIPPET above")
    print("to judge accuracy — this script does not auto-grade correctness.")


if __name__ == "__main__":
    main()