import os
import json
import re
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from dotenv import load_dotenv

from interview_engine.coding import SESSIONS
from interview_engine.adaptive_engine import incorporate_external_signal, call_llm_json

load_dotenv()

router = APIRouter(prefix="/coding/snapshot", tags=["coding-intelligence"])

import time

LAST_ANALYZED_CODE: dict[str, str] = {}
LAST_INTERRUPT_TIME: dict[str, float] = {}

class CodeSnapshotRequest(BaseModel):
    session_id: str
    current_code: str

@router.post("")
def analyze_snapshot(body: CodeSnapshotRequest):
    session_id = body.session_id
    current_code = body.current_code

    session = SESSIONS.get(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Coding session not found.")

    # Prevent spam: enforce a 30-second cooldown between interruptions
    last_interrupt = LAST_INTERRUPT_TIME.get(session_id, 0)
    if time.time() - last_interrupt < 30:
        return {"status": "cooldown"}

    problem = session["problem"]
    problem_text = problem.get("description", problem.get("title", ""))

    last_code = LAST_ANALYZED_CODE.get(session_id, problem.get("starter_code", ""))
    if current_code.strip() == last_code.strip():
        return {"status": "no_change"}

    LAST_ANALYZED_CODE[session_id] = current_code

    system_prompt = """You are an expert technical interviewer silently observing a candidate write code for a coding interview.
You are given the problem statement, the code from the last snapshot, and the current code.
Decide if you should interrupt the candidate to ask "why" or point out an issue.
Interrupt ONLY IF:
1. They introduced a critical logical bug, poor algorithm choice, or syntax error that will severely derail them.
2. They just completed a major block of logic and you want to ask them about time/space complexity or algorithm choice before they run it.

Return a JSON object:
{
  "trigger": true or false,
  "reasoning": "Internal reasoning for why to interrupt or not",
  "severity": "low", "medium", or "high",
  "message_to_candidate": "If trigger is true, the actual conversational text you want to say to them (e.g. 'I see you used a hash map there, what is the space complexity?')"
}
Do NOT interrupt for minor typos or incomplete lines while they are actively typing. Err heavily on the side of false (no trigger) to avoid being annoying.
"""

    user_prompt = f"""Problem Statement: {problem_text}

Previous Code:
```python
{last_code}
```

Current Code:
```python
{current_code}
```
"""

    result = call_llm_json(system_prompt, user_prompt)
    
    if result and result.get("trigger"):
        signal = {
            "trigger": True,
            "reasoning": result.get("reasoning", "Significant code change detected"),
            "severity": result.get("severity", "medium"),
            "message_to_candidate": result.get("message_to_candidate", "Can you walk me through your recent code changes?")
        }
        # Directly append the interruption so the AI remembers it said this
        session["history"].append({"role": "assistant", "content": signal["message_to_candidate"]})
        LAST_INTERRUPT_TIME[session_id] = time.time()
        print(f"  [Live Coding Intel] Triggered for {session_id[:8]}: {signal['reasoning']}")
        return {"status": "triggered", "signal": signal}

    return {"status": "ok"}
