"""
Step 8 -- Person A: HR & Behavioral Round Mode.

Resume-driven behavioural and cultural fit interview round:
- Tell me about yourself & background walkthrough
- Deep-dive into specific internship/work experiences from candidate's resume
- Leadership, conflict resolution, and teamwork examples (STAR method)
- Company motivation & situational judgment
- Grounded in candidate's parsed resume JSON (not RAG reports)
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
from interview_engine.adaptive_engine import evaluate_and_decide

load_dotenv()

DB_URL = os.getenv("SUPABASE_DB_URL") or os.getenv("DATABASE_URL")

router = APIRouter(prefix="/interview/hr", tags=["hr-round"])

HR_PHASES = [
    "introduction",
    "resume_experience_dive",
    "leadership_and_teamwork",
    "company_motivation",
    "situational_challenges",
]

HR_PHASE_GOALS = {
    "introduction": "Warmly greet the candidate, introduce the HR round, and ask them to introduce themselves and highlight their journey.",
    "resume_experience_dive": "Ask about a specific project, internship, or work experience from the candidate's resume, focusing on their personal contributions.",
    "leadership_and_teamwork": "Ask a behavioral question about leadership, collaboration, handling disagreements with teammates, or taking ownership (STAR format).",
    "company_motivation": "Ask why the candidate wants to work at this specific company in this role, and what aligns them with the company's culture.",
    "situational_challenges": "Ask how the candidate handles failure, tight deadlines, ambiguity, or constructive feedback.",
}


class HRStartRequest(BaseModel):
    company: str
    role: str
    level: str
    resume_id: int | None = None


class HRTurnRequest(BaseModel):
    session_id: str
    candidate_answer: str


class HRSessionState(BaseModel):
    session_id: str
    company: str
    role: str
    level: str
    resume_id: int | None = None
    active_phases: list[str] = Field(default_factory=lambda: list(HR_PHASES))
    phase_index: int = 0
    history: list[dict[str, str]] = Field(default_factory=list)


# In-memory session stores
SESSIONS: dict[str, HRSessionState] = {}
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


def format_resume_details(resume_data: dict | None) -> str:
    if not resume_data:
        return "No resume provided -- ask general behavioral questions applicable to software candidates."

    lines = ["Candidate Resume Summary:"]

    education = resume_data.get("education") or []
    if education:
        for edu in education[:1]:
            lines.append(f"- Education: {edu.get('degree') or 'Degree'} in {edu.get('field_of_study') or 'Field'} from {edu.get('institution')}")

    experience = resume_data.get("experience") or []
    if experience:
        lines.append("- Work / Internship Experience:")
        for exp in experience[:2]:
            company = exp.get("company", "Company")
            title = exp.get("title", "Role")
            bullets = "; ".join(exp.get("bullets", [])[:2])
            lines.append(f"  * {title} at {company}: {bullets}")

    projects = resume_data.get("projects") or []
    if projects:
        lines.append("- Notable Projects:")
        for proj in projects[:2]:
            name = proj.get("name", "Project")
            techs = ", ".join(proj.get("technologies", []))
            bullets = "; ".join(proj.get("bullets", [])[:2])
            lines.append(f"  * {name} ({techs}): {bullets}")

    leadership = resume_data.get("leadership") or []
    if leadership:
        lines.append("- Leadership & Activities:")
        for lead in leadership[:2]:
            org = lead.get("organization", "Org")
            role = lead.get("role", "Leader")
            lines.append(f"  * {role} at {org}")

    return "\n".join(lines)


def build_hr_system_message(
    company: str,
    role: str,
    level: str,
    phase: str,
    resume_data: dict | None,
    adaptive_guidance: str = "",
) -> str:
    guidance_section = f"\nADAPTIVE CONVERSATION GUIDANCE:\n{adaptive_guidance}\n" if adaptive_guidance else ""
    return f"""You are a supportive, insightful HR / Behavioral Interviewer conducting a live mock interview for {role} at {company} (Target Level: {level}).

CURRENT PHASE: {phase} -- {HR_PHASE_GOALS.get(phase, 'Behavioral interview')}
{guidance_section}
{format_resume_details(resume_data)}

