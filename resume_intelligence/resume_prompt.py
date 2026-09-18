"""
Step 7 -- Person B: resume extraction prompt.

Same pattern as Step 3's extraction prompts (Groq, response_format
json_schema strict) and same max_tokens=4096 lesson learned there --
a full multi-page resume with several jobs/projects can produce a large
JSON object, and truncation looks like a schema-validation failure rather
than what it actually is.
"""

import os
import re

from dotenv import load_dotenv
from groq import Groq

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GROQ_MODEL = os.getenv("GROQ_MODEL", "openai/gpt-oss-20b")

if not GROQ_API_KEY:
    raise ValueError("GROQ_API_KEY was not found in .env")

client = Groq(api_key=GROQ_API_KEY)


SYSTEM_INSTRUCTIONS = """You extract structured data from resume text (already
OCR'd/extracted from a PDF, so formatting may be imperfect -- columns or tables
may have been flattened or interleaved).

Extract these sections:
- education: one entry per institution/degree.
- experience: one entry per job, with each bullet point kept separate in `bullets`
  (do not merge bullets into a single paragraph).
- projects: one entry per project, bullets kept separate, technologies listed
  separately if mentioned.
- skills: a flat list of individual skills (split comma/pipe/bullet-separated
  lists into individual items, don't keep a category header as one skill string).
- leadership: clubs, org roles, volunteering with a leadership/organizing component.
- achievements: awards, certifications, competition placements, publications --
  anything that doesn't belong in the sections above.

STRICT RULES:
- Never invent or infer information not actually present in the text.
- If a section has no entries, return an empty list for it -- do not fabricate
  placeholder entries.
- If the extracted text looks garbled or clearly out of order (e.g. lines from
  different resume columns interleaved mid-sentence), do your best on whatever
  is legible, but do not silently invent connections between fragments that
  don't actually belong together.
"""


# pdfplumber falls back to a raw "(cid:N)" placeholder when a PDF's icon
# font (phone/email/link glyphs in resume headers, most commonly) has no
# ToUnicode mapping it can decode. Left in, these confused Groq's schema-
# constrained decoding badly enough to return an empty generation entirely
# (found via a real failing resume, not a hypothetical) -- stripped here,
# right before the prompt is built, so the stored raw_text stays the true
# untouched pdfplumber output for debugging.
CID_ARTIFACT_RE = re.compile(r"\(cid:\d+\)")


def build_prompt(resume_text: str) -> str:
    cleaned_text = CID_ARTIFACT_RE.sub("", resume_text)
    return f"""{SYSTEM_INSTRUCTIONS}

RESUME TEXT:
\"\"\"
{cleaned_text}
\"\"\"
"""


RESUME_JSON_SCHEMA = {
    "type": "object",
    "properties": {
        "education": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "institution": {"type": "string"},
                    "degree": {"type": ["string", "null"]},
                    "field_of_study": {"type": ["string", "null"]},
                    "start_date": {"type": ["string", "null"]},
                    "end_date": {"type": ["string", "null"]},
                    "gpa": {"type": ["string", "null"]},
                },
                "required": ["institution", "degree", "field_of_study", "start_date", "end_date", "gpa"],
                "additionalProperties": False,
            },
        },
        "experience": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "company": {"type": "string"},
                    "title": {"type": ["string", "null"]},
                    "start_date": {"type": ["string", "null"]},
                    "end_date": {"type": ["string", "null"]},
                    "bullets": {"type": "array", "items": {"type": "string"}},
                },
                "required": ["company", "title", "start_date", "end_date", "bullets"],
                "additionalProperties": False,
            },
        },
        "projects": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "name": {"type": "string"},
                    "bullets": {"type": "array", "items": {"type": "string"}},
                    "technologies": {"type": "array", "items": {"type": "string"}},
                },
                "required": ["name", "bullets", "technologies"],
                "additionalProperties": False,
            },
        },
        "skills": {"type": "array", "items": {"type": "string"}},
        "leadership": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "organization": {"type": "string"},
                    "role": {"type": ["string", "null"]},
                    "bullets": {"type": "array", "items": {"type": "string"}},
                },
                "required": ["organization", "role", "bullets"],
                "additionalProperties": False,
            },
        },
        "achievements": {"type": "array", "items": {"type": "string"}},
    },
    "required": ["education", "experience", "projects", "skills", "leadership", "achievements"],
    "additionalProperties": False,
}


def call_groq(resume_text: str) -> str:
    prompt = build_prompt(resume_text)

    response = client.chat.completions.create(
        model=GROQ_MODEL,
        messages=[{"role": "user", "content": prompt}],
        temperature=0,
        max_tokens=6144,  # a resume with several hackathon/job entries genuinely
                          # ran past 4096 and got cut off before "achievements"
        response_format={
            "type": "json_schema",
            "json_schema": {
                "name": "resume_extraction",
                "strict": True,
                "schema": RESUME_JSON_SCHEMA,
            },
        },
    )

    return response.choices[0].message.content
