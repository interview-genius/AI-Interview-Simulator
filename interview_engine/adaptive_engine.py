"""
Step 9 -- Person A: Adaptive Interview Engine.

Implements the dynamic interview decision loop:
  Observe -> Think -> Should I interrupt? -> Ask/Wait -> Listen -> Follow-up?

Features:
- In-memory topic and depth/confidence tracking per session_id (no user_id, no auth)
- Combined heuristic + LLM scoring for candidate answer depth (1-5) and confidence (1-5)
- Dynamic interrupt & follow-up decision making (prevents rigid questioning; avoids infinite follow-up loops)
- Integration placeholder for live coding intelligence (external code-diff signals)
"""

import json
import os
import re
import time
from typing import Any, Literal
from dotenv import load_dotenv
from pydantic import BaseModel, Field

load_dotenv()

# ---------------------------------------------------------------------------
# Data Models
# ---------------------------------------------------------------------------

class TopicTrackingState(BaseModel):
    topic_name: str
    follow_ups_count: int = 0
    depth_scores: list[int] = Field(default_factory=list)
    confidence_scores: list[int] = Field(default_factory=list)
    last_answer_summary: str = ""


class SessionAdaptiveState(BaseModel):
    session_id: str
    current_topic: str = "general"
    topics_covered: dict[str, TopicTrackingState] = Field(default_factory=dict)
    pending_external_signal: dict[str, Any] | None = None
    total_turns: int = 0


class AdaptiveDecision(BaseModel):
    should_interrupt: bool = Field(
        description="True if the interviewer should intervene immediately (e.g. external trigger or major flaw)."
    )
    should_follow_up: bool = Field(
        description="True if the interviewer should probe deeper on the current topic."
    )
    next_action: Literal["follow_up", "new_topic", "wrap_topic"] = Field(
        description="Next high-level conversational direction."
    )
    reasoning: str = Field(
        description="Internal rationale explaining the decision based on depth and confidence."
    )
    depth_score: int = Field(default=3, ge=1, le=5, description="Estimated answer depth score (1-5).")
    confidence_score: int = Field(default=3, ge=1, le=5, description="Estimated answer confidence score (1-5).")


# ---------------------------------------------------------------------------
# In-Memory Adaptive State Store (Keyed by session_id, no auth / no user_id)
# ---------------------------------------------------------------------------

ADAPTIVE_SESSIONS: dict[str, SessionAdaptiveState] = {}


def get_or_create_adaptive_state(session_id: str, topic: str = "general") -> SessionAdaptiveState:
    """Retrieves or initializes the adaptive tracking state for a given session_id."""
    if session_id not in ADAPTIVE_SESSIONS:
        state = SessionAdaptiveState(session_id=session_id, current_topic=topic)
        state.topics_covered[topic] = TopicTrackingState(topic_name=topic)
        ADAPTIVE_SESSIONS[session_id] = state
    else:
        state = ADAPTIVE_SESSIONS[session_id]
        if topic not in state.topics_covered:
            state.topics_covered[topic] = TopicTrackingState(topic_name=topic)
        state.current_topic = topic
    return state


# ---------------------------------------------------------------------------
# Live Coding Intelligence Integration Point (Placeholder)
# ---------------------------------------------------------------------------

def incorporate_external_signal(session_id: str, signal: dict[str, Any]) -> None:
    """
    Live coding intelligence integration point (Person B Step 9 integration placeholder).
    
    NOTE: The exact input shape is unconfirmed and will be finalized once Person B's
    code-diff watcher lands. Expected rough format:
        {"trigger": bool, "reasoning": str, "severity": "low"|"medium"|"high"}
        
    When trigger=True, forces should_interrupt=True on the next decision cycle for
    that session_id, overriding normal conversational cadence.
    """
    state = get_or_create_adaptive_state(session_id)
    state.pending_external_signal = signal


# ---------------------------------------------------------------------------
# Heuristic Signal Scorers
# ---------------------------------------------------------------------------

TECH_KEYWORDS = {
    "acid", "b-tree", "indexing", "concurrency", "deadlock", "mutex", "semaphore",
    "paging", "virtual memory", "tlb", "tcp", "udp", "three-way handshake",
    "http", "https", "rest", "grpc", "solid", "polymorphism", "inheritance",
    "latency", "throughput", "cache", "redis", "kafka", "distributed", "load balancer",
    "replication", "sharding", "consistency", "isolation", "star", "situation",
    "metric", "percent", "scale", "qps", "algorithm", "complexity", "o(n)", "o(log n)"
}

