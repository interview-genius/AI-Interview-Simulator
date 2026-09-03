"""
Step 8 -- Person A: Technical Discussion Mode.

Conversational, conceptual technical interview round covering:
- Computer Science fundamentals (DBMS, Operating Systems, Networks, OOP, System Architecture)
- Resume & project architecture deep-dives
- Grounded in real past interview reports for the target company/role via RAG retrieval
"""

import json
import os
import re
import time
import uuid
from typing import Any

from dotenv import load_dotenv
from fastapi import APIRouter, HTTPException, status
import psycopg2
import psycopg2.extras
from pydantic import BaseModel, Field

from interview_engine.conversation_schema import ConversationTurn
from interview_engine.retrieval import retrieve_interview_context

load_dotenv()

DB_URL = os.getenv("SUPABASE_DB_URL") or os.getenv("DATABASE_URL")

router = APIRouter(prefix="/interview/technical", tags=["technical-discussion"])

TECHNICAL_PHASES = [
    "core_cs_concepts",
    "dbms_and_storage",
    "os_and_concurrency",
    "networks_and_protocols",
    "oop_and_system_design",
]

PHASE_GOALS = {
    "core_cs_concepts": "Ask foundational questions about core CS principles, data structures, and algorithmic complexity trade-offs.",
    "dbms_and_storage": "Explore database fundamentals (indexing, ACID transactions, isolation levels, SQL vs NoSQL, caching strategies).",
    "os_and_concurrency": "Probe understanding of operating systems (processes vs threads, CPU scheduling, virtual memory/paging, deadlocks, race conditions).",
    "networks_and_protocols": "Investigate computer networks (TCP/IP vs UDP, HTTP/HTTPS lifecycle, DNS resolution, sockets, latency vs throughput).",
    "oop_and_system_design": "Evaluate object-oriented programming principles (SOLID, design patterns, modularity) and high-level architectural trade-offs.",
}


class TechnicalStartRequest(BaseModel):
    company: str
    role: str
    level: str
    resume_id: int | None = None


class TechnicalTurnRequest(BaseModel):
    session_id: str
    candidate_answer: str


class TechnicalSessionState(BaseModel):
    session_id: str
    company: str
    role: str
    level: str
    resume_id: int | None = None
    active_phases: list[str] = Field(default_factory=lambda: list(TECHNICAL_PHASES))
    phase_index: int = 0
    history: list[dict[str, str]] = Field(default_factory=list)
    retrieved_report_ids: list[int] = Field(default_factory=list)


# In-memory session stores
SESSIONS: dict[str, TechnicalSessionState] = {}
SESSION_CONTEXT: dict[str, dict[str, Any]] = {}


def fetch_resume(resume_id: int) -> dict | None:
    if not DB_URL:
        return None
    try:
        with psycopg2.connect(DB_URL, cursor_factory=psycopg2.extras.RealDictCursor) as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT structured_data FROM resumes WHERE id = %s;", (resume_id,))
                row = cur.fetchone()
        return row["structured_data"] if row else None
    except Exception as e:
        print(f"  [warning] Error fetching resume {resume_id}: {e}")
        return None


def format_reports(reports: list[dict]) -> str:
    if not reports:
        return "(no reports retrieved)"
    lines = []
    for r in reports:
        rounds_summary = []
        for rd in (r.get("rounds") or []):
            top = ", ".join(rd.get("topics") or [])
            if top:
                rounds_summary.append(top)
        rounds_text = f" [Topics: {'; '.join(rounds_summary)}]" if rounds_summary else ""
        lines.append(
            f"- Report ID={r['id']}: {r.get('company')} / {r.get('role')} "
            f"(Tone: {r.get('tone') or 'neutral'}){rounds_text}"
        )
    return "\n".join(lines)