HR INTERVIEW RULES:
1. PERSONALIZED QUESTIONS: Anchor your questions directly to the candidate's real resume details (past internships, projects, leadership positions) whenever available.
2. ONE QUESTION AT A TIME: Ask exactly ONE clear, thoughtful behavioral question or follow-up per turn. Keep it conversational and spoken-dialogue friendly.
3. STAR METHOD PROBING: Prompt candidates to share concrete Situations, Tasks, Actions, and Results. If their answer is generic, gently ask for a specific story or measurable outcome.
4. NO TECHNICAL CODING: This is strictly an HR/Behavioral round. Do NOT ask algorithmic or syntax questions.
5. ADAPTIVE FOLLOW-UPS: Follow the adaptive conversation guidance. If instructed to probe, ask a targeted follow-up. If instructed to advance, transition smoothly.
6. JSON FORMAT: You MUST return a JSON object with:
   - "interviewer_response": string (your spoken greeting, question, or follow-up)
   - "cited_report_ids": [] (empty array since HR is resume-grounded)
   - "grounded": boolean (true if consistent with resume and company context)
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
                    max_tokens=2048,
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


def extract_inner_interviewer_response(data: Any) -> str:
    """Extracts and unwraps the inner plain text interviewer response."""
    if isinstance(data, dict):
        val = data.get("interviewer_response", "")
        return extract_inner_interviewer_response(val)

    text = str(data).strip()
    if text.startswith("{") and '"interviewer_response"' in text:
        match = re.search(r"\{.*\}", text, re.DOTALL)
        if match:
            try:
                nested = json.loads(match.group(0))
                if isinstance(nested, dict) and "interviewer_response" in nested:
                    return extract_inner_interviewer_response(nested["interviewer_response"])
            except Exception:
                pass
    return text


def parse_turn_json(content: str) -> ConversationTurn | None:
    """Parses LLM structured response and extracts the inner plain text interviewer_response."""
    content = content.strip()

    # 1. Standard JSON object extraction
    match = re.search(r"\{.*\}", content, re.DOTALL)
    if match:
        try:
            data = json.loads(match.group(0))
            if isinstance(data, dict):
                clean_response = extract_inner_interviewer_response(data.get("interviewer_response", ""))
                if clean_response:
                    return ConversationTurn(
                        interviewer_response=clean_response,
                        cited_report_ids=data.get("cited_report_ids", []),
                        grounded=bool(data.get("grounded", True)),
                        advance_phase=bool(data.get("advance_phase", False)),
                    )
        except Exception:
            pass

    # 2. Resilient regex extraction for truncated JSON
    resp_match = re.search(r'"interviewer_response"\s*:\s*"((?:[^"\\]|\\.)*)', content)
    if resp_match:
        try:
            raw_val = f'"{resp_match.group(1)}"'
            extracted_text = json.loads(raw_val)
        except Exception:
            extracted_text = resp_match.group(1).replace('\\"', '"').replace('\\n', '\n')

        clean_text = extract_inner_interviewer_response(extracted_text)
        if clean_text:
            grounded_match = re.search(r'"grounded"\s*:\s*(true|false)', content, re.IGNORECASE)
            advance_match = re.search(r'"advance_phase"\s*:\s*(true|false)', content, re.IGNORECASE)
            return ConversationTurn(
                interviewer_response=clean_text,
                cited_report_ids=[],
                grounded=grounded_match.group(1).lower() == "true" if grounded_match else True,
                advance_phase=advance_match.group(1).lower() == "true" if advance_match else False,
            )

    # 3. Log a clear error if JSON parsing fails and clean any raw JSON syntax artifacts
    print(f"  [ERROR] Failed to parse structured JSON from LLM output. Raw snippet: {content[:160]}...")
    clean_fallback = re.sub(r'[{}\[\]"]', '', content)
    clean_fallback = re.sub(
        r'^(?:interviewer_response|cited_report_ids|grounded|advance_phase)\s*:\s*',
        '',
        clean_fallback,
        flags=re.MULTILINE,
    ).strip()

    if clean_fallback:
        return ConversationTurn(
            interviewer_response=clean_fallback,
            cited_report_ids=[],
            grounded=True,
            advance_phase=False,
        )
    return None


