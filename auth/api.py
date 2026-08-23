"""
Step 7 -- Person A: Auth & Profile API Endpoints.

Built with FastAPI matching the conventions of resume_intelligence/api.py:
- POST /signup           -- Register user account & create profile
- POST /login            -- Authenticate and receive access token
- GET  /profile          -- Retrieve candidate profile (requires auth)
- PUT  /profile          -- Update candidate target role, bio, name (requires auth)
- GET  /interview-history -- Query past mock interview runs (requires auth)
- POST /interview-history -- Record a completed interview run (requires auth)

Run with: uvicorn auth.api:app --reload --port 8001
"""

import os
from pathlib import Path
from typing import Any

from dotenv import load_dotenv
from fastapi import FastAPI, Header, HTTPException, Query, status
from fastapi.responses import JSONResponse
import psycopg2
import psycopg2.extras
from pydantic import BaseModel, Field

from auth.auth_utils import (
    create_access_token,
    extract_user_id_from_header,
    hash_password,
    verify_password,
)
from auth.profile import (
    get_user_interview_history,
    get_user_profile,
    record_interview_history,
    update_user_profile,
)

load_dotenv()

DB_URL = os.getenv("SUPABASE_DB_URL") or os.getenv("DATABASE_URL")
if not DB_URL:
    raise ValueError("Neither SUPABASE_DB_URL nor DATABASE_URL found in .env")

app = FastAPI(
    title="Interview Simulator -- Auth & Profiles",
    description="Authentication, candidate profiles, and mock interview session tracking.",
    version="1.0.0",
)


def get_db_connection():
    """Helper to obtain a psycopg2 database connection."""
    return psycopg2.connect(DB_URL)


def ensure_tables_exist(conn):
    """Executes create_users_table.sql to ensure auth and profile tables exist."""
    sql_file = Path(__file__).parent / "create_users_table.sql"
    if sql_file.exists():
        with open(sql_file, "r", encoding="utf-8") as f:
            sql = f.read()
        with conn.cursor() as cur:
            cur.execute(sql)
        conn.commit()


# ---------------------------------------------------------------------------
# Request & Response Schemas
# ---------------------------------------------------------------------------

class SignupRequest(BaseModel):
    email: str = Field(..., min_length=3, max_length=255, description="Candidate email address")
    password: str = Field(..., min_length=6, description="Password (at least 6 characters)")
    display_name: str | None = Field(None, description="Optional candidate display name")


class LoginRequest(BaseModel):
    email: str = Field(..., min_length=3, description="Candidate email address")
    password: str = Field(..., min_length=1, description="Password")


class ProfileUpdateRequest(BaseModel):
    display_name: str | None = None
    target_role: str | None = None
    experience_level: str | None = None
    bio: str | None = None


class RecordInterviewRequest(BaseModel):
    company: str
    role: str
    round_type: str
    session_transcript: list[dict[str, Any]] | dict[str, Any] | None = None
    feedback_result: dict[str, Any] | None = None


# ---------------------------------------------------------------------------
# Authentication Helper
# ---------------------------------------------------------------------------

def require_authenticated_user(authorization: str | None = Header(None)) -> int:
    """Validates the Authorization header and returns the authenticated user_id."""
    user_id = extract_user_id_from_header(authorization)
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid authentication token. Provide Authorization: Bearer <token>",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user_id


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@app.post("/signup", status_code=status.HTTP_201_CREATED)
def signup(req: SignupRequest):
    """Registers a new user account and initializes a candidate profile."""
    conn = get_db_connection()
    try:
        ensure_tables_exist(conn)
        pw_hash = hash_password(req.password)

        # Check if email is already taken
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute("SELECT id FROM users WHERE email = %s;", (req.email.lower(),))
            if cur.fetchone():
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="An account with this email already exists.",
                )

            # Insert new user
            cur.execute(
                "INSERT INTO users (email, password_hash) VALUES (%s, %s) RETURNING id;",
                (req.email.lower(), pw_hash),
            )
            user_id = cur.fetchone()["id"]

            # Initialize profile
            cur.execute(
                "INSERT INTO profiles (user_id, display_name) VALUES (%s, %s);",
                (user_id, req.display_name or req.email.split("@")[0]),
            )
            conn.commit()

        token = create_access_token(user_id=user_id, email=req.email.lower())

        return {
            "message": "User registered successfully",
            "user_id": user_id,
            "email": req.email.lower(),
            "access_token": token,
            "token_type": "bearer",
        }
    finally:
        conn.close()


@app.post("/login")
def login(req: LoginRequest):
    """Authenticates user credentials and returns an access token."""
    conn = get_db_connection()
    try:
        ensure_tables_exist(conn)
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(
                "SELECT id, email, password_hash FROM users WHERE email = %s;",
                (req.email.lower(),),
            )
            user = cur.fetchone()

        if not user or not verify_password(req.password, user["password_hash"]):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password.",
            )

        token = create_access_token(user_id=user["id"], email=user["email"])

        return {
            "message": "Authentication successful",
            "user_id": user["id"],
            "email": user["email"],
            "access_token": token,
            "token_type": "bearer",
        }
    finally:
        conn.close()


@app.get("/profile")
def get_profile(authorization: str | None = Header(None)):
    """Retrieves the candidate profile for the authenticated user."""
    user_id = require_authenticated_user(authorization)
    conn = get_db_connection()
    try:
        ensure_tables_exist(conn)
        profile_data = get_user_profile(conn, user_id)
        if not profile_data:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User profile not found.")
        return {"profile": profile_data}
    finally:
        conn.close()


@app.put("/profile")
def update_profile(req: ProfileUpdateRequest, authorization: str | None = Header(None)):
    """Updates candidate profile information (target role, bio, experience level)."""
    user_id = require_authenticated_user(authorization)
    conn = get_db_connection()
    try:
        ensure_tables_exist(conn)
        updated = update_user_profile(
            conn,
            user_id=user_id,
            display_name=req.display_name,
            target_role=req.target_role,
            experience_level=req.experience_level,
            bio=req.bio,
        )
        return {"message": "Profile updated successfully", "profile": updated}
    finally:
        conn.close()


@app.get("/interview-history")
def list_interview_history(
    limit: int = Query(20, ge=1, le=100),
    authorization: str | None = Header(None),
):
    """Retrieves the past mock interview history sessions for the authenticated user."""
    user_id = require_authenticated_user(authorization)
    conn = get_db_connection()
    try:
        ensure_tables_exist(conn)
        history = get_user_interview_history(conn, user_id=user_id, limit=limit)
        return {"user_id": user_id, "count": len(history), "interview_history": history}
    finally:
        conn.close()


@app.post("/interview-history", status_code=status.HTTP_201_CREATED)
def record_interview(
    req: RecordInterviewRequest,
    authorization: str | None = Header(None),
):
    """Records a completed mock interview transcript and feedback result."""
    user_id = require_authenticated_user(authorization)
    conn = get_db_connection()
    try:
        ensure_tables_exist(conn)
        history_id = record_interview_history(
            conn,
            user_id=user_id,
            company=req.company,
            role=req.role,
            round_type=req.round_type,
            session_transcript=req.session_transcript,
            feedback_result=req.feedback_result,
        )
        return {"message": "Interview session recorded", "interview_history_id": history_id}
    finally:
        conn.close()
