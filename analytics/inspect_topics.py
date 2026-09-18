"""
Diagnostic utility for Step 4.

Prints all extracted topics and their frequencies so we can inspect
the actual topic vocabulary stored inside structured_reports.rounds.

This helps identify vocabulary inconsistencies such as:
- graph vs graphs
- array vs arrays
- dynamic programming vs dp
"""

import os
from collections import Counter

import psycopg2
from dotenv import load_dotenv


load_dotenv()

DATABASE_URL = (
    os.getenv("SUPABASE_DB_URL")
    or os.getenv("DATABASE_URL")
)

if not DATABASE_URL:
    raise ValueError(
        "Neither SUPABASE_DB_URL nor DATABASE_URL was found in .env"
    )


def inspect_topics():
    query = """
        SELECT topic, COUNT(*) AS frequency
        FROM structured_reports,
             jsonb_array_elements(rounds) AS round_elem,
             jsonb_array_elements_text(round_elem->'topics') AS topic
        GROUP BY topic
        ORDER BY frequency DESC, topic;
    """

    conn = psycopg2.connect(DATABASE_URL)

    try:
        with conn.cursor() as cur:
            cur.execute(query)
            rows = cur.fetchall()
    finally:
        conn.close()

    print("\n=== EXTRACTED TOPIC VOCABULARY ===\n")

    for topic, frequency in rows:
        print(f"{frequency:3}  {topic}")

    print(f"\nTotal unique topics: {len(rows)}")

    return rows


if __name__ == "__main__":
    inspect_topics()