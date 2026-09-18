"""
Step 6 -- Person A: RAG-based context retrieval for mock interview engine.

Given company, role, and round_type, generates a query embedding via
embeddings/query_embed.py and retrieves the top matching structured_reports rows
using pgvector cosine similarity (<=>).

Crucially, this retrieval selects the `rounds` JSONB field alongside company,
role, tone, and outcome so downstream persona construction has full access to
past topics and difficulty.
"""

import os
import psycopg2
import psycopg2.extras
from dotenv import load_dotenv

from embeddings.query_embed import embed_query

load_dotenv()

DB_URL = os.getenv("SUPABASE_DB_URL") or os.getenv("DATABASE_URL")
if not DB_URL:
    raise ValueError("Neither SUPABASE_DB_URL nor DATABASE_URL found in .env")


def retrieve_interview_context(
    company: str = "",
    role: str = "",
    round_type: str = "",
    limit: int = 5,
) -> list[dict]:
    """Retrieves top N matching structured_reports rows for an interview setup.

    Builds an embedding query from (company, role, round_type) and performs
    a pgvector cosine similarity search including the `rounds` JSONB column.
    """
    query_parts = [p.strip() for p in [company, role, round_type] if p and p.strip()]
    query_text = " ".join(query_parts) if query_parts else "Software Engineer technical interview"

    query_vector = embed_query(query_text)

    sql = """
        SELECT id, company, role, rounds, tone, outcome,
               embedding <=> %(query_vector)s::vector AS distance
        FROM structured_reports
        WHERE embedding IS NOT NULL
        ORDER BY distance ASC
        LIMIT %(limit)s
    """

    with psycopg2.connect(DB_URL, cursor_factory=psycopg2.extras.RealDictCursor) as conn:
        with conn.cursor() as cur:
            cur.execute(sql, {"query_vector": query_vector, "limit": limit})
            return cur.fetchall()


def retrieve_context(
    company: str = "",
    role: str = "",
    round_type: str = "",
    limit: int = 5,
) -> list[dict]:
    """Alias for retrieve_interview_context for backward/interface compatibility."""
    return retrieve_interview_context(
        company=company,
        role=role,
        round_type=round_type,
        limit=limit,
    )


def main():
    print("=" * 70)
    print("TESTING RETRIEVAL FOR INTERVIEW ENGINE")
    print("=" * 70)

    test_configs = [
        {"company": "Google", "role": "Software Engineer", "round_type": "Coding"},
        {"company": "Amazon", "role": "SDE", "round_type": "Behavioral"},
        {"company": "Microsoft", "role": "Software Engineer", "round_type": "System Design"},
    ]

    for cfg in test_configs:
        print(f"\nSearching for: {cfg['company']} | {cfg['role']} | {cfg['round_type']}")
        results = retrieve_interview_context(
            company=cfg["company"],
            role=cfg["role"],
            round_type=cfg["round_type"],
            limit=3,
        )

        print(f"Retrieved {len(results)} matching reports:")
        for r in results:
            rounds_summary = []
            for rd in (r.get("rounds") or []):
                t = ",".join(rd.get("type") or [])
                top = ",".join(rd.get("topics") or [])
                diff = rd.get("difficulty") or "N/A"
                rounds_summary.append(f"[{t} / diff: {diff} / topics: {top}]")
            rounds_str = " | ".join(rounds_summary) if rounds_summary else "(no rounds)"

            print(
                f"  - Report ID={r['id']} | {r['company']} ({r['role']}) | "
                f"Tone: {r['tone']} | Distance: {r['distance']:.4f}\n"
                f"    Rounds: {rounds_str}"
            )


if __name__ == "__main__":
    main()
