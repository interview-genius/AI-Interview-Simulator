"""
Step 7 -- Person B: PDF upload endpoint.

FastAPI, not Flask/Django -- picked because the rest of this codebase is
already pydantic-heavy (every extraction step validates through it), and
FastAPI's request/response validation is built directly on pydantic v2,
same version already pinned in requirements.txt. No other web framework
exists anywhere else in this repo, so this is the first and sets the
convention for Steps 8/9/10's endpoints too.

APIRouter, not its own FastAPI() app -- Step 8 needs interview endpoints
living in the same process (one CORS config, one port) rather than a
second server. The single real FastAPI() instance lives in app.py at the
repo root and mounts this router alongside interview_engine/api.py's.

Run with: uvicorn app:app --reload (from the repo root)
"""

import os
import tempfile

from fastapi import APIRouter, File, HTTPException, UploadFile
from fastapi.responses import JSONResponse
import psycopg2
from dotenv import load_dotenv

from resume_intelligence.parse_resume import ensure_table_exists, parse_resume_file, store_resume

load_dotenv()

DB_URL = os.getenv("SUPABASE_DB_URL") or os.getenv("DATABASE_URL")
if not DB_URL:
    raise ValueError("Neither SUPABASE_DB_URL nor DATABASE_URL found in .env")

router = APIRouter()


@router.post("/resumes/upload")
async def upload_resume(file: UploadFile = File(...)):
    if file.content_type != "application/pdf" and not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are accepted.")

    # pdfplumber needs a real file path, not an in-memory stream, so the
    # upload is spooled to a temp file for the duration of extraction.
    with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tmp:
        tmp.write(await file.read())
        tmp_path = tmp.name

    try:
        raw_text, extraction = parse_resume_file(tmp_path)
    finally:
        os.remove(tmp_path)

    if extraction is None:
        raise HTTPException(
            status_code=422,
            detail="Could not extract structured data from this resume.",
        )

    conn = psycopg2.connect(DB_URL)
    try:
        ensure_table_exists(conn)
        resume_id = store_resume(conn, file.filename, raw_text, extraction)
    finally:
        conn.close()

    return JSONResponse(
        status_code=201,
        content={"resume_id": resume_id, "structured_data": extraction.model_dump()},
    )
