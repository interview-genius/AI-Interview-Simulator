"""
Step 8 & Step 10: Session/turn schema for conversational interview rounds.

Provides models for ML, Technical Discussion, and HR Round sessions,
including completion tracking and dynamic feedback attachments.
"""

from typing import Any, Optional
from pydantic import BaseModel, Field

PHASES = ["resume_warmup", "ml_theory", "project_discussion", "case_study", "model_tradeoffs"]

PHASES_REQUIRING_RESUME_CONTENT = {"resume_warmup", "project_discussion"}


class MLSessionState(BaseModel):
    session_id: str
    company: str
    role: str
    level: str
    resume_id: int | None = None
    active_phases: list[str] = Field(
        description="This session's actual phase sequence, after skipping "
                    "any resume-dependent phase with no data to draw on."
    )
    phase_index: int = 0
    history: list[dict] = Field(
        default_factory=list,
        description="Messages array for the Groq multi-turn call: "
                    "[{'role': 'system'|'user'|'assistant', 'content': str}, ...]"
    )
    retrieved_report_ids: list[int] = Field(default_factory=list)


class ConversationTurn(BaseModel):
    interviewer_response: str = Field(
        description="What the interviewer says next."
    )
    cited_report_ids: list[int] = Field(default_factory=list)
    grounded: bool = Field(
        default=True,
        description="True only if this response is genuinely grounded in the "
                    "retrieved reports or the candidate's own resume content."
    )
    advance_phase: bool = Field(
        default=False,
        description="True when the conversation should move to the next topic."
    )
    is_completed: bool = Field(
        default=False,
        description="True if the interview session has concluded."
    )
    feedback: Optional[Any] = Field(
        default=None,
        description="ComprehensiveFeedback object populated when the interview concludes."
    )
