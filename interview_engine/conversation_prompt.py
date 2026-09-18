"""
Step 8 -- Person B: ML Round multi-turn conversation prompt.

Deliberately different shape from qa_prompt.py/feedback_prompt.py: those
flatten everything into one user-message string per call because they're
genuinely single-shot. This is a real multi-turn conversation, so it uses
a real `messages: list[dict]` array instead -- the system message is
rebuilt fresh on every call (phase/retrieved-context can change turn to
turn) and prepended to the accumulated user/assistant history, rather
than storing a stale system message inside that history.
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


PHASE_GOALS = {
    "resume_warmup": "Ask about one specific real project or experience from the "
                      "candidate's resume, to warm up the conversation.",
    "ml_theory": "Ask a core ML/DL theory question appropriate for the stated "
                 "experience level.",
    "project_discussion": "Dig deeper into the ML design choices, trade-offs, or "
                           "evaluation approach behind one of the candidate's own "
                           "resume projects.",
    "case_study": "Present a short applied ML scenario relevant to the company/role "
                   "and ask how the candidate would approach it.",
    "model_tradeoffs": "Ask about model-selection or trade-off reasoning -- e.g. "
                        "interpretability vs. accuracy, latency vs. quality.",
}


def format_reports(reports: list[dict]) -> str:
    if not reports:
        return "(no reports retrieved)"
    lines = []
    for r in reports:
        lines.append(f"Report id={r['id']}: {r.get('company')} / {r.get('role')} "
                      f"(tone: {r.get('tone') or 'unstated'}, outcome: {r.get('outcome') or 'unknown'})")
    return "\n".join(lines)


def format_resume(resume_data: dict | None) -> str:
    if not resume_data:
        return "No resume was provided for this session -- do not invent projects " \
               "or experience for the candidate."
    projects = resume_data.get("projects") or []
    if not projects:
        return "A resume was provided but lists no projects -- do not invent one."
    lines = ["Candidate's resume projects:"]
    for p in projects:
        techs = ", ".join(p.get("technologies") or [])
        lines.append(f"- {p['name']} ({techs})")
    return "\n".join(lines)


def build_system_message(company: str, role: str, level: str, phase: str,
                          reports: list[dict], resume_data: dict | None) -> str:
    return f"""You are conducting the ML Round of a live, voice-driven mock interview.

Company: {company}   Role: {role}   Level: {level}
Current phase: {phase} -- {PHASE_GOALS[phase]}

RETRIEVED REPORTS (real past interview data for this company/role):
{format_reports(reports)}

{format_resume(resume_data)}

RULES:
- Ground concrete claims about {company}/{role} interview patterns in the retrieved
  reports above and cite their ids in cited_report_ids. If nothing retrieved actually
  supports what you're about to say, set grounded to false and say so plainly instead
  of inventing a plausible-sounding claim.
- Never invent resume content, projects, or company-specific details not given above.
- Ask ONE question or make ONE substantive remark per turn -- this is a live spoken
  exchange, not a monologue.
- Set advance_phase to true once this phase has been reasonably covered (typically
  after 1-3 exchanges), so the conversation keeps moving.
- SILENCE: If the candidate's response contains "[SILENCE]", they have been quiet for a while. Proactively check in (e.g. "Are you still there?", "Do you need a moment to think?"). Do NOT explicitly mention the word "silence".
"""


CONVERSATION_JSON_SCHEMA = {
    "type": "object",
    "properties": {
        "interviewer_response": {"type": "string"},
        "cited_report_ids": {"type": "array", "items": {"type": "integer"}},
        "grounded": {"type": "boolean"},
        "advance_phase": {"type": "boolean"},
    },
    "required": ["interviewer_response", "cited_report_ids", "grounded", "advance_phase"],
    "additionalProperties": False,
}


def call_groq(company: str, role: str, level: str, phase: str, reports: list[dict],
              resume_data: dict | None, turn_history: list[dict]) -> str:
    system_message = build_system_message(company, role, level, phase, reports, resume_data)
    messages = [{"role": "system", "content": system_message}] + turn_history

    response = client.chat.completions.create(
        model=GROQ_MODEL,
        messages=messages,
        temperature=0,
        max_tokens=1024,
        response_format={
            "type": "json_schema",
            "json_schema": {
                "name": "conversation_turn",
                "strict": True,
                "schema": CONVERSATION_JSON_SCHEMA,
            },
        },
    )

    return response.choices[0].message.content
