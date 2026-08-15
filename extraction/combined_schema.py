"""
Combined extraction schema -- Step 3, Together step.

Merges Person A's identity_schema.py (company, role, year, outcome) and
Person B's rounds_tone_schema.py (rounds, tone) into ONE schema, so a single
model call extracts everything at once instead of two separate API calls
per report. This is what actually gets used going forward -- the two solo
schemas were for independent validation, not final production use.

KNOWN LIMITATION carried over from solo validation (not fixed here, by
design -- see step3_together_notes.md): a small minority of Reddit posts
describe interviews at MULTIPLE companies in one post. `company` stays a
single nullable string for now; those rows will correctly extract as
company=null rather than guessing one company arbitrarily. Documented as an
MVP limitation, not silently patched.
"""

from typing import Optional, Literal
from pydantic import BaseModel, Field, field_validator


class Round(BaseModel):
    type: list[str] = Field(
        description="Category labels for this round, e.g. ['Coding', 'Behavioral']. "
                    "A round can carry multiple categories at once -- include every "
                    "one that genuinely applies."
    )
    topics: list[str] = Field(
        description="Specific topics covered, e.g. ['dynamic programming', "
                    "'leadership principles']."
    )
    difficulty: Optional[str] = Field(
        default=None,
        description="'Easy' / 'Medium' / 'Hard' if stated or clearly implied, else null."
    )


class CombinedExtraction(BaseModel):
    """Everything extracted from one raw_reports row in a single model call."""

    # --- Person A's fields ---
    company: Optional[str] = Field(
        default=None,
        description="Company name explicitly mentioned. Null if not mentioned or if "
                    "multiple companies are discussed with no single clear subject -- "
                    "never guess."
    )
    role: Optional[str] = Field(
        default=None,
        description="Job role/title explicitly mentioned. Null if not mentioned."
    )
    year: Optional[int] = Field(
        default=None,
        description="Year the interview took place, if explicitly stated or clearly "
                    "inferable from the text. Null if not determinable from the text "
                    "itself (a separate fallback to the post's submission date happens "
                    "outside this extraction, not inside it)."
    )
    outcome: Literal["selected", "rejected", "unknown"] = Field(
        default="unknown",
        description="'selected' only if text clearly states an offer/acceptance. "
                    "'rejected' only if text clearly states a rejection. Else 'unknown'."
    )

    # --- Person B's fields ---
    rounds: list[Round] = Field(
        default_factory=list,
        description="One entry per distinct interview round mentioned."
    )
    tone: Optional[str] = Field(
        default=None,
        description="Overall interviewer/process tone in a short phrase, or null."
    )

    @field_validator("company", "role", mode="before")
    @classmethod
    def blank_string_to_none(cls, v):
        if isinstance(v, str) and v.strip() == "":
            return None
        return v

    @field_validator("year")
    @classmethod
    def sanity_check_year(cls, v):
        if v is None:
            return v
        if v < 2000 or v > 2100:
            return None
        return v


class CombinedExtractionResult(BaseModel):
    raw_report_id: int
    source: str
    source_url: str
    extraction: CombinedExtraction
    raw_model_output: str
