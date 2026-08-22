"""
Pydantic schema for Person B's Step 6 feedback-scoring prompt.

Scope per the spec: STAR / depth / clarity, 1-5 each, plus one tip per
category -- exactly three dimensions, not the full multi-dimensional
rubric (that's Step 10's job, extending this baseline).
"""

from pydantic import BaseModel, Field


class DimensionScore(BaseModel):
    score: int = Field(ge=1, le=5, description="1 (weak) to 5 (excellent).")
    tip: str = Field(description="One concrete, actionable tip for this dimension.")


class FeedbackScore(BaseModel):
    star: DimensionScore = Field(
        description="How well the answer follows Situation/Task/Action/Result "
                    "structure. Score low if a behavioral answer never gets past "
                    "vague situation-setting into concrete actions/results."
    )
    depth: DimensionScore = Field(
        description="How substantively the candidate explored the technical or "
                    "situational details -- specifics, trade-offs, reasoning -- "
                    "versus staying surface-level."
    )
    clarity: DimensionScore = Field(
        description="How clearly and concisely the answer communicates, "
                    "independent of content quality."
    )
