"""
Step 8 -- Person B: ML Round mode session/turn schema.

PHASES is the spec's own ordered list (resume -> ML theory -> project
discussion -> case studies -> model/trade-offs). Not every phase applies
to every session -- resume_warmup and project_discussion both need real
resume project/experience data, which isn't guaranteed to exist (a real
resume tested in Step 7, Portfolio_MyCV.pdf, had zero Experience entries).
conversation.py computes each session's actual phase sequence at start
time by skipping phases whose data dependency isn't met, rather than
forcing a generic fallback question -- same "skip over guess" discipline
every other Groq prompt in this repo already applies per-field, just
applied here at the phase level.
"""

from pydantic import BaseModel, Field

PHASES = ["resume_warmup", "ml_theory", "project_discussion", "case_study", "model_tradeoffs"]

# Phases in this set are skipped for a session with no resume_id, or a
# resume with no project/experience content to draw a real question from.
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
        description="What the interviewer says next. If grounded is false, "
                    "this should say plainly the retrieved data doesn't cover "
                    "this well -- not fall back to generic, unsourced claims."
    )
    cited_report_ids: list[int] = Field(default_factory=list)
    grounded: bool = Field(
        description="True only if this response is genuinely grounded in the "
                    "retrieved reports or the candidate's own resume content."
    )
    advance_phase: bool = Field(
        description="True when the model judges this phase sufficiently "
                    "covered and the conversation should move to the next one."
    )