HESITATION_PHRASES = [
    "i think maybe", "not really sure", "i don't know", "i guess", "probably",
    "not familiar", "honestly don't", "might be wrong", "forgot how", "no idea"
]


def compute_heuristic_depth(answer: str) -> int:
    """Calculates a baseline depth score (1-5) using word count and domain specifics."""
    words = answer.strip().split()
    word_count = len(words)
    lower_answer = answer.lower()

    keyword_hits = sum(1 for kw in TECH_KEYWORDS if kw in lower_answer)
    has_numbers = bool(re.search(r"\b\d+(?:\.\d+)?%?\b", answer))

    if word_count < 15:
        return 1
    elif word_count < 35:
        return 2 if keyword_hits == 0 else 3
    elif word_count < 80:
        base = 3
        if keyword_hits >= 2 or has_numbers:
            base += 1
        return min(5, base)
    else:
        # Detailed answer
        base = 4
        if keyword_hits >= 3 or (keyword_hits >= 1 and has_numbers):
            base = 5
        return base


def compute_heuristic_confidence(answer: str) -> int:
    """Calculates a baseline confidence score (1-5) based on hesitation and self-contradiction cues."""
    lower = answer.lower()
    hesitation_count = sum(1 for phrase in HESITATION_PHRASES if phrase in lower)

    if hesitation_count >= 2 or lower in ["idk", "i don't know", "no idea", "pass"]:
        return 1
    elif hesitation_count == 1:
        return 2
    elif len(answer.strip().split()) < 10:
        return 2
    elif len(answer.strip().split()) > 40:
        return 5
    return 4


# ---------------------------------------------------------------------------
# LLM Evaluation & Decision Engine
# ---------------------------------------------------------------------------

def call_llm_json(system_prompt: str, user_prompt: str, max_retries: int = 3) -> dict | None:
    """Helper calling OpenRouter/Groq with JSON parsing."""
    groq_key = os.getenv("GROQ_API_KEY")
    if groq_key and not groq_key.startswith("gsk_placeholder"):
        try:
            from groq import Groq
            client = Groq(api_key=groq_key)
            model = os.getenv("GROQ_MODEL", "openai/gpt-oss-20b")
            for attempt in range(max_retries):
                try:
                    res = client.chat.completions.create(
                        model=model,
                        messages=[
                            {"role": "system", "content": system_prompt},
                            {"role": "user", "content": user_prompt},
                        ],
                        temperature=0.3,
                        max_tokens=1024,
                    )
                    content = res.choices[0].message.content or ""
                    match = re.search(r"\{.*\}", content, re.DOTALL)
                    if match:
                        return json.loads(match.group(0))
                except Exception as e:
                    if "429" in str(e) or "rate_limit" in str(e).lower():
                        time.sleep(2 * (attempt + 1))
                        continue
                    print(f"  [Adaptive Groq error]: {e}")
                    break
        except Exception as e:
            print(f"  [Adaptive Groq init error]: {e}")

    openrouter_key = os.getenv("OPENROUTER_API_KEY")
    if openrouter_key:
        from openai import OpenAI, RateLimitError
        client = OpenAI(
            base_url=os.getenv("OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1"),
            api_key=openrouter_key,
        )
        model = os.getenv("OPENROUTER_MODEL", "nvidia/nemotron-3-ultra-550b-a55b:free")
        for attempt in range(max_retries):
            try:
                res = client.chat.completions.create(
                    model=model,
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt},
                    ],
                    temperature=0.3,
                    max_tokens=1024,
                )
                if not res or not res.choices:
                    continue
                choice = res.choices[0]
                content = choice.message.content or getattr(choice.message, "reasoning", "") or ""
                match = re.search(r"\{.*\}", content, re.DOTALL)
                if match:
                    return json.loads(match.group(0))
            except Exception as e:
                if "429" in str(e) or isinstance(e, RateLimitError):
                    time.sleep(2 * (attempt + 1))
                    continue
                print(f"  [Adaptive OpenRouter error]: {e}")
                return None
    return None