def format_resume(resume_data: dict | None) -> str:
    if not resume_data:
        return "No resume provided -- focus on core CS domains (DBMS, OS, Networks, OOP)."
    projects = resume_data.get("projects") or []
    experience = resume_data.get("experience") or []
    lines = ["Candidate Resume Summary:"]
    for exp in experience[:2]:
        lines.append(f"- Experience: {exp.get('title')} at {exp.get('company')}")
    for proj in projects[:2]:
        techs = ", ".join(proj.get("technologies") or [])
        lines.append(f"- Project: {proj.get('name')} ({techs})")
    return "\n".join(lines)


def build_system_message(
    company: str,
    role: str,
    level: str,
    phase: str,
    reports: list[dict],
    resume_data: dict | None,
) -> str:
    return f"""You are an expert senior software engineer conducting a live, voice-driven Technical Discussion mock interview for {role} at {company} (Level: {level}).

CURRENT INTERVIEW PHASE: {phase} -- {PHASE_GOALS.get(phase, 'Technical discussion')}

HISTORICAL INTERVIEW PATTERNS FOR THIS COMPANY & ROLE:
{format_reports(reports)}

{format_resume(resume_data)}

INTERVIEW RULES:
1. PURE CONVERSATIONAL ROUND: This is a spoken technical discussion covering DBMS, OS, Computer Networks, OOP, and Architecture. Do NOT ask for code implementation.
2. ONE QUESTION AT A TIME: Ask exactly ONE focused question or probing follow-up per turn. Keep it concise for spoken dialogue.
3. GROUNDING & CITATIONS: Ground claims about {company}'s real technical patterns in the retrieved reports and cite report IDs in `cited_report_ids`.
4. ADAPTIVE FOLLOW-UPS: If the candidate gives a shallow answer, probe for deeper mechanics (e.g. internals, edge cases, trade-offs).
5. ADVANCE PHASE: Set `advance_phase` to true when the candidate has adequately answered the core question of this phase (typically after 1-2 turns).
6. JSON FORMAT: You MUST return a JSON object with:
   - "interviewer_response": string (your spoken question or response)
   - "cited_report_ids": list of integers
   - "grounded": boolean
   - "advance_phase": boolean
"""


def call_llm(system_message: str, turn_history: list[dict], max_retries: int = 3) -> ConversationTurn | None:
    # 1. Try Groq if a real GROQ_API_KEY is configured
    groq_key = os.getenv("GROQ_API_KEY")
    if groq_key and not groq_key.startswith("gsk_placeholder"):
        try:
            from groq import Groq
            client = Groq(api_key=groq_key)
            model = os.getenv("GROQ_MODEL", "openai/gpt-oss-20b")
            messages = [{"role": "system", "content": system_message}] + turn_history
            res = client.chat.completions.create(
                model=model,
                messages=messages,
                temperature=0.7,
                max_tokens=1024,
            )
            content = res.choices[0].message.content
            return parse_turn_json(content)
        except Exception as e:
            print(f"  [Groq call failed, falling back to OpenRouter]: {e}")

    # 2. Try OpenRouter via OpenAI client
    openrouter_key = os.getenv("OPENROUTER_API_KEY")
    if openrouter_key:
        from openai import OpenAI, RateLimitError
        client = OpenAI(
            base_url=os.getenv("OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1"),
            api_key=openrouter_key,
        )
        model = os.getenv("OPENROUTER_MODEL", "nvidia/nemotron-3-ultra-550b-a55b:free")
        messages = [{"role": "system", "content": system_message}] + turn_history
        for attempt in range(max_retries):
            try:
                res = client.chat.completions.create(
                    model=model,
                    messages=messages,
                    temperature=0.7,
                    max_tokens=1024,
                )
                if not res or not res.choices:
                    continue
                choice = res.choices[0]
                if not choice or not choice.message:
                    continue
                content = choice.message.content or getattr(choice.message, "reasoning", "") or ""
                if content:
                    return parse_turn_json(content)
            except Exception as e:
                if "429" in str(e) or isinstance(e, RateLimitError):
                    time.sleep(3 * (attempt + 1))
                    continue
                print(f"  [OpenRouter call error]: {e}")
                return None
    return None


