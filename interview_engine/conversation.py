"""
Step 8 -- Person B: ML Round session orchestration.

In-memory session store (SESSIONS/SESSION_CONTEXT) -- an explicit
hackathon-scope shortcut, lost on restart. No user_id to persist against
yet anyway (resumes.user_id isn't a real FK until Person A's Step 7 auth
half exists).

resume_id is optional and, when given, looked up by exact id (never an
unfiltered "grab a resume" query) so a session can never silently attach
the wrong candidate's resume even though the table holds many rows.
"""

import json
import os
import time
import uuid

import psycopg2
import psycopg2.extras
from dotenv import load_dotenv
from groq import BadRequestError, RateLimitError
from pydantic import ValidationError

from interview_engine.prep_qa import retrieve_context
from interview_engine.conversation_prompt import call_groq
from interview_engine.conversation_schema import (
    PHASES,
    PHASES_REQUIRING_RESUME_CONTENT,
    ConversationTurn,
    MLSessionState,
)

load_dotenv()

DB_URL = os.getenv("SUPABASE_DB_URL") or os.getenv("DATABASE_URL")
if not DB_URL:
    raise ValueError("Neither SUPABASE_DB_URL nor DATABASE_URL found in .env")

SESSIONS: dict[str, MLSessionState] = {}
SESSION_CONTEXT: dict[str, dict] = {}  # session_id -> {"reports": [...], "resume_data": dict | None}


def fetch_resume(resume_id: int) -> dict | None:
    with psycopg2.connect(DB_URL, cursor_factory=psycopg2.extras.RealDictCursor) as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT structured_data FROM resumes WHERE id = %s", (resume_id,))
            row = cur.fetchone()
    return row["structured_data"] if row else None


def compute_active_phases(resume_data: dict | None) -> list[str]:
    has_resume_content = bool(
        resume_data and (resume_data.get("projects") or resume_data.get("experience"))
    )
    if has_resume_content:
        return list(PHASES)
    return [p for p in PHASES if p not in PHASES_REQUIRING_RESUME_CONTENT]


def call_groq_with_retry(*args, max_retries: int = 4, **kwargs) -> str | None:
    for attempt in range(max_retries):
        try:
            return call_groq(*args, **kwargs)
        except RateLimitError:
            wait = 5 * (attempt + 1)
            print(f"    [rate limited] waiting {wait}s (retry {attempt+1}/{max_retries})...")
            time.sleep(wait)
        except BadRequestError as e:
            print(f"    [error] Groq rejected the generation: {e}")
            return None
    return None


def current_phase(session: MLSessionState) -> str:
    return session.active_phases[min(session.phase_index, len(session.active_phases) - 1)]


def _generate_turn(session: MLSessionState, reports: list[dict], resume_data: dict | None,
                    is_opening: bool) -> ConversationTurn | None:
    phase = current_phase(session)
    turn_history = session.history
    if is_opening:
        # Synthetic nudge to produce an opening question -- not a real
        # candidate utterance, so it's never persisted into session.history.
        turn_history = turn_history + [{"role": "user", "content": "(Begin this phase now.)"}]

    raw = call_groq_with_retry(
        session.company, session.role, session.level, phase, reports, resume_data, turn_history
    )
    if raw is None:
        return None
    try:
        data = json.loads(raw)
        return ConversationTurn.model_validate(data)
    except (json.JSONDecodeError, ValidationError) as e:
        print(f"    [error] could not parse/validate conversation turn: {e}")
        return None


def start_ml_session(company: str, role: str, level: str,
                      resume_id: int | None = None) -> tuple[MLSessionState, ConversationTurn | None]:
    resume_data = fetch_resume(resume_id) if resume_id is not None else None
    active_phases = compute_active_phases(resume_data)
    reports = retrieve_context(f"{company} {role} interview", limit=5)

    session = MLSessionState(
        session_id=str(uuid.uuid4()),
        company=company,
        role=role,
        level=level,
        resume_id=resume_id,
        active_phases=active_phases,
        phase_index=0,
        history=[],
        retrieved_report_ids=[r["id"] for r in reports],
    )

    turn = _generate_turn(session, reports, resume_data, is_opening=True)
    if turn is not None:
        session.history.append({"role": "assistant", "content": turn.interviewer_response})
        if turn.advance_phase and session.phase_index < len(session.active_phases) - 1:
            session.phase_index += 1

    SESSIONS[session.session_id] = session
    SESSION_CONTEXT[session.session_id] = {"reports": reports, "resume_data": resume_data}
    return session, turn


def advance_ml_conversation(session_id: str, candidate_answer: str) -> ConversationTurn | None:
    session = SESSIONS.get(session_id)
    if session is None:
        return None
    ctx = SESSION_CONTEXT[session_id]

    session.history.append({"role": "user", "content": candidate_answer})
    turn = _generate_turn(session, ctx["reports"], ctx["resume_data"], is_opening=False)
    if turn is None:
        return None

    session.history.append({"role": "assistant", "content": turn.interviewer_response})
    if turn.advance_phase and session.phase_index < len(session.active_phases) - 1:
        session.phase_index += 1

    return turn


def main():
    """Scripted grounding/drift self-test, same pattern as prep_qa.py's:
    Google (real data present) should come back grounded with citations,
    Netflix (confirmed absent from structured_reports) should not."""
    for company in ["Google", "Netflix"]:
        print("=" * 70)
        print(f"Starting ML round session -- company={company}")
        session, turn = start_ml_session(company=company, role="ML Engineer", level="New Grad")
        if turn is None:
            print("  FAILED to get an opening turn")
            continue
        print(f"  phase: {current_phase(session)}  active_phases: {session.active_phases}")
        print(f"  grounded: {turn.grounded}  cited_report_ids: {turn.cited_report_ids}")
        print(f"  interviewer: {turn.interviewer_response}")

        turn2 = advance_ml_conversation(session.session_id, "I don't have much experience with that, honestly.")
        if turn2:
            print(f"  [turn 2] grounded: {turn2.grounded}  cited_report_ids: {turn2.cited_report_ids}")
            print(f"  [turn 2] interviewer: {turn2.interviewer_response}")
        print()


if __name__ == "__main__":
    main()