def evaluate_and_decide(
    session_id: str,
    topic: str,
    candidate_answer: str,
    interview_type: str = "technical",
) -> AdaptiveDecision:
    """
    Evaluates candidate response depth and confidence, then produces an adaptive
    interview decision (interrupt, follow-up, or transition to a new topic).
    """
    state = get_or_create_adaptive_state(session_id, topic)
    topic_state = state.topics_covered[topic]

    heuristic_depth = compute_heuristic_depth(candidate_answer)
    heuristic_conf = compute_heuristic_confidence(candidate_answer)

    # Check external live coding signal override
    pending_signal = state.pending_external_signal
    state.pending_external_signal = None  # Consume signal

    system_prompt = """You are an expert interviewer evaluating a candidate's answer to decide the next conversational step.
Return a JSON object with:
- "depth_score": integer from 1 to 5 (1=shallow/hand-wavy, 3=adequate, 5=exceptionally thorough with concrete details/trade-offs)
- "confidence_score": integer from 1 to 5 (1=hesitant/confused/contradictory, 3=neutral, 5=clear/confident/structured)
- "should_interrupt": boolean (true if candidate is severely off-track or a critical flaw needs immediate redirection)
- "should_follow_up": boolean (true if current topic needs a deeper probe or clarification)
- "next_action": "follow_up" | "new_topic" | "wrap_topic"
- "reasoning": concise 1-2 sentence explanation of your decision (for internal logging).

DECISION RULES:
1. STRONG COMPLETE ANSWER (depth >= 4, confidence >= 4):
   - Do NOT follow up unnecessarily. Set should_follow_up=false, next_action="new_topic" (or "wrap_topic").
2. VAGUE, SHALLOW, OR PARTIAL ANSWER (depth <= 2 or confidence <= 2):
   - If follow_ups_count < 3: Set should_follow_up=true, next_action="follow_up".
   - If follow_ups_count >= 3: Move on to prevent getting stuck (next_action="new_topic").
3. MODERATE ANSWER (depth=3):
   - If follow_ups_count < 2: Can ask 1 clarifying follow-up (next_action="follow_up").
   - Otherwise: next_action="new_topic".
"""

    user_prompt = f"""Interview Type: {interview_type}
Current Topic: {topic}
Prior Follow-ups on this Topic: {topic_state.follow_ups_count}
Candidate Latest Answer:
"{candidate_answer}"

Heuristic Depth Hint: {heuristic_depth}/5
Heuristic Confidence Hint: {heuristic_conf}/5
"""

    llm_result = call_llm_json(system_prompt, user_prompt)

    if llm_result:
        try:
            depth = int(llm_result.get("depth_score", heuristic_depth))
            confidence = int(llm_result.get("confidence_score", heuristic_conf))
            should_interrupt = bool(llm_result.get("should_interrupt", False))
            should_follow_up = bool(llm_result.get("should_follow_up", False))
            next_action = str(llm_result.get("next_action", "new_topic"))
            if next_action not in ["follow_up", "new_topic", "wrap_topic"]:
                next_action = "follow_up" if should_follow_up else "new_topic"
            reasoning = str(llm_result.get("reasoning", "Adaptive evaluation completed."))
        except Exception:
            depth = heuristic_depth
            confidence = heuristic_conf
            should_interrupt = False
            should_follow_up = depth <= 2 and topic_state.follow_ups_count < 2
            next_action = "follow_up" if should_follow_up else "new_topic"
            reasoning = f"Heuristic evaluation: depth={depth}, confidence={confidence}."
    else:
        # Fallback to pure heuristic decision
        depth = heuristic_depth
        confidence = heuristic_conf
        should_interrupt = False
        should_follow_up = (depth <= 2 or confidence <= 2) and topic_state.follow_ups_count < 2
        next_action = "follow_up" if should_follow_up else "new_topic"
        reasoning = f"Heuristic fallback: depth={depth}/5, confidence={confidence}/5, follow_ups={topic_state.follow_ups_count}."

    # External coding signal override
    if pending_signal and pending_signal.get("trigger"):
        should_interrupt = True
        should_follow_up = True
        next_action = "follow_up"
        reasoning += f" [EXTERNAL SIGNAL OVERRIDE: {pending_signal.get('reasoning', 'Triggered')}]"

    # Enforce max follow-up cap (never exceed 3 follow-ups on the same topic)
    if next_action == "follow_up" and topic_state.follow_ups_count >= 3:
        should_follow_up = False
        next_action = "new_topic"
        reasoning += " (Max follow-up limit reached for topic, advancing)."

    # Update session tracking state
    topic_state.depth_scores.append(depth)
    topic_state.confidence_scores.append(confidence)
    topic_state.last_answer_summary = candidate_answer[:120]
    if next_action == "follow_up":
        topic_state.follow_ups_count += 1
    state.total_turns += 1

    decision = AdaptiveDecision(
        should_interrupt=should_interrupt,
        should_follow_up=should_follow_up,
        next_action=next_action,
        reasoning=reasoning,
        depth_score=depth,
        confidence_score=confidence,
    )

    print(f"  [Adaptive Engine] session={session_id[:8]} topic='{topic}' | depth={depth}/5 conf={confidence}/5 | action={next_action} interrupt={should_interrupt} | {reasoning}")
    return decision