def parse_turn_json(content: str) -> ConversationTurn | None:
    match = re.search(r"\{.*\}", content, re.DOTALL)
    if match:
        try:
            data = json.loads(match.group(0))
            return ConversationTurn.model_validate(data)
        except Exception:
            pass

    # Fallback to plain text wrapping
    clean_text = content.strip()
    if clean_text:
        return ConversationTurn(
            interviewer_response=clean_text,
            cited_report_ids=[],
            grounded=True,
            advance_phase=False,
        )
    return None


def current_phase(session: TechnicalSessionState) -> str:
    return session.active_phases[min(session.phase_index, len(session.active_phases) - 1)]


def start_technical_session(
    company: str,
    role: str,
    level: str,
    resume_id: int | None = None,
) -> tuple[TechnicalSessionState, ConversationTurn | None]:
    resume_data = fetch_resume(resume_id) if resume_id is not None else None
    reports = retrieve_interview_context(company=company, role=role, round_type="Technical", limit=5)

    session = TechnicalSessionState(
        session_id=str(uuid.uuid4()),
        company=company,
        role=role,
        level=level,
        resume_id=resume_id,
        retrieved_report_ids=[r["id"] for r in reports if "id" in r],
    )

    system_msg = build_system_message(
        company=company,
        role=role,
        level=level,
        phase=current_phase(session),
        reports=reports,
        resume_data=resume_data,
    )
    opening_prompt = [{"role": "user", "content": "(Start the technical discussion round now.)"}]

    turn = call_llm(system_msg, opening_prompt)
    if turn is not None:
        session.history.append({"role": "assistant", "content": turn.interviewer_response})
        if turn.advance_phase and session.phase_index < len(session.active_phases) - 1:
            session.phase_index += 1

    SESSIONS[session.session_id] = session
    SESSION_CONTEXT[session.session_id] = {"reports": reports, "resume_data": resume_data}

    return session, turn


def advance_technical_conversation(session_id: str, candidate_answer: str) -> ConversationTurn | None:
    session = SESSIONS.get(session_id)
    if session is None:
        return None

    ctx = SESSION_CONTEXT.get(session_id, {"reports": [], "resume_data": None})
    session.history.append({"role": "user", "content": candidate_answer})

    system_msg = build_system_message(
        company=session.company,
        role=session.role,
        level=session.level,
        phase=current_phase(session),
        reports=ctx["reports"],
        resume_data=ctx["resume_data"],
    )

    turn = call_llm(system_msg, session.history)
    if turn is None:
        return None

    session.history.append({"role": "assistant", "content": turn.interviewer_response})
    if turn.advance_phase and session.phase_index < len(session.active_phases) - 1:
        session.phase_index += 1

    return turn


# ---------------------------------------------------------------------------
# API Endpoints
# ---------------------------------------------------------------------------

@router.post("/start", status_code=status.HTTP_200_OK)
def technical_start(body: TechnicalStartRequest):
    """Initializes a new Technical Discussion session and generates the opening question."""
    session, turn = start_technical_session(
        company=body.company,
        role=body.role,
        level=body.level,
        resume_id=body.resume_id,
    )
    if turn is None:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Could not generate an opening question for Technical Discussion.",
        )
    return {
        "session_id": session.session_id,
        "opening_question": turn.interviewer_response,
        "phase": current_phase(session),
    }


@router.post("/turn", response_model=ConversationTurn, status_code=status.HTTP_200_OK)
def technical_turn(body: TechnicalTurnRequest):
    """Processes candidate response and returns the interviewer's adaptive follow-up."""
    if body.session_id not in SESSIONS:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found.")

    turn = advance_technical_conversation(body.session_id, body.candidate_answer)
    if turn is None:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Could not generate the next conversation turn.",
        )
    return turn
