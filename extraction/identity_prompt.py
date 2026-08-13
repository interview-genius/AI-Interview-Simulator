"""
Builds the extraction prompt and calls Gemini for Person A's Step 3
identity extraction (company, role, year, outcome).
"""

import os
from dotenv import load_dotenv
from google import genai

from extraction.identity_schema import IdentityExtraction

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-3.1-flash-lite")

if not GEMINI_API_KEY:
    raise ValueError("GEMINI_API_KEY was not found in .env")

client = genai.Client(api_key=GEMINI_API_KEY)


SYSTEM_INSTRUCTIONS = """You extract structured identity fields from a Reddit interview experience post.

Extract ONLY these four fields:

- company: the company name, exactly as mentioned in the text. If no company is explicitly named, use null.
- role: the job role/title, exactly as mentioned in the text. If not explicitly mentioned, use null.
- year: the year the interview took place, only if explicitly stated or unambiguously inferable from dates in the text. If unclear, use null.
- outcome: one of "selected", "rejected", or "unknown".

STRICT RULES:
- Never guess or invent information.
- If company, role, or year is missing or ambiguous, use null.
- Use "selected" only if the text clearly states an offer or acceptance.
- Use "rejected" only if the text clearly states a rejection.
- Otherwise use "unknown".
- Return exactly one JSON object matching the provided schema.
"""


def build_prompt(raw_text: str) -> str:
    return f"""{SYSTEM_INSTRUCTIONS}

TEXT TO EXTRACT FROM:
\"\"\"
{raw_text}
\"\"\"
"""


def call_gemini(raw_text: str) -> str:
    """Send the text to Gemini and return structured JSON."""

    prompt = build_prompt(raw_text)

    response = client.models.generate_content(
        model=GEMINI_MODEL,
        contents=prompt,
        config={
            "response_mime_type": "application/json",
            "response_json_schema": IdentityExtraction.model_json_schema(),
        },
    )

    return response.text