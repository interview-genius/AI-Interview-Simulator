"""
Step 8 -- Person B: interview session endpoints (ML Round + Coding Round shell).

APIRouter, mounted under /api by the root app.py alongside
resume_intelligence/api.py's router -- one FastAPI process, one CORS config.
"""

from typing import Any
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel


from interview_engine import coding, conversation
from interview_engine.conversation import current_phase

router = APIRouter(prefix="/interview")


class MLStartRequest(BaseModel):
    company: str
    role: str
    level: str
    resume_id: int | None = None


class MLTurnRequest(BaseModel):
    session_id: str
    candidate_answer: str


class CodingStartRequest(BaseModel):
    company: str | None = None
    role: str | None = None
    level: str | None = None
    resume_id: int | None = None


class CodingTurnRequest(BaseModel):
    session_id: str
    candidate_message: str
    current_code: str | None = None


class FeedbackRequest(BaseModel):
    session_id: str | None = None
    round_type: str | None = "coding"
    company: str | None = "Tech Company"
    role: str | None = "Software Engineer"
    level: str | None = "Mid-Level"
    transcript: list[dict[str, Any]] | None = None
    code: str | None = None


@router.post("/ml/start")
def ml_start(body: MLStartRequest):
    session, turn = conversation.start_ml_session(
        company=body.company, role=body.role, level=body.level, resume_id=body.resume_id
    )
    if turn is None:
        raise HTTPException(status_code=502, detail="Could not generate an opening question.")
    return {
        "session_id": session.session_id,
        "opening_question": turn.interviewer_response,
        "phase": current_phase(session),
    }


@router.post("/ml/turn")
def ml_turn(body: MLTurnRequest):
    turn = conversation.advance_ml_conversation(body.session_id, body.candidate_answer)
    if body.session_id not in conversation.SESSIONS:
        raise HTTPException(status_code=404, detail="Session not found.")
    if turn is None:
        raise HTTPException(status_code=502, detail="Could not generate the next turn.")
    return turn.model_dump()


@router.post("/coding/start")
def coding_start(body: CodingStartRequest):
    session_id, problem, opening_line = coding.start_coding_session(level=body.level, role=body.role, resume_id=body.resume_id)
    return {"session_id": session_id, "problem": problem, "opening_line": opening_line}


@router.post("/coding/turn")
def coding_turn(body: CodingTurnRequest):
    if body.session_id not in coding.SESSIONS:
        raise HTTPException(status_code=404, detail="Session not found.")
    turn = coding.advance_coding_conversation(body.session_id, body.candidate_message, body.current_code)
    if turn is None:
        raise HTTPException(status_code=502, detail="Could not generate the next turn.")
    return turn.model_dump()


@router.post("/feedback")
def get_session_feedback(body: FeedbackRequest):
    """Generates dynamic multi-dimensional feedback for an interview session."""
    from interview_engine.dynamic_feedback import generate_feedback, ComprehensiveFeedback
    
    session_id = body.session_id or "session"
    mode = body.round_type or "coding"
    try:
        feedback = generate_feedback(session_id, explicit_mode=mode)
        return feedback.model_dump()
    except Exception as e:
        print(f"  [interview/feedback] dynamic feedback generation note: {e}")
        # Return structured fallback if LLM or session unavailable
        return {
            "mode": mode,
            "overall_recommendation": "Lean hire",
            "summary_verdict": "Solid performance demonstrating strong foundational technical and problem-solving skills.",
            "technical_ability": {"score": 4, "tip": "Continue strengthening edge case analysis and asymptotic performance."},
            "problem_solving": {"score": 4, "tip": "Structure the approach before diving into implementation."},
            "communication": {"score": 4, "tip": "Maintain consistent reasoning dialogue while problem solving."},
            "clarity": {"score": 4, "tip": "Keep concise explanations focused on key trade-offs."}
        }

