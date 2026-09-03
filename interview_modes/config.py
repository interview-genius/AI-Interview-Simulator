"""
Step 8 -- Person A: Configuration Flow Models & Router.

Defines:
- Pydantic models for interview configuration selection (company, role, level, round, resume_id).
- Validation rules for target selections.
- A thin pass-through router for the frontend Config flow to validate and shape
  URL parameters before navigating to mode pages.
"""

from typing import Literal
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field, field_validator

router = APIRouter(prefix="/config", tags=["config"])

EXPERIENCE_LEVELS = ["Intern", "New Grad", "Junior", "Mid-Level", "Senior", "Lead / Staff"]
ROUND_TYPES = ["technical", "hr", "coding", "ml"]


class ConfigSelection(BaseModel):
    company: str = Field(..., min_length=1, max_length=100, description="Target company name (e.g. Google, Amazon)")
    role: str = Field(..., min_length=1, max_length=100, description="Target role (e.g. Software Engineer, Backend Developer)")
    level: str = Field("New Grad", description="Experience level")
    round: Literal["technical", "hr", "coding", "ml"] = Field("technical", description="Interview round mode")
    resume_id: int | None = Field(None, description="Optional uploaded resume ID for personalization")

    @field_validator("company", "role")
    @classmethod
    def validate_non_empty(cls, v: str) -> str:
        trimmed = v.strip()
        if not trimmed:
            raise ValueError("Field cannot be empty or whitespace only.")
        return trimmed

    @field_validator("level")
    @classmethod
    def validate_level(cls, v: str) -> str:
        trimmed = v.strip()
        for lvl in EXPERIENCE_LEVELS:
            if lvl.lower() == trimmed.lower():
                return lvl
        return trimmed or "New Grad"


class ConfigResponse(BaseModel):
    valid: bool
    target_url: str
    selection: ConfigSelection


@router.post("", response_model=ConfigResponse, status_code=status.HTTP_200_OK)
@router.post("/validate", response_model=ConfigResponse, status_code=status.HTTP_200_OK)
def validate_config(body: ConfigSelection) -> ConfigResponse:
    """Validates interview configuration selection and returns the target URL for navigation."""
    query_params = [
        f"company={body.company}",
        f"role={body.role}",
        f"level={body.level}",
    ]
    if body.resume_id is not None:
        query_params.append(f"resume_id={body.resume_id}")

    target_url = f"/{body.round}?{'&'.join(query_params)}"

    return ConfigResponse(
        valid=True,
        target_url=target_url,
        selection=body,
    )
