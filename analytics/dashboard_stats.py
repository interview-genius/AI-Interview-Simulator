"""
Step 4 -- Person B: Aggregation + dashboard-ready stats

Three queries against structured_reports, all built to unnest the `rounds`
JSONB array -- since topics/difficulty live INSIDE that array, not as their
own columns, every query here needs jsonb_array_elements to "flatten" rounds
into individual rows before we can GROUP BY / COUNT on their contents.

1. company_topic_frequency(company) -- which topics come up most for a given
   company, across all its rounds. This is the query Step 8's "company-
   specific interview generation" leans on: "Google interviews commonly
   cover graphs and DP" comes directly from this.

2. round_count_distribution() -- how many rounds do reports typically have?
   Useful dashboard stat ("most interview loops have 4-5 rounds") and also
   a data-quality signal: a report with 0 rounds extracted is a candidate
   for review, not necessarily a "real" data point.

3. difficulty_trend_by_year() -- has interview difficulty shifted over time?
   difficulty is a text label (Easy/Medium/Hard), not numeric, so we report
   both the raw per-year counts AND a numeric average (Easy=1, Medium=2,
   Hard=3) for an actual trend line on Step 10's dashboard.
"""

import os

import psycopg2
import psycopg2.extras
from dotenv import load_dotenv

load_dotenv()

DB_URL = os.getenv("SUPABASE_DB_URL") or os.getenv("DATABASE_URL")
if not DB_URL:
    raise ValueError("Neither SUPABASE_DB_URL nor DATABASE_URL found in .env")


def _connect():
    return psycopg2.connect(DB_URL, cursor_factory=psycopg2.extras.RealDictCursor)


def company_topic_frequency(company: str, limit: int = 15) -> list[dict]:
    """Topic frequency across all rounds of all reports for one company."""
    query = """
        SELECT topic, COUNT(*) AS frequency
        FROM structured_reports sr,
             jsonb_array_elements(sr.rounds) AS round_elem,
             jsonb_array_elements_text(round_elem->'topics') AS topic
        WHERE sr.company ILIKE %(company)s
        GROUP BY topic
        ORDER BY frequency DESC
        LIMIT %(limit)s
    """
    with _connect() as conn:
        with conn.cursor() as cur:
            cur.execute(query, {"company": f"%{company}%", "limit": limit})
            return cur.fetchall()


def round_count_distribution() -> list[dict]:
    """How many rounds do reports typically have? (0 rounds = worth a data-quality look)"""
    query = """
        SELECT COALESCE(jsonb_array_length(rounds), 0) AS round_count, COUNT(*) AS num_reports
        FROM structured_reports
        GROUP BY round_count
        ORDER BY round_count
    """
    with _connect() as conn:
        with conn.cursor() as cur:
            cur.execute(query)
            return cur.fetchall()


def difficulty_trend_by_year() -> list[dict]:
    """Per-year counts of each difficulty label, plus a numeric average
    (Easy=1, Medium=2, Hard=3) for an actual trend line."""
    query = """
        SELECT
            sr.year,
            round_elem->>'difficulty' AS difficulty,
            COUNT(*) AS cnt
        FROM structured_reports sr,
             jsonb_array_elements(sr.rounds) AS round_elem
        WHERE sr.year IS NOT NULL
          AND round_elem->>'difficulty' IS NOT NULL
        GROUP BY sr.year, difficulty
        ORDER BY sr.year, difficulty
    """
    with _connect() as conn:
        with conn.cursor() as cur:
            cur.execute(query)
            raw = cur.fetchall()

    # Build the numeric-average trend on top of the raw counts, in Python --
    # simpler and more transparent than a CASE-heavy SQL average, and easy
    # to re-map (e.g. add a 4th difficulty label later) without touching SQL.
    DIFFICULTY_SCORE = {"easy": 1, "medium": 2, "hard": 3}
    by_year: dict[int, list[tuple[int, int]]] = {}  # year -> [(score, count), ...]
    for row in raw:
        score = DIFFICULTY_SCORE.get(row["difficulty"].strip().lower())
        if score is None:
            continue  # unrecognized difficulty label, skip rather than guess
        by_year.setdefault(row["year"], []).append((score, row["cnt"]))

    trend = []
    for year, pairs in sorted(by_year.items()):
        total_weighted = sum(score * cnt for score, cnt in pairs)
        total_count = sum(cnt for _, cnt in pairs)
        trend.append({
            "year": year,
            "avg_difficulty_score": round(total_weighted / total_count, 2),
            "sample_size": total_count,
        })

    return {"raw_counts": raw, "trend": trend}


def main():
    print("=== company_topic_frequency('Google') ===")
    for row in company_topic_frequency("Google"):
        print(f"  {row['topic']}: {row['frequency']}")
    print()

    print("=== company_topic_frequency('Amazon') ===")
    for row in company_topic_frequency("Amazon"):
        print(f"  {row['topic']}: {row['frequency']}")
    print()

    print("=== round_count_distribution() ===")
    for row in round_count_distribution():
        print(f"  {row['round_count']} rounds: {row['num_reports']} reports")
    print()

    print("=== difficulty_trend_by_year() ===")
    result = difficulty_trend_by_year()
    print("  Raw counts:")
    for row in result["raw_counts"]:
        print(f"    {row['year']} / {row['difficulty']}: {row['cnt']}")
    print("  Numeric trend (1=Easy, 2=Medium, 3=Hard):")
    for row in result["trend"]:
        print(f"    {row['year']}: avg={row['avg_difficulty_score']} (n={row['sample_size']})")


if __name__ == "__main__":
    main()
