"""
Person A's Step 3 extraction module.

Scope: identity fields (company, role, year, outcome) only.
Person B's rounds/tone extraction and structured_reports writes
live outside this module.
"""

from .identity_schema import IdentityExtraction, IdentityExtractionResult

__all__ = [
    "IdentityExtraction",
    "IdentityExtractionResult",
]