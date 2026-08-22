"""
Step 6 -- Person B: feedback-scoring prompt (baseline).

Scores one candidate answer/transcript on STAR, depth, clarity (1-5 each)
with one tip per category -- same Groq structured-output pattern as the
rest of the project.
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


SYSTEM_INSTRUCTIONS = """You are an interview coach scoring one candidate's answer
from a mock interview transcript. Score exactly three dimensions, 1-5 each:

- star: Situation/Task/Action/Result structure. A vague answer that never reaches
  concrete actions or results should score low (1-2) even if it sounds confident.
  For non-behavioral (technical) answers, judge whether the candidate structured
  their reasoning comparably (problem -> approach -> execution -> outcome).
- depth: substance -- specific details, trade-offs, reasoning -- versus generic,
  surface-level statements.
- clarity: how clearly and concisely the answer communicates, independent of
  whether the content itself was strong.

For each dimension, give ONE concrete, actionable tip -- not generic advice like
"be more specific," but something tied to what's actually missing or weak in
THIS transcript.

Be honest and differentiate: a weak transcript should score noticeably lower
than a strong one across these three dimensions, not cluster everything at 3-4.
"""


def build_prompt(transcript: str) -> str:
    return f"""{SYSTEM_INSTRUCTIONS}

TRANSCRIPT:
\"\"\"
{transcript}
\"\"\"
"""


FEEDBACK_JSON_SCHEMA = {
    "type": "object",
    "properties": {
        "star": {
            "type": "object",
            "properties": {
                "score": {"type": "integer"},
                "tip": {"type": "string"},
            },
            "required": ["score", "tip"],
            "additionalProperties": False,
        },
        "depth": {
            "type": "object",
            "properties": {
                "score": {"type": "integer"},
                "tip": {"type": "string"},
            },
            "required": ["score", "tip"],
            "additionalProperties": False,
        },
        "clarity": {
            "type": "object",
            "properties": {
                "score": {"type": "integer"},
                "tip": {"type": "string"},
            },
            "required": ["score", "tip"],
            "additionalProperties": False,
        },
    },
    "required": ["star", "depth", "clarity"],
    "additionalProperties": False,
}


def call_groq(transcript: str) -> str:
    prompt = build_prompt(transcript)

    response = client.chat.completions.create(
        model=GROQ_MODEL,
        messages=[{"role": "user", "content": prompt}],
        temperature=0,
        max_tokens=1024,
        response_format={
            "type": "json_schema",
            "json_schema": {
                "name": "feedback_score",
                "strict": True,
                "schema": FEEDBACK_JSON_SCHEMA,
            },
        },
    )

    return response.choices[0].message.content
