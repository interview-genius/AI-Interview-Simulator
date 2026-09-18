"""
Step 7 -- Person B: orchestrates PDF -> text -> LLM extraction -> validated
structured resume, and storage.

user_id is optional and unused for now (defaults to NULL) -- there's no
real user system to link against yet. Pass it once Person A's Step 7 half
exists, per the "Together" step.
"""

import json
import os
import time

import psycopg2
import psycopg2.extras
from dotenv import load_dotenv
from groq import BadRequestError, RateLimitError
from pydantic import ValidationError

from resume_intelligence.extract_text import extract_text_from_pdf
from resume_intelligence.resume_prompt import call_groq
from resume_intelligence.resume_schema import ResumeExtraction

load_dotenv()

DB_URL = os.getenv("SUPABASE_DB_URL") or os.getenv("DATABASE_URL")
if not DB_URL:
    raise ValueError("Neither SUPABASE_DB_URL nor DATABASE_URL found in .env")


def ensure_table_exists(conn):
    with open("resume_intelligence/create_resumes_table.sql") as f:
        sql = f.read()
    with conn.cursor() as cur:
        cur.execute(sql)
    conn.commit()


def call_groq_with_retry(resume_text: str, max_retries: int = 4) -> str | None:
    for attempt in range(max_retries):
        try:
            return call_groq(resume_text)
        except RateLimitError:
            wait = 5 * (attempt + 1)
            print(f"    [rate limited] waiting {wait}s (retry {attempt+1}/{max_retries})...")
            time.sleep(wait)
        except BadRequestError as e:
            print(f"    [error] Groq rejected the generation (likely truncated): {e}")
            return None
    return None


def parse_resume_text(resume_text: str) -> ResumeExtraction | None:
    raw_output = call_groq_with_retry(resume_text)
    if raw_output is None:
        return None
    try:
        data = json.loads(raw_output)
    except json.JSONDecodeError as e:
        print(f"    [error] invalid JSON: {e}")
        return None
    try:
        return ResumeExtraction.model_validate(data)
    except ValidationError as e:
        print(f"    [error] schema mismatch: {e}")
        return None


def parse_resume_file(file_path: str) -> tuple[str, ResumeExtraction | None]:
    """Returns (raw_text, extraction) -- raw_text is always returned (even on
    extraction failure) so callers can inspect what pdfplumber actually saw."""
    raw_text = extract_text_from_pdf(file_path)
    extraction = parse_resume_text(raw_text)
    return raw_text, extraction


def store_resume(conn, source_filename: str, raw_text: str,
                  extraction: ResumeExtraction, user_id: int | None = None) -> int:
    with conn.cursor() as cur:
        cur.execute(
            """
            INSERT INTO resumes (user_id, source_filename, raw_text, structured_data)
            VALUES (%s, %s, %s, %s)
            RETURNING id
            """,
            (user_id, source_filename, raw_text, json.dumps(extraction.model_dump())),
        )
        resume_id = cur.fetchone()[0]
    conn.commit()
    return resume_id


def main():
    """Batch-tests parsing against every PDF in resume_intelligence/test_resumes/
    (gitignored -- real resumes, not committed). Logs where extraction looks
    thin/broken per the spec's ask, rather than just confirming it ran."""
    test_dir = "resume_intelligence/test_resumes"
    if not os.path.isdir(test_dir):
        print(f"No {test_dir}/ directory found -- nothing to test against.")
        return

    pdf_files = [f for f in os.listdir(test_dir) if f.lower().endswith(".pdf")]
    print(f"Found {len(pdf_files)} PDF(s) in {test_dir}/\n")

    conn = psycopg2.connect(DB_URL)
    ensure_table_exists(conn)

    for filename in pdf_files:
        path = os.path.join(test_dir, filename)
        print(f"--- {filename} ---")

        raw_text = extract_text_from_pdf(path)
        print(f"  extracted {len(raw_text)} chars of raw text")
        if len(raw_text.strip()) < 50:
            print("  [WARNING] almost no text extracted -- likely a scanned/image-only PDF")

        extraction = parse_resume_text(raw_text)
        if extraction is None:
            print("  EXTRACTION FAILED")
            print()
            continue

        resume_id = store_resume(conn, filename, raw_text, extraction)
        print(f"  stored as resumes.id={resume_id}")
        print(f"  education={len(extraction.education)}  experience={len(extraction.experience)}  "
              f"projects={len(extraction.projects)}  skills={len(extraction.skills)}  "
              f"leadership={len(extraction.leadership)}  achievements={len(extraction.achievements)}")

        if not extraction.experience and not extraction.education and not extraction.projects:
            print("  [WARNING] every major section came back empty -- likely an extraction failure, "
                  "not a genuinely empty resume")

        print()
        time.sleep(3)  # stay under free-tier TPM cap

    conn.close()


if __name__ == "__main__":
    main()
