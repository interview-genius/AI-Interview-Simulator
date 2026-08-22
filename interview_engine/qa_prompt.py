"""
Step 6 -- Person B: open Q&A generation prompt.

Same structured-output pattern as extraction/ (Groq, response_format
json_schema strict) -- the schema itself is what forces the model to
commit to grounded=true/false rather than always sounding confident.
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


SYSTEM_INSTRUCTIONS = """You are an interview-prep assistant. Answer the candidate's
question using ONLY the retrieved interview reports given below as context.

RULES:
- Ground every concrete claim in the retrieved reports and cite the report id(s)
  it came from in cited_report_ids.
- If the retrieved reports don't meaningfully address the question (wrong company,
  wrong topic, too thin to say anything specific), set grounded to false and say
  so plainly in the answer. Do NOT fall back on generic interview advice you were
  not given a source for -- an honest "I don't have data on this" beats a
  plausible-sounding guess.
- Never invent a company, round, or topic that isn't in the retrieved reports.
"""


def format_context(reports: list[dict]) -> str:
    if not reports:
        return "(no reports retrieved)"

    blocks = []
    for r in reports:
        round_lines = []
        for round_data in (r.get("rounds") or []):
            types = ", ".join(round_data.get("type") or [])
            topics = ", ".join(round_data.get("topics") or [])
            difficulty = round_data.get("difficulty") or "unstated"
            round_lines.append(f"    - [{types}] topics: {topics} (difficulty: {difficulty})")
        rounds_text = "\n".join(round_lines) if round_lines else "    (no rounds recorded)"

        blocks.append(
            f"Report id={r['id']}: {r.get('company') or 'unknown company'} / "
            f"{r.get('role') or 'unknown role'}\n"
            f"  tone: {r.get('tone') or 'unstated'}   outcome: {r.get('outcome') or 'unknown'}\n"
            f"  rounds:\n{rounds_text}"
        )

    return "\n\n".join(blocks)


def build_prompt(question: str, reports: list[dict]) -> str:
    return f"""{SYSTEM_INSTRUCTIONS}

RETRIEVED REPORTS:
{format_context(reports)}

CANDIDATE'S QUESTION:
\"\"\"{question}\"\"\"
"""


QA_JSON_SCHEMA = {
    "type": "object",
    "properties": {
        "answer": {"type": "string"},
        "cited_report_ids": {"type": "array", "items": {"type": "integer"}},
        "grounded": {"type": "boolean"},
    },
    "required": ["answer", "cited_report_ids", "grounded"],
    "additionalProperties": False,
}


def call_groq(question: str, reports: list[dict]) -> str:
    prompt = build_prompt(question, reports)

    response = client.chat.completions.create(
        model=GROQ_MODEL,
        messages=[{"role": "user", "content": prompt}],
        temperature=0,
        max_tokens=1024,
        response_format={
            "type": "json_schema",
            "json_schema": {
                "name": "qa_answer",
                "strict": True,
                "schema": QA_JSON_SCHEMA,
            },
        },
    )

    return response.choices[0].message.content