def current_phase(session: HRSessionState) -> str:
    return session.active_phases[min(session.phase_index, len(session.active_phases) - 1)]


def start_hr_session(
    company: str,
    role: str,
    level: str,
    resume_id: int | None = None,
) -> tuple[HRSessionState, ConversationTurn | None]:
    resume_data = fetch_resume(resume_id) if resume_id is not None else None

    session = HRSessionState(
        session_id=str(uuid.uuid4()),
        company=company,
        role=role,
        level=level,
        resume_id=resume_id,
    )

    system_msg = build_hr_system_message(
        company=company,
        role=role,
        level=level,
        phase=current_phase(session),
        resume_data=resume_data,
    )
    opening_prompt = [{"role": "user", "content": "(Start the HR / behavioral interview round now.)"}]

    turn = call_llm(system_msg, opening_prompt)
    if turn is not None:
        session.history.append({"role": "assistant", "content": turn.interviewer_response})
        if turn.advance_phase and session.phase_index < len(session.active_phases) - 1:
            session.phase_index += 1

    SESSIONS[session.session_id] = session
    SESSION_CONTEXT[session.session_id] = {"resume_data": resume_data}

    return session, turn


def advance_hr_conversation(session_id: str, candidate_answer: str) -> ConversationTurn | None:
    session = SESSIONS.get(session_id)
    if session is None:
        return None

    ctx = SESSION_CONTEXT.get(session_id, {"resume_data": None})
    session.history.append({"role": "user", "content": candidate_answer})

    active_phase = current_phase(session)
    decision = evaluate_and_decide(
        session_id=session_id,
        topic=active_phase,
        candidate_answer=candidate_answer,
        interview_type="hr",
    )

    if decision.should_interrupt:
        guidance = f"INTERRUPT AND REDIRECT: Intervene immediately to address a major contradiction or redirect: {decision.reasoning}"
    elif decision.next_action == "follow_up":
        guidance = f"FOLLOW-UP PROBE: Ask a focused behavioral/STAR follow-up on {active_phase} to dig deeper into specific actions, results, or challenges (depth={decision.depth_score}/5). Reason: {decision.reasoning}. Do not change topics."
    else:
        guidance = f"TRANSITION TO NEXT TOPIC: Candidate gave a strong, well-structured STAR response (depth={decision.depth_score}/5, conf={decision.confidence_score}/5). Briefly acknowledge and smoothly transition to the next phase."

    system_msg = build_hr_system_message(
        company=session.company,
        role=session.role,
        level=session.level,
        phase=active_phase,
        resume_data=ctx["resume_data"],
        adaptive_guidance=guidance,
    )

    turn = call_llm(system_msg, session.history)
    if turn is None:
        return None

    # Advance phase when adaptive engine decides on new_topic / wrap_topic
    advance = decision.next_action in ["new_topic", "wrap_topic"]
    turn.advance_phase = advance

    session.history.append({"role": "assistant", "content": turn.interviewer_response})
    if advance and session.phase_index < len(session.active_phases) - 1:
        session.phase_index += 1

    return turn


# ---------------------------------------------------------------------------
# API Endpoints
# ---------------------------------------------------------------------------

@router.post("/start", status_code=status.HTTP_200_OK)
def hr_start(body: HRStartRequest):
    """Initializes a new HR / Behavioral round session with resume-driven personalization."""
    session, turn = start_hr_session(
        company=body.company,
        role=body.role,
        level=body.level,
        resume_id=body.resume_id,
    )
    if turn is None:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Could not generate an opening question for the HR round.",
        )
    return {
        "session_id": session.session_id,
        "opening_question": turn.interviewer_response,
        "phase": current_phase(session),
    }


@router.post("/turn", response_model=ConversationTurn, status_code=status.HTTP_200_OK)
def hr_turn(body: HRTurnRequest):
    """Processes candidate answer and returns the interviewer's next behavioral follow-up."""
    if body.session_id not in SESSIONS:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found.")

    turn = advance_hr_conversation(body.session_id, body.candidate_answer)
    if turn is None:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Could not generate the next conversation turn.",
        )
    return turn
