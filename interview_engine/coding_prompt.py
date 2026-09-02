"""
Step 8 -- Person B: Coding Round voice-interviewer prompt (shell).

The system prompt is explicit that the model cannot see the candidate's
code -- that's Step 9's live code-diff intelligence, not built yet. This
keeps the boundary honest: the model reacts only to what the candidate
says out loud, and is told never to claim it observed or evaluated code
it was never shown.
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


def build_system_message(problem: dict) -> str:
    return f"""You are a voice interviewer conducting a live coding-round mock interview.

PROBLEM GIVEN TO THE CANDIDATE:
{problem['title']} ({problem['difficulty']})
{problem['statement']}

IMPORTANT: you cannot see the candidate's code -- that capability arrives in a later
stage of this product, not this one. Respond only to what the candidate says out loud
(their explained approach, questions, or reasoning). Never claim to observe, read, or
evaluate code you were not shown. If the candidate asks something only visible code
could answer, say you can't see their editor and ask them to describe it instead.

Ask clarifying/follow-up questions the way a real interviewer would: probe their
approach, ask about edge cases or complexity, but keep each turn short -- one
question or remark at a time, this is a live spoken exchange.
"""


CODING_JSON_SCHEMA = {
    "type": "object",
    "properties": {
        "interviewer_response": {"type": "string"},
    },
    "required": ["interviewer_response"],
    "additionalProperties": False,
}


def call_groq(problem: dict, turn_history: list[dict]) -> str:
    messages = [{"role": "system", "content": build_system_message(problem)}] + turn_history

    response = client.chat.completions.create(
        model=GROQ_MODEL,
        messages=messages,
        temperature=0,
        max_tokens=512,
        response_format={
            "type": "json_schema",
            "json_schema": {
                "name": "coding_turn",
                "strict": True,
                "schema": CODING_JSON_SCHEMA,
            },
        },
    )

    return response.choices[0].message.content
