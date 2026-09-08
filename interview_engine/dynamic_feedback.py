"""
Step 10 -- Person A: Dynamic Feedback Engine.

Generates multi-dimensional, mode-specific feedback for completed mock interview sessions
and persists the scoring outcome and transcript into the interview_history table.

Dimension Mappings per Mode:
- Technical Discussion: Technical ability, Communication, Problem solving, Confidence, Depth, Clarity
- HR Round: Communication, Confidence, Resume discussion, Behavioural, STAR, Clarity, Overall recommendation
- Coding Round: Technical ability, Problem solving, Optimisation, Debugging, Communication, Clarity
- ML Round: Technical ability, Problem solving, Resume discussion, Communication, Depth, Clarity
"""

import json
import os
import re
import time
from typing import Any
import psycopg2
import psycopg2.extras
from dotenv import load_dotenv

from interview_engine.feedback_schema import ComprehensiveFeedback, DimensionScore
from interview_engine.adaptive_engine import ADAPTIVE_SESSIONS

load_dotenv()

DB_URL = os.getenv("SUPABASE_DB_URL") or os.getenv("DATABASE_URL")

# Dimension configurations per interview mode
MODE_DIMENSIONS = {
    "technical": [
        "technical_ability",
        "communication",
        "problem_solving",
        "confidence",
        "depth",
        "clarity",
    ],
    "hr": [
        "communication",
        "confidence",
        "resume_discussion",
        "behavioural",
        "star",
        "clarity",
    ],
    "coding": [
        "technical_ability",
        "problem_solving",
        "optimisation",
        "debugging",
        "communication",
        "clarity",
    ],
    "ml": [
        "technical_ability",
        "problem_solving",
        "resume_discussion",
        "communication",
        "depth",
        "clarity",
    ],
}

DIMENSION_DESCRIPTIONS = {
    "technical_ability": "Accuracy, depth of CS/engineering principles, system design, and correctness.",
    "communication": "Clarity of articulation, conciseness, pacing, and structured responses.",
    "problem_solving": "Systematic breakdown, trade-off analysis, edge-case handling, and reasoning under ambiguity.",
    "optimisation": "Algorithm/system efficiency, time/space complexity analysis, and scaling considerations.",
    "debugging": "Root-cause analysis, tracing execution paths, and error diagnosis.",
    "confidence": "Poise, certainty, avoiding unwarranted hesitation or self-contradiction.",
    "resume_discussion": "Authenticity, ownership, and technical specificity in discussing prior work and projects.",
    "behavioural": "Teamwork, leadership, handling disagreements, and STAR methodology.",
    "star": "Structure: Situation -> Task -> Action -> Result with measurable outcomes.",
    "depth": "Substance, concrete examples, internals, versus high-level hand-waving.",
    "clarity": "Conscious, intelligible expression free of clutter.",
}


def retrieve_session_data(session_id: str) -> tuple[str, str, str, str, list[dict[str, str]]]:
    """
    Finds the session across in-memory stores and returns:
    (mode, company, role, level, history)
    """
    # 1. Check Technical Discussion
    try:
        from interview_modes.technical_discussion import SESSIONS as TECH_SESSIONS
        if session_id in TECH_SESSIONS:
            s = TECH_SESSIONS[session_id]
            return "technical", s.company, s.role, s.level, s.history
    except ImportError:
        pass

    # 2. Check HR Round
    try:
        from interview_modes.hr_round import SESSIONS as HR_SESSIONS
        if session_id in HR_SESSIONS:
            s = HR_SESSIONS[session_id]
            return "hr", s.company, s.role, s.level, s.history
    except ImportError:
        pass

    # 3. Check ML Round
    try:
        from interview_engine.conversation import SESSIONS as ML_SESSIONS
        if session_id in ML_SESSIONS:
            s = ML_SESSIONS[session_id]
            return "ml", getattr(s, "company", "Tech Company"), getattr(s, "role", "ML Engineer"), getattr(s, "level", "Mid"), s.history
    except ImportError:
        pass

    # 4. Check Coding Round
    try:
        from interview_engine.coding import SESSIONS as CODING_SESSIONS
        if session_id in CODING_SESSIONS:
            s = CODING_SESSIONS[session_id]
            hist = [{"role": m.role, "content": m.content} for m in getattr(s, "messages", [])]
            return "coding", getattr(s, "company", "Tech Company"), getattr(s, "role", "Software Engineer"), getattr(s, "level", "Mid"), hist
    except ImportError:
        pass

    # 5. Check Adaptive State fallback
    if session_id in ADAPTIVE_SESSIONS:
        return "technical", "Tech Company", "Software Engineer", "Mid", []

    return "technical", "Company", "Candidate", "Mid", []


