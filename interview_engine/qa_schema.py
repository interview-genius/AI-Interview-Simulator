"""
Pydantic schema for Person B's Step 6 open Q&A generation.

grounded is its own field (not inferred from cited_report_ids being empty)
so the model has to make an explicit call about whether the retrieved
context actually supports an answer, rather than us guessing that from
citation count after the fact.
"""

from pydantic import BaseModel, Field


class QAAnswer(BaseModel):
    answer: str = Field(
        description="The answer to the candidate's prep question. If grounded "
                    "is false, this should say plainly that the retrieved reports "
                    "don't cover this well enough to answer confidently -- not "
                    "fall back to generic, unsourced advice."
    )
    cited_report_ids: list[int] = Field(
        description="IDs (from the retrieved context) of reports actually drawn "
                    "on for this answer. Empty if grounded is false."
    )
    grounded: bool = Field(
        description="True only if the retrieved reports genuinely support the "
                    "answer given. False if the retrieved context is off-topic "
                    "or too thin to answer from."
    )
