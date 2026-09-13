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


def build_system_message(problem: dict, resume_data: dict | None) -> str:
    resume_section = ""
    if resume_data:
        projects = resume_data.get("projects", [])
        experience = resume_data.get("experience", [])
        resume_section = f"\nCANDIDATE'S RESUME CONTEXT:\n- Projects: {projects}\n- Experience: {experience}\n(Draw lightly on their background if relevant, but focus on the problem.)\n"

    return f"""You are a voice interviewer conducting a live coding-round mock interview.

PROBLEM GIVEN TO THE CANDIDATE:
{problem['title']} ({problem['difficulty']})
{problem['statement']}
{resume_section}
INTERVIEW PHASES:
1. Approach Phase: Start by asking them to talk through their approach. Probe their logic, edge cases, or time/space complexity. Do not let this drag on. 
2. Coding Phase: Once their approach sounds reasonable, explicitly say "Okay, that sounds good. Let's start writing the code." 

CODE AWARENESS:
The turn history will include the candidate's current code at the time they spoke. You CAN see their code. If there are obvious syntax errors, logic flaws, or they are stuck, provide a brief hint or point it out just like a real interviewer would.

SILENCE HANDLING:
If the candidate's latest response contains "[SILENCE]", they have been quiet for a prolonged period. You should proactively check in on them like a real human interviewer. Say something like "Are you facing any problems?", "Do you want to bounce some ideas off me?", or "Do you need a hint?". Do NOT explicitly mention the word "silence".

Ask clarifying/follow-up questions the way a real interviewer would: keep each turn short -- one question or remark at a time, this is a live spoken exchange.
"""


CODING_JSON_SCHEMA = {
    "type": "object",
    "properties": {
        "interviewer_response": {"type": "string"},
    },
    "required": ["interviewer_response"],
    "additionalProperties": False,
}


def call_groq(problem: dict, turn_history: list[dict], resume_data: dict | None = None) -> str:
    messages = [{"role": "system", "content": build_system_message(problem, resume_data)}] + turn_history

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