def format_transcript_for_eval(history: list[dict[str, str]]) -> str:
    """Formats dialogue history into a clear speaker transcript."""
    lines = []
    turn_num = 1
    for msg in history:
        role = "Interviewer" if msg.get("role") in ["assistant", "system"] else "Candidate"
        content = msg.get("content", "").strip()
        if content:
            lines.append(f"[{role} - Turn {turn_num}]: {content}")
            if role == "Candidate":
                turn_num += 1
    return "\n\n".join(lines)


def call_llm_for_feedback(system_prompt: str, user_prompt: str, max_retries: int = 3) -> dict | None:
    """Calls OpenRouter/Groq with structured JSON extraction."""
    groq_key = os.getenv("GROQ_API_KEY")
    if groq_key and not groq_key.startswith("gsk_placeholder"):
        try:
            from groq import Groq
            client = Groq(api_key=groq_key)
            model = os.getenv("GROQ_MODEL", "openai/gpt-oss-20b")
            for attempt in range(max_retries):
                try:
                    res = client.chat.completions.create(
                        model=model,
                        messages=[
                            {"role": "system", "content": system_prompt},
                            {"role": "user", "content": user_prompt},
                        ],
                        temperature=0.2,
                        max_tokens=2048,
                    )
                    content = res.choices[0].message.content or ""
                    match = re.search(r"\{.*\}", content, re.DOTALL)
                    if match:
                        return json.loads(match.group(0))
                except Exception as e:
                    if "429" in str(e) or "rate_limit" in str(e).lower():
                        time.sleep(2 * (attempt + 1))
                        continue
                    print(f"  [Dynamic Feedback Groq error]: {e}")
                    break
        except Exception as e:
            print(f"  [Dynamic Feedback Groq init error]: {e}")

    openrouter_key = os.getenv("OPENROUTER_API_KEY")
    if openrouter_key:
        from openai import OpenAI, RateLimitError
        client = OpenAI(
            base_url=os.getenv("OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1"),
            api_key=openrouter_key,
        )
        model = os.getenv("OPENROUTER_MODEL", "nvidia/nemotron-3-ultra-550b-a55b:free")
        for attempt in range(max_retries):
            try:
                res = client.chat.completions.create(
                    model=model,
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt},
                    ],
                    temperature=0.2,
                    max_tokens=2048,
                )
                if not res or not res.choices:
                    continue
                choice = res.choices[0]
                content = choice.message.content or getattr(choice.message, "reasoning", "") or ""
                match = re.search(r"\{.*\}", content, re.DOTALL)
                if match:
                    return json.loads(match.group(0))
            except Exception as e:
                if "429" in str(e) or isinstance(e, RateLimitError):
                    time.sleep(2 * (attempt + 1))
                    continue
                print(f"  [Dynamic Feedback OpenRouter error]: {e}")
                return None
    return None


