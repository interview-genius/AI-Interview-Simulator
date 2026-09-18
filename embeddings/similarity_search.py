"""
Step 5 -- Person B: similarity search against stored report embeddings.

Uses pgvector's cosine distance operator (<=>) -- Gemini embeddings are
comparable via cosine similarity, which is the standard choice for text
embeddings (as opposed to L2 distance <->, more common for image/spatial
vectors). Smaller distance = more similar, so ORDER BY ... ASC.

DEPENDENCY NOTE: this will return zero rows (not an error) until Person A's
batch embedding job has actually run and populated structured_reports.embedding.
That's expected, not a bug -- the code is correct and ready, it just has
nothing to search yet.
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


def similarity_search(query_text: str, limit: int = 5) -> list[dict]:
    query_vector = embed_query(query_text)

    sql = """
        SELECT id, company, role, tone, outcome,
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


def check_embeddings_populated() -> int:
    """Quick check so main() can give a clear message instead of a
    confusing empty result if Person A hasn't run her batch job yet."""
    with psycopg2.connect(DB_URL) as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT COUNT(*) FROM structured_reports WHERE embedding IS NOT NULL")
            return cur.fetchone()[0]


def main():
    populated = check_embeddings_populated()
    if populated == 0:
        print("No embeddings stored yet (structured_reports.embedding is all NULL).")
        print("This is expected until Person A's batch embedding job has run.")
        print("Query-side code is ready -- nothing to fix here, just waiting on data.\n")
        return

    print(f"{populated} reports have embeddings stored. Running test queries...\n")

    test_queries = [
        "Google coding round with graphs and dynamic programming",
        "Amazon behavioral round leadership principles",
        "relaxed friendly interview experience",
    ]

    for q in test_queries:
        print(f"Query: {q!r}")
        results = similarity_search(q)
        for r in results:
            print(
    f"  id={r['id']}  "
    f"{r['company']} / {r['role']}  "
    f"tone={r['tone']}  "
    f"outcome={r['outcome']}  "
    f"distance={r['distance']:.4f}"
)
        print()


if __name__ == "__main__":
    main()
