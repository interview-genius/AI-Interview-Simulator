"""
Pydantic schema for Person B's Step 3 extraction fields.

Scope: rounds, tone ONLY.
Person A's fields (company, role, year, outcome) live in identity_schema.py
and are intentionally NOT included here -- kept separate so each of us can
validate independently before merging, per the work-split spec.
"""

from typing import Optional
from pydantic import BaseModel, Field


class Round(BaseModel):
    """One interview round. type is a LIST because a single round is often
    tagged with multiple categories at once (e.g. a round can be BOTH
    'Coding' AND 'Behavioral') -- confirmed against real Form data, where
    the 'kind of round' field is itself a multi-select."""

    type: list[str] = Field(
        description="Category labels for this round, e.g. ['Coding', 'Behavioral']. "
                    "Infer concise labels from context; include every category that "
                    "genuinely applies."
    )
    topics: list[str] = Field(
        description="Specific topics covered, e.g. ['dynamic programming', "
                    "'leadership principles']. Not vague restatements of the round type."
    )
    difficulty: Optional[str] = Field(
        default=None,
        description="'Easy' / 'Medium' / 'Hard' if stated or clearly implied. "
                    "Null if no signal at all -- never guess."
    )


class RoundsToneExtraction(BaseModel):
    """Structured round-structure fields extracted from one raw interview report."""

    rounds: list[Round] = Field(
        description="One entry per distinct interview round mentioned "
                    "(OA, phone screen, onsite rounds, bar raiser, etc. each count separately)."
    )
    tone: Optional[str] = Field(
        default=None,
        description="Overall interviewer/process tone in a short phrase, e.g. "
                    "'friendly and warm'. Null if the text gives no signal."
    )


class RoundsToneExtractionResult(BaseModel):
    """
    Wraps one extraction with traceability back to the source row --
    used by extract_rounds_tone.py when writing/logging results.
    """

    raw_report_id: int
    source_url: str
    extraction: RoundsToneExtraction
    raw_model_output: str = Field(
        description="Unparsed model response, kept for debugging failed/odd extractions."
    )
