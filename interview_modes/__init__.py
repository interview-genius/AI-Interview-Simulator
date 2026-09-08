"""
Step 8 -- Person A: Interview Modes package.

Exports:
- config_router: Validation & routing for the 4-step Config selection flow
- technical_discussion_router: Conceptual CS, DBMS, OS, Networks, OOP round
- hr_round_router: Resume-driven behavioral and leadership round
"""

from interview_modes.config import router as config_router
from interview_modes.technical_discussion import router as technical_discussion_router
from interview_modes.hr_round import router as hr_round_router

__all__ = [
    "config_router",
    "technical_discussion_router",
    "hr_round_router",
]
