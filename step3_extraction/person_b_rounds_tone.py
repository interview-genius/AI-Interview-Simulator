"""
Step 3 -- Person B: rounds + tone extraction

WHY THIS SCHEMA:
- rounds: an ARRAY of {type, topics, difficulty}, because one interview report
  almost always covers MULTIPLE rounds (Coding, System Design, Behavioral...),
  each with its own topics and difficulty. A single flat set of fields
  couldn't represent that -- you'd lose which topic belonged to which round.
- tone: a single overall descriptor for the interview experience (friendly,
  neutral, high-pressure, etc.) -- this is a whole-report property, not
  per-round, since it's usually a consistent read across the process.

WHY TEST ON FORM DATA FIRST (per the spec):
Form responses are already semi-structured (separate fields for round type,
questions asked, interviewer vibe, pace) -- much easier to verify extraction
accuracy against, since we can compare the model's output to what the person
literally already told us in a separate column. Reddit/Medium's free-form
prose is harder to validate against ground truth. Nail the schema here first.

WHY pydantic:
The LLM returns JSON as text. pydantic validates that JSON actually matches
the shape we expect (right field names, right types) BEFORE we trust it or
insert it into structured_reports -- catching malformed output early instead
of it silently corrupting the database.
"""

import json
import os

from dotenv import load_dotenv
from groq import Groq
from pydantic import BaseModel, ValidationError

load_dotenv()  # reads GROQ_API_KEY from .env

client = Groq(api_key=os.environ["GROQ_API_KEY"])

MODEL = "openai/gpt-oss-20b"  # fast + free-tier friendly; upgrade to
                                # openai/gpt-oss-120b later if extraction
                                # quality needs improving


# --- Schema -----------------------------------------------------------------

class Round(BaseModel):
    type: list[str]    # e.g. ["Coding", "Behavioral"] -- a single round can
                        # legitimately carry multiple category tags (this is
                        # exactly what Form data does: "DSA, Coding,
                        # Behavioral" for ONE round). A plain str here would
                        # silently drop every tag but one.
    topics: list[str]  # e.g. ["DSA", "graphs", "leadership principles"]
    difficulty: str | None = None  # e.g. "Easy" / "Medium" / "Hard", nullable


class ExtractedStructure(BaseModel):
    rounds: list[Round]
    tone: str | None = None  # overall interviewer/process tone, nullable


# --- Prompt -------------------------------------------------------------

SYSTEM_PROMPT = """You extract structured interview-round data from a candidate's
account of their job interview process.

Return ONLY valid JSON matching this exact shape, nothing else -- no markdown
fences, no explanation:

{
  "rounds": [
    {"type": ["<round type 1>", "<round type 2, if applicable>"], "topics": ["<topic1>", "<topic2>"], "difficulty": "<Easy|Medium|Hard|null>"}
  ],
  "tone": "<one short phrase describing the overall interview tone, or null if not inferrable>"
}

Rules:
- One entry in "rounds" per distinct interview round mentioned (OA, phone
  screen, onsite rounds, bar raiser, etc. each count separately).
- "type" is a LIST because a single round is often tagged with multiple
  categories at once (e.g. a round can be BOTH "Coding" AND "Behavioral").
  Include every category that genuinely applies -- don't force it down to one.
  Use short labels like "Coding", "System Design", "Behavioral", "OA", "HR",
  "Bar Raiser", "DSA" -- infer the best labels from context, don't just copy
  the source text verbatim.
- "topics" should be specific (e.g. "dynamic programming", "leadership
  principles", "SQL") not vague restatements of the round type.
- "difficulty" is null if the text gives no signal at all -- don't guess.
- "tone" is null if the text gives no signal about interviewer/process tone.
- If you cannot identify any rounds at all, return {"rounds": [], "tone": null}.
"""


def extract(raw_text: str) -> ExtractedStructure | None:
    response = client.chat.completions.create(
        model=MODEL,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": raw_text},
        ],
        temperature=0,  # deterministic extraction, not creative writing
    )

    content = response.choices[0].message.content.strip()

    # Models sometimes wrap JSON in ```json fences despite instructions --
    # strip that defensively rather than letting json.loads crash on it.
    if content.startswith("```"):
        content = content.strip("`")
        if content.startswith("json"):
            content = content[4:]
        content = content.strip()

    try:
        data = json.loads(content)
    except json.JSONDecodeError as e:
        print(f"    [error] model did not return valid JSON: {e}")
        print(f"    raw output: {content[:300]}")
        return None

    try:
        return ExtractedStructure.model_validate(data)
    except ValidationError as e:
        print(f"    [error] JSON didn't match expected schema: {e}")
        return None


# --- Test against real Form data --------------------------------------------

def main():
    import csv

    with open("../data/form_raw.csv", encoding="utf-8") as f:
        rows = list(csv.DictReader(f))

    print(f"Testing extraction on {len(rows)} real Form responses.\n")

    results = []
    for i, row in enumerate(rows):
        print(f"--- Row {i+1}: {row['company_guess']} / {row['role_guess']} ---")
        result = extract(row["raw_text"])
        if result:
            print(f"  rounds: {[(r.type, r.difficulty) for r in result.rounds]}")
            print(f"  topics: {[t for r in result.rounds for t in r.topics]}")
            print(f"  tone: {result.tone}")
            results.append({"source_url": row["source_url"], **result.model_dump()})
        else:
            print("  EXTRACTION FAILED")
        print()

    print(f"Successfully extracted {len(results)}/{len(rows)} rows.")

    with open("extraction_results_form.json", "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2)
    print("Saved extraction_results_form.json")


if __name__ == "__main__":
    main()
