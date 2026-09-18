"""
Builds the extraction prompt and calls Groq for Person B's Step 3
round-structure extraction (rounds, tone).

Mirrors Person A's identity_prompt.py pattern (schema-enforced structured
output), just on Groq instead of Gemini -- different provider, same idea:
let the API constrain the output to our schema instead of hoping the model
free-forms valid JSON.
"""

import json
import os

from dotenv import load_dotenv
from groq import Groq

from extraction.rounds_tone_schema import RoundsToneExtraction

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GROQ_MODEL = os.getenv("GROQ_MODEL", "openai/gpt-oss-20b")

if not GROQ_API_KEY:
    raise ValueError("GROQ_API_KEY was not found in .env")

client = Groq(api_key=GROQ_API_KEY)


SYSTEM_INSTRUCTIONS = """You extract structured interview-round data from a candidate's
account of their job interview process.

Extract ONLY these fields:

- rounds: an array, one entry per distinct interview round mentioned (OA, phone
  screen, onsite rounds, bar raiser, etc. each count separately).
  - type: a list of short category labels for that round (e.g. ["Coding", "Behavioral"]).
    A single round is often tagged with MULTIPLE categories at once -- include every
    one that genuinely applies, don't force it down to one label.
  - topics: specific topics covered (e.g. "dynamic programming", "leadership
    principles", "SQL") -- not vague restatements of the round type.
  - difficulty: "Easy" / "Medium" / "Hard" if stated or clearly implied, else null.
- tone: one short phrase describing the overall interviewer/process tone
  (e.g. "friendly and warm"), or null if the text gives no signal.

STRICT RULES:
- Never guess or invent information.
- difficulty and tone are null when the text gives no real signal -- do not
  default to a guess just to fill the field.
- If you cannot identify any rounds at all, return an empty rounds array.
"""


def build_prompt(raw_text: str) -> str:
    return f"""{SYSTEM_INSTRUCTIONS}

TEXT TO EXTRACT FROM:
\"\"\"
{raw_text}
\"\"\"
"""


# strict:true structured-output schema needs additionalProperties:false and
# every field listed in "required" at every level (nullable fields just use
# a nullable type, they're still "required" to appear in the output).
ROUNDS_TONE_JSON_SCHEMA = {
    "type": "object",
    "properties": {
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
    "required": ["rounds", "tone"],
    "additionalProperties": False,
}


def call_groq(raw_text: str) -> str:
    """Send the text to Groq and return structured JSON as a string."""

    prompt = build_prompt(raw_text)

    response = client.chat.completions.create(
        model=GROQ_MODEL,
        messages=[{"role": "user", "content": prompt}],
        temperature=0,
        response_format={
            "type": "json_schema",
            "json_schema": {
                "name": "rounds_tone_extraction",
                "strict": True,
                "schema": ROUNDS_TONE_JSON_SCHEMA,
            },
        },
    )

    return response.choices[0].message.content
