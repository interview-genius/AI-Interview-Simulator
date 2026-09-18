"""
Step 6 -- Person B: open Q&A generation, RAG-style.

Retrieval here duplicates embeddings/similarity_search.py's query shape on
purpose rather than importing it directly -- that function only selects
company/role/tone/outcome (enough to identify a report), but grounding an
actual answer needs the `rounds` JSONB too (the real topics/difficulty
content), so this needs one extra column. Still reuses embed_query from
Step 5 rather than re-embedding differently.
"""

import json
import os

import psycopg2
import psycopg2.extras
from dotenv import load_dotenv
from pydantic import ValidationError

from embeddings.query_embed import embed_query
from interview_engine.qa_prompt import call_groq
from interview_engine.qa_schema import QAAnswer

load_dotenv()

DB_URL = os.getenv("SUPABASE_DB_URL") or os.getenv("DATABASE_URL")
if not DB_URL:
    raise ValueError("Neither SUPABASE_DB_URL nor DATABASE_URL found in .env")


def retrieve_context(question: str, limit: int = 5) -> list[dict]:
    query_vector = embed_query(question)

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


def generate_answer(question: str, limit: int = 5) -> tuple[QAAnswer | None, list[dict]]:
    """Returns (answer, retrieved_reports) -- retrieved_reports is returned
    alongside the answer so callers/tests can check citations actually point
    at reports that were really retrieved, not hallucinated ids."""
    reports = retrieve_context(question, limit=limit)

    raw_output = call_groq(question, reports)
    try:
        data = json.loads(raw_output)
        answer = QAAnswer.model_validate(data)
    except (json.JSONDecodeError, ValidationError) as e:
        print(f"  [error] could not parse/validate QA response: {e}")
        return None, reports

    return answer, reports


def main():
    # Deliberately mixed: two questions with strong data behind them (should
    # come back grounded=true), one about a company with zero rows in the
    # dataset (Netflix -- confirmed absent from structured_reports.company)
    # to see whether the model honestly admits it has nothing, rather than
    # drifting into generic advice.
    test_questions = [
        "What kind of coding topics come up in Google interviews?",
        "What's Amazon's behavioral round like, and what do they focus on?",
        "What should I expect interviewing at Netflix?",
    ]

    for q in test_questions:
        print("=" * 70)
        print(f"Q: {q}")
        answer, reports = generate_answer(q)

        if answer is None:
            print("  FAILED to get a valid answer")
            continue

        retrieved_ids = {r["id"] for r in reports}
        bogus_citations = set(answer.cited_report_ids) - retrieved_ids

        print(f"  grounded: {answer.grounded}")
        print(f"  cited_report_ids: {answer.cited_report_ids}")
        if bogus_citations:
            print(f"  [WARNING] cited ids not among retrieved reports: {bogus_citations}")
        print(f"  answer: {answer.answer}")
        print()


if __name__ == "__main__":
    main()
