"""
Step 7 -- Person A: Profile & Interview History Data Access Layer.

Encapsulates database operations for:
- Retrieving and updating candidate profile data
- Querying past mock interview history sessions
- Recording new completed interview sessions
"""

import json
from typing import Any

import psycopg2
import psycopg2.extras


def get_user_profile(conn, user_id: int) -> dict[str, Any] | None:
    """Retrieves user profile and account details by user_id."""
    sql = """
        SELECT 
            u.id AS user_id,
            u.email,
            u.created_at AS account_created_at,
            p.display_name,
            p.target_role,
            p.experience_level,
            p.bio,
            p.updated_at AS profile_updated_at
        FROM users u
        LEFT JOIN profiles p ON u.id = p.user_id
        WHERE u.id = %(user_id)s;
    """
    with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
        cur.execute(sql, {"user_id": user_id})
        return cur.fetchone()


def update_user_profile(
    conn,
    user_id: int,
    display_name: str | None = None,
    target_role: str | None = None,
    experience_level: str | None = None,
    bio: str | None = None,
) -> dict[str, Any]:
    """Updates or inserts (upserts) profile fields for a user."""
    sql = """
        INSERT INTO profiles (user_id, display_name, target_role, experience_level, bio, updated_at)
        VALUES (
            %(user_id)s,
            %(display_name)s,
            %(target_role)s,
            %(experience_level)s,
            %(bio)s,
            NOW()
        )
        ON CONFLICT (user_id) DO UPDATE SET
            display_name = COALESCE(%(display_name)s, profiles.display_name),
            target_role = COALESCE(%(target_role)s, profiles.target_role),
            experience_level = COALESCE(%(experience_level)s, profiles.experience_level),
            bio = COALESCE(%(bio)s, profiles.bio),
            updated_at = NOW()
        RETURNING user_id, display_name, target_role, experience_level, bio, updated_at;
    """
    params = {
        "user_id": user_id,
        "display_name": display_name,
        "target_role": target_role,
        "experience_level": experience_level,
        "bio": bio,
    }
    with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
        cur.execute(sql, params)
        conn.commit()
        return cur.fetchone()


def get_user_interview_history(
    conn,
    user_id: int,
    limit: int = 20,
) -> list[dict[str, Any]]:
    """Retrieves all past interview history records for a user."""
    sql = """
        SELECT 
            id,
            user_id,
            company,
            role,
            round_type,
            session_transcript,
            feedback_result,
            created_at
        FROM interview_history
        WHERE user_id = %(user_id)s
        ORDER BY created_at DESC
        LIMIT %(limit)s;
    """
    with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
        cur.execute(sql, {"user_id": user_id, "limit": limit})
        return cur.fetchall()


def record_interview_history(
    conn,
    user_id: int,
    company: str,
    role: str,
    round_type: str,
    session_transcript: list[dict[str, Any]] | dict[str, Any] | None = None,
    feedback_result: dict[str, Any] | None = None,
) -> int:
    """Inserts a completed interview transcript and scoring outcome into interview_history."""
    sql = """
        INSERT INTO interview_history (
            user_id,
            company,
            role,
            round_type,
            session_transcript,
            feedback_result
        ) VALUES (
            %(user_id)s,
            %(company)s,
            %(role)s,
            %(round_type)s,
            %(session_transcript)s,
            %(feedback_result)s
        )
        RETURNING id;
    """
    params = {
        "user_id": user_id,
        "company": company,
        "role": role,
        "round_type": round_type,
        "session_transcript": json.dumps(session_transcript) if session_transcript is not None else None,
        "feedback_result": json.dumps(feedback_result) if feedback_result is not None else None,
    }
    with conn.cursor() as cur:
        cur.execute(sql, params)
        conn.commit()
        return cur.fetchone()[0]
