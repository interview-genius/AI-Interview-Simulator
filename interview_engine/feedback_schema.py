"""
Pydantic schema for Step 6 & Step 10 feedback scoring.

Extends the Step 6 baseline (STAR, depth, clarity) with Step 10's full
multi-dimensional rubric across interview modes:
- Technical ability
- Communication
- Problem solving
- Optimisation
- Debugging
- Confidence
- Resume discussion
- Behavioural
- Overall recommendation
"""

from typing import Optional, Literal
from pydantic import BaseModel, Field


class DimensionScore(BaseModel):
    score: int = Field(ge=1, le=5, description="1 (weak) to 5 (excellent).")
    tip: str = Field(description="One concrete, actionable tip for this dimension.")


class FeedbackScore(BaseModel):
    """Step 6 baseline scoring schema."""
    star: DimensionScore = Field(
        description="How well the answer follows Situation/Task/Action/Result structure."
    )
    depth: DimensionScore = Field(
        description="How substantively the candidate explored details and trade-offs."
    )
    clarity: DimensionScore = Field(
        description="How clearly and concisely the answer communicates."
    )


class ComprehensiveFeedback(BaseModel):
    """Step 10 full multi-dimensional feedback schema with mode-based dimension routing."""
    mode: str = Field(description="Interview mode: technical | hr | coding | ml")
    
    # Step 6 baseline dimensions
    star: Optional[DimensionScore] = Field(default=None, description="STAR structure scoring (HR / Behavioral focus).")
    depth: Optional[DimensionScore] = Field(default=None, description="Substance and technical depth.")
    clarity: Optional[DimensionScore] = Field(default=None, description="Communication clarity.")

    # Step 10 multi-dimensional scoring rubric
    technical_ability: Optional[DimensionScore] = Field(
        default=None,
        description="Technical correctness, CS/domain fundamentals, and architectural soundness."
    )
    communication: Optional[DimensionScore] = Field(
        default=None,
        description="Verbal articulation, active listening, and structured explanation."
    )
    problem_solving: Optional[DimensionScore] = Field(
        default=None,
        description="Analytical breakdown, identifying trade-offs, and handling ambiguity."
    )
    optimisation: Optional[DimensionScore] = Field(
        default=None,
        description="Algorithmic efficiency, time/space complexity, and system scaling."
    )
    debugging: Optional[DimensionScore] = Field(
        default=None,
        description="Root cause analysis, edge-case testing, and diagnostic reasoning."
    )
    confidence: Optional[DimensionScore] = Field(
        default=None,
        description="Poise, conviction, handling pressure, and ownership."
    )
    resume_discussion: Optional[DimensionScore] = Field(
        default=None,
        description="Depth, authenticity, and personal contribution in discussing past projects/roles."
    )
    behavioural: Optional[DimensionScore] = Field(
        default=None,
        description="Collaboration, leadership, conflict resolution, and cultural alignment."
    )

    # Executive verdicts
    overall_recommendation: Optional[str] = Field(
        default=None,
        description="Hiring verdict: 'Strong hire' | 'Lean hire' | 'Lean no hire' | 'No hire'."
    )
    summary_verdict: Optional[str] = Field(
        default=None,
        description="A 2-3 sentence executive summary of candidate strengths and growth areas."
    )
