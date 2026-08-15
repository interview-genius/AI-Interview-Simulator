"""
Combined prompt -- merges Person A's identity instructions and Person B's
round-structure instructions into a single system prompt + schema, so one
model call extracts everything.

Uses Groq (same provider/model Person B already validated solo) rather than
switching to Gemini -- either would work, Groq was picked just to keep one
fewer moving part while merging two already-working pieces.
"""

import os

from dotenv import load_dotenv
from groq import Groq

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GROQ_MODEL = os.getenv("GROQ_MODEL", "openai/gpt-oss-20b")

if not GROQ_API_KEY:
    raise ValueError("GROQ_API_KEY was not found in .env")

client = Groq(api_key=GROQ_API_KEY)


SYSTEM_INSTRUCTIONS = """You extract structured data from a candidate's account of
their job interview process. Extract ALL of the following fields in one pass:

IDENTITY FIELDS:
- company: the company name, exactly as mentioned. Null if not mentioned, OR if
  the text discusses multiple different companies with no single clear subject
  (e.g. a post listing several offers from different companies) -- never guess
  a single company when several are genuinely in play.
- role: the job role/title, exactly as mentioned. Null if not mentioned.
- year: the year the interview took place, only if explicitly stated or
  unambiguously inferable from dates in the text. Null if unclear.
- outcome: one of "selected", "rejected", or "unknown". "selected" only if the
  text clearly states an offer/acceptance. "rejected" only if it clearly states
  a rejection. Otherwise "unknown".

ROUND-STRUCTURE FIELDS:
- rounds: an array, one entry per distinct interview round mentioned (OA, phone
  screen, onsite rounds, bar raiser, etc. each count separately).
  - type: a LIST of short category labels for that round (e.g. ["Coding",
    "Behavioral"]) -- a round is often tagged with multiple categories at once,
    include every one that genuinely applies.
  - topics: specific topics covered (e.g. "dynamic programming", "SQL") --
    not vague restatements of the round type.
  - difficulty: "Easy" / "Medium" / "Hard" if stated or clearly implied, else null.
- tone: one short phrase describing the overall interviewer/process tone, or
  null if the text gives no signal.

STRICT RULES:
- Never guess or invent information. Null/empty is always better than a
  fabricated guess.
- If you cannot identify any rounds at all, return an empty rounds array.
- Return exactly one JSON object matching the provided schema.
"""


def build_prompt(raw_text: str) -> str:
    return f"""{SYSTEM_INSTRUCTIONS}

TEXT TO EXTRACT FROM:
\"\"\"
{raw_text}
\"\"\"
"""


COMBINED_JSON_SCHEMA = {
    "type": "object",
    "properties": {
        "company": {"type": ["string", "null"]},
        "role": {"type": ["string", "null"]},
        "year": {"type": ["integer", "null"]},
        "outcome": {"type": "string", "enum": ["selected", "rejected", "unknown"]},
        "rounds": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "type": {"type": "array", "items": {"type": "string"}},
                    "topics": {"type": "array", "items": {"type": "string"}},
                    "difficulty": {"type": ["string", "null"]},
                },
                "required": ["type", "topics", "difficulty"],
                "additionalProperties": False,
            },
        },
        "tone": {"type": ["string", "null"]},
    },
    "required": ["company", "role", "year", "outcome", "rounds", "tone"],
    "additionalProperties": False,
}


def call_groq(raw_text: str) -> str:
    prompt = build_prompt(raw_text)

    response = client.chat.completions.create(
        model=GROQ_MODEL,
        messages=[{"role": "user", "content": prompt}],
        temperature=0,
        response_format={
            "type": "json_schema",
            "json_schema": {
                "name": "combined_extraction",
                "strict": True,
                "schema": COMBINED_JSON_SCHEMA,
            },
        },
    )

    return response.choices[0].message.content