def store_interview_history(
    session_id: str,
    company: str,
    role: str,
    round_type: str,
    transcript: list[dict[str, str]],
    feedback: ComprehensiveFeedback,
    user_id: int | None = None,
) -> int | None:
    """Inserts completed interview and feedback into interview_history table."""
    if not DB_URL:
        print("  [warning] DB_URL not set; skipping interview_history persistence.")
        return None
    try:
        with psycopg2.connect(DB_URL) as conn:
            with conn.cursor() as cur:
                sql = """
                    INSERT INTO interview_history (
                        session_id,
                        user_id,
                        company,
                        role,
                        round_type,
                        session_transcript,
                        feedback_result
                    ) VALUES (
                        %(session_id)s,
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
                    "session_id": session_id,
                    "user_id": user_id,
                    "company": company,
                    "role": role,
                    "round_type": round_type,
                    "session_transcript": json.dumps(transcript),
                    "feedback_result": json.dumps(feedback.model_dump()),
                }
                cur.execute(sql, params)
                inserted_id = cur.fetchone()[0]
                conn.commit()
                print(f"  [Dynamic Feedback] Successfully persisted feedback to interview_history (id={inserted_id}, session_id={session_id[:8]})")
                return inserted_id
    except Exception as e:
        print(f"  [error] Failed to persist interview_history: {e}")
        return None


def generate_feedback(session_id: str, explicit_mode: str | None = None) -> ComprehensiveFeedback:
    """
    Generates tailored, multi-dimensional feedback for an interview session
    and stores it in the database.
    """
    mode, company, role, level, history = retrieve_session_data(session_id)
    if explicit_mode:
        mode = explicit_mode

    relevant_dims = MODE_DIMENSIONS.get(mode, MODE_DIMENSIONS["technical"])
    transcript_text = format_transcript_for_eval(history)

    # Build prompt specifying only the mode-relevant dimensions
    dim_instructions = []
    for dim in relevant_dims:
        desc = DIMENSION_DESCRIPTIONS.get(dim, dim)
        dim_instructions.append(f'- "{dim}": score 1-5 (1=weak, 3=average, 5=exceptional) + one concrete, specific tip tied directly to this transcript: "{desc}"')

    system_prompt = f"""You are a principal bar raiser and expert interviewer evaluating a mock interview transcript for:
Company: {company}
Role: {role}
Level: {level}
Interview Mode: {mode.upper()}

CRITICAL INSTRUCTION:
You MUST score ONLY the following relevant dimensions for this {mode} round. Do NOT score irrelevant dimensions:
{chr(10).join(dim_instructions)}

Required JSON Output Format:
{{
  "mode": "{mode}",
{chr(10).join([f'  "{dim}": {{"score": <1-5>, "tip": "<actionable advice>"}},' for dim in relevant_dims])}
  "overall_recommendation": "Strong hire" | "Lean hire" | "Lean no hire" | "No hire",
  "summary_verdict": "<2-3 sentence executive assessment summarizing key strengths and priority improvement areas>"
}}

Be rigorous, honest, and differentiated in scoring. Tailor each tip specifically to what the candidate said or missed in this transcript."""

    user_prompt = f"""TRANSCRIPT TO EVALUATE:
\"\"\"
{transcript_text if transcript_text else "(Short sample interview turn)"}
\"\"\""""

    raw_result = call_llm_for_feedback(system_prompt, user_prompt)
    if not raw_result:
        raw_result = {
            "mode": mode,
            "overall_recommendation": "Lean hire",
            "summary_verdict": "Candidate demonstrated foundational knowledge with opportunities for deeper precision.",
        }
        for dim in relevant_dims:
            raw_result[dim] = {"score": 3, "tip": f"Provide more concrete details and trade-offs regarding {dim}."}

    # Validate and construct ComprehensiveFeedback
    # Explicitly ensure non-applicable dimensions remain None
    feedback_kwargs = {
        "mode": mode,
        "overall_recommendation": raw_result.get("overall_recommendation", "Lean hire"),
        "summary_verdict": raw_result.get("summary_verdict", ""),
    }

    for dim in relevant_dims:
        dim_data = raw_result.get(dim)
        if isinstance(dim_data, dict):
            feedback_kwargs[dim] = DimensionScore(
                score=max(1, min(5, int(dim_data.get("score", 3)))),
                tip=str(dim_data.get("tip", "Provide further concrete details.")),
            )

    feedback = ComprehensiveFeedback(**feedback_kwargs)

    # Persist to interview_history table
    store_interview_history(
        session_id=session_id,
        company=company,
        role=role,
        round_type=mode,
        transcript=history,
        feedback=feedback,
    )

    return feedback
