import os
import json
import time

import psycopg2
import psycopg2.extras
from dotenv import load_dotenv
from google import genai
from google.genai import types


# --------------------------------------------------
# Configuration
# --------------------------------------------------

load_dotenv()

DATABASE_URL = (
    os.getenv("SUPABASE_DB_URL")
    or os.getenv("DATABASE_URL")
)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if not DATABASE_URL:
    raise ValueError(
        "Neither SUPABASE_DB_URL nor DATABASE_URL found in .env"
    )

if not GEMINI_API_KEY:
    raise ValueError(
        "GEMINI_API_KEY not found in .env"
    )


client = genai.Client(api_key=GEMINI_API_KEY)


# --------------------------------------------------
# Database connection
# --------------------------------------------------

def get_connection():
    return psycopg2.connect(
        DATABASE_URL,
        cursor_factory=psycopg2.extras.RealDictCursor
    )


# --------------------------------------------------
# Build embedding summary
# --------------------------------------------------

def build_summary(report: dict) -> str:
    """
    Creates one searchable text document for a structured report.

    Example:

    Google SWE New Grad technical covering graphs, bfs, dfs
    Google SWE New Grad behavioral covering leadership, teamwork
    """

    company = report.get("company") or "Unknown company"
    role = report.get("role") or "Unknown role"

    rounds = report.get("rounds") or []

    summaries = []

    for round_data in rounds:

        round_types = round_data.get("type") or []
        topics = round_data.get("topics") or []

        if isinstance(round_types, str):
            round_types = [round_types]

        if isinstance(topics, str):
            topics = [topics]

        round_type_text = ", ".join(round_types)
        topics_text = ", ".join(topics)

        summary = (
            f"{company} "
            f"{role} "
            f"{round_type_text} "
            f"covering {topics_text}"
        )

        summaries.append(summary)

    # If the report has no rounds, still create useful text
    if not summaries:
        return (
            f"{company} "
            f"{role} "
            f"interview report"
        )

    return "\n".join(summaries)


# --------------------------------------------------
# Generate Gemini embedding
# --------------------------------------------------

def generate_embedding(text: str) -> list[float]:
    """
    Generates a 768-dimensional document embedding.
    """

    response = client.models.embed_content(
        model="gemini-embedding-001",
        contents=text,
        config=types.EmbedContentConfig(
            task_type="RETRIEVAL_DOCUMENT",
            output_dimensionality=768,
        ),
    )

    return response.embeddings[0].values


# --------------------------------------------------
# Get reports without embeddings
# --------------------------------------------------

def get_reports_without_embeddings():
    query = """
        SELECT
            raw_report_id,
            company,
            role,
            rounds
        FROM structured_reports
        WHERE embedding IS NULL
        ORDER BY raw_report_id;
    """

    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(query)
            return cur.fetchall()


# --------------------------------------------------
# Store embedding
# --------------------------------------------------

def save_embedding(raw_report_id, embedding):
    """
    pgvector accepts the vector as:
    [0.123, 0.456, ...]
    """

    embedding_string = json.dumps(embedding)

    query = """
        UPDATE structured_reports
        SET embedding = %s::vector
        WHERE raw_report_id = %s;
    """

    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                query,
                (
                    embedding_string,
                    raw_report_id
                )
            )

        conn.commit()


# --------------------------------------------------
# Main batch job
# --------------------------------------------------

def main():

    reports = get_reports_without_embeddings()

    print("=" * 70)
    print("STEP 5 — GENERATING DOCUMENT EMBEDDINGS")
    print("=" * 70)

    print(f"Reports needing embeddings: {len(reports)}")
    print()

    if not reports:
        print("All reports already have embeddings.")
        return

    successful = 0
    failed = 0

    for index, report in enumerate(reports, start=1):

        report_id = report["raw_report_id"]

        try:

            summary = build_summary(report)

            print(
                f"[{index}/{len(reports)}] "
                f"Processing report ID {report_id}"
            )

            print(f"Summary: {summary}")

            embedding = generate_embedding(summary)

            # Safety check
            if len(embedding) != 768:
                raise ValueError(
                    f"Expected embedding dimension 768, "
                    f"got {len(embedding)}"
                )

            save_embedding(
                report_id,
                embedding
            )

            successful += 1

            print(
                f"SUCCESS — Report {report_id} "
                f"stored with {len(embedding)} dimensions"
            )

            print("-" * 70)

            # Small delay between API calls
            time.sleep(0.2)

        except Exception as e:

            failed += 1

            print(
                f"FAILED — Report {report_id}: {e}"
            )

            print("-" * 70)

    print()
    print("=" * 70)
    print("EMBEDDING JOB COMPLETE")
    print("=" * 70)

    print(f"Successful: {successful}")
    print(f"Failed:     {failed}")


if __name__ == "__main__":
    main()