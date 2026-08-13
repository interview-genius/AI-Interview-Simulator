"""
Pydantic schema for Person A's Step 3 extraction fields.

Scope: company, role, year, outcome ONLY.
Person B's fields (rounds, tone) live in a separate schema and
are intentionally NOT included here.
"""

from typing import Optional, Literal
from pydantic import BaseModel, Field, field_validator


class IdentityExtraction(BaseModel):
    """Structured identity fields extracted from one raw interview report."""

    company: Optional[str] = Field(
        default=None,
        description="Company name explicitly mentioned in the text, e.g. 'Google'. "
                    "Null if not mentioned — never guess."
    )
    role: Optional[str] = Field(
        default=None,
        description="Job role/title explicitly mentioned, e.g. 'SWE Intern', 'SDE-1'. "
                    "Null if not mentioned — never guess."
    )
    year: Optional[int] = Field(
        default=None,
        description="Year the interview took place, if explicitly stated or clearly "
                    "inferable from dates in the text. Null if not determinable."
    )
    outcome: Literal["selected", "rejected", "unknown"] = Field(
        default="unknown",
        description="Final outcome of the interview process, if stated."
    )

    @field_validator("company", "role", mode="before")
    @classmethod
    def blank_string_to_none(cls, v):
        """Treat empty/whitespace-only strings as missing, not as a value."""
        if isinstance(v, str) and v.strip() == "":
            return None
        return v

    @field_validator("year")
    @classmethod
    def sanity_check_year(cls, v):
        """Reject implausible years rather than trusting a bad model guess."""
        if v is None:
            return v
        if v < 2000 or v > 2100:
            return None
        return v


class IdentityExtractionResult(BaseModel):
    """
    Wraps one extraction with traceability back to the source row —
    used by extract_identity.py when writing/logging results.
    """

    raw_report_id: int
    source_url: str
    extraction: IdentityExtraction
    raw_model_output: str = Field(
        description="Unparsed model response, kept for debugging failed/odd extractions."
    )