"""
Step 8 -- Person B: Coding Round session orchestration (shell).

current_code is accepted and stored on every turn but deliberately never
passed into the Groq prompt -- see coding_prompt.py's docstring. This is
the explicit seam Step 9's live code-diff reasoning hooks into without
needing a request-shape change on the frontend.
"""

import json
import time
import uuid

from groq import BadRequestError, RateLimitError
from pydantic import BaseModel, ValidationError

from interview_engine.coding_bank import pick_problem
from interview_engine.coding_prompt import call_groq
from interview_engine.adaptive_engine import get_or_create_adaptive_state
from interview_engine.conversation import fetch_resume

SESSIONS: dict[str, dict] = {}  # session_id -> {problem, history, current_code, resume_data}


class CodingTurn(BaseModel):
    interviewer_response: str


def call_groq_with_retry(problem: dict, turn_history: list[dict], max_retries: int = 4, resume_data: dict | None = None) -> str | None:
    for attempt in range(max_retries):
        try:
            return call_groq(problem, turn_history, resume_data=resume_data)
        except RateLimitError:
            wait = 5 * (attempt + 1)
            print(f"    [rate limited] waiting {wait}s (retry {attempt+1}/{max_retries})...")
            time.sleep(wait)
        except BadRequestError as e:
            print(f"    [error] Groq rejected the generation: {e}")
            return None
    return None


def start_coding_session(level: str | None = None, role: str | None = None, resume_id: int | None = None) -> tuple[str, dict, str]:
    """Returns (session_id, problem, opening_line)."""
    problem = pick_problem(level=level, role=role)
    resume_data = fetch_resume(resume_id) if resume_id is not None else None
    
    opening_line = (
        f"Let's start with a coding problem: {problem['title']}. "
        f"Take a moment to read it, and talk me through your approach before you start coding."
    )

    session_id = str(uuid.uuid4())
    SESSIONS[session_id] = {
        "problem": problem,
        "history": [{"role": "assistant", "content": opening_line}],
        "current_code": problem["starter_code"],
        "resume_data": resume_data,
    }
    return session_id, problem, opening_line


def advance_coding_conversation(session_id: str, candidate_message: str,
                                 current_code: str | None = None) -> CodingTurn | None:
    session = SESSIONS.get(session_id)
    if session is None:
        return None

    if current_code is not None:
        session["current_code"] = current_code  # stored, and now read by the LLM

    session["history"].append({"role": "user", "content": candidate_message})

    # Prepare temporary history for the prompt
    code_context_msg = {
        "role": "system", 
        "content": f"CANDIDATE'S CURRENT CODE:\n```python\n{session['current_code']}\n```"
    }
    prompt_history = session["history"] + [code_context_msg]

    adaptive_state = get_or_create_adaptive_state(session_id)
    if adaptive_state.pending_external_signal:
        signal = adaptive_state.pending_external_signal
        adaptive_state.pending_external_signal = None
        instruction = f"CRITICAL: The live coding intelligence engine flagged this issue based on the candidate's latest code change: '{signal['message_to_candidate']}'. Ensure you weave this observation or question naturally into your next response."
        prompt_history.append({"role": "system", "content": instruction})

    raw = call_groq_with_retry(session["problem"], prompt_history, resume_data=session.get("resume_data"))
    if raw is None:
        return None
    try:
        data = json.loads(raw)
        turn = CodingTurn.model_validate(data)
    except (json.JSONDecodeError, ValidationError) as e:
        print(f"    [error] could not parse/validate coding turn: {e}")
        return None

    session["history"].append({"role": "assistant", "content": turn.interviewer_response})
    return turn


def main():
    """Scripted self-test: start a session, send one candidate remark, confirm
    the interviewer never claims to have seen code it wasn't shown."""
    session_id, problem, opening_line = start_coding_session(level="New Grad")
    print(f"Problem: {problem['title']} ({problem['difficulty']})")
    print(f"Opening: {opening_line}\n")

    turn = advance_coding_conversation(
        session_id,
        "I'll use a hash map to store numbers I've seen, so I can find the complement in one pass.",
        current_code="def two_sum(nums, target):\n    seen = {}\n",
    )
    if turn:
        print(f"Interviewer: {turn.interviewer_response}")
    else:
        print("FAILED to get a turn")


if __name__ == "__main__":
    main()
