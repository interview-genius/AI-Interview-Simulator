"""
Step 6 -- Person A: Persona Builder for Interview Engine.

Aggregates retrieved historical interview reports (company, role, rounds JSONB,
tone, outcome) to construct a realistic interviewer persona profile.

Derives:
- dominant_tone: Most frequent interview tone across matching reports
- common_topics: Top recurring topics across all rounds
- typical_difficulty: Most frequent difficulty level (Easy, Medium, Hard)
- typical_follow_up_pattern: Adaptive follow-up style based on tone and round type

Simple aggregation logic only -- no LLM calls in this file.
"""

from collections import Counter
from typing import Any


def derive_follow_up_pattern(
    dominant_tone: str,
    typical_difficulty: str,
    round_type: str,
    common_topics: list[str],
) -> str:
    """Derives a rule-based follow-up behavior pattern from persona attributes."""
    tone_lower = dominant_tone.lower()
    round_lower = round_type.lower()
    topics_lower = [t.lower() for t in common_topics]

    # Check for Behavioral / Leadership focus
    is_behavioral = (
        "behavioral" in round_lower
        or "hr" in round_lower
        or any("leadership" in t or "star" in t or "behavioral" in t for t in topics_lower)
    )
    if is_behavioral:
        return (
            "STAR-oriented probing: asks for specific past situations, individual actions, "
            "measurable outcomes, conflict resolution, and leadership lessons."
        )

    # Check for Rigorous / Intense tone
    if any(k in tone_lower for k in ["intense", "rigorous", "strict", "fast-paced", "formal"]):
        return (
            "Direct and demanding probing: challenges suboptimal solutions, questions "
            "time/space complexity, pushes on edge cases, and tests scale limits."
        )

    # Check for Friendly / Conversational tone
    if any(k in tone_lower for k in ["friendly", "encouraging", "conversational", "relaxed", "patient"]):
        return (
            "Collaborative and progressive probing: asks candidates to walk through their "
            "thought process, offers subtle hints when stuck, and discusses practical trade-offs."
        )

    # Check for Hard difficulty
    if typical_difficulty.lower() == "hard":
        return (
            "Deep architectural & algorithmic probing: introduces scale constraints, "
            "concurrency edge cases, and asks for alternative data structures and optimizations."
        )

    # Default pattern
    return (
        "Structured progressive deep-dive: starts with high-level design/concept questions, "
        "then probes into implementation details, edge cases, and trade-off justification."
    )


def build_persona(
    reports: list[dict[str, Any]],
    company: str = "",
    role: str = "",
    round_type: str = "",
) -> dict[str, Any]:
    """Builds an aggregated interviewer persona profile from retrieved report rows.

    Parameters:
        reports: List of dicts from retrieval.py containing company, role, rounds, tone.
        company: Target company name.
        role: Target role.
        round_type: Target round type (e.g. Coding, System Design, Behavioral).

    Returns:
        Dictionary containing dominant tone, top topics, typical difficulty, and follow-up pattern.
    """
    tone_counter: Counter[str] = Counter()
    difficulty_counter: Counter[str] = Counter()
    topic_counter: Counter[str] = Counter()
    round_type_counter: Counter[str] = Counter()

    for r in reports:
        # Collect tone
        tone = r.get("tone")
        if tone and isinstance(tone, str) and tone.strip().lower() not in ["none", "unstated", "unknown", "null"]:
            tone_counter[tone.strip()] = tone_counter[tone.strip()] + 1

        # Collect rounds information
        rounds_data = r.get("rounds") or []
        if isinstance(rounds_data, list):
            for rd in rounds_data:
                if not isinstance(rd, dict):
                    continue

                # Round types
                r_types = rd.get("type") or []
                if isinstance(r_types, str):
                    r_types = [r_types]
                for rt in r_types:
                    if rt and isinstance(rt, str) and rt.strip():
                        round_type_counter[rt.strip().title()] += 1

                # Topics
                topics = rd.get("topics") or []
                if isinstance(topics, str):
                    topics = [topics]
                for tp in topics:
                    if tp and isinstance(tp, str) and tp.strip():
                        topic_counter[tp.strip()] += 1

                # Difficulty
                diff = rd.get("difficulty")
                if diff and isinstance(diff, str) and diff.strip().lower() not in ["none", "unstated", "n/a", "null"]:
                    difficulty_counter[diff.strip().title()] += 1

    # Dominant Tone
    if tone_counter:
        dominant_tone = tone_counter.most_common(1)[0][0]
    else:
        dominant_tone = "Professional, structured, and conversational"

    # Common Topics (Top 6)
    if topic_counter:
        common_topics = [t for t, _ in topic_counter.most_common(6)]
    else:
        # Fallback topics if none extracted
        if "behavioral" in round_type.lower():
            common_topics = ["Project deep-dive", "Conflict resolution", "Leadership principles", "Overcoming challenges"]
        elif "system design" in round_type.lower() or "design" in round_type.lower():
            common_topics = ["High-level architecture", "Data modeling", "Scalability & Caching", "API design", "Latency trade-offs"]
        else:
            common_topics = ["Data structures", "Algorithms", "Time and space complexity", "Edge case handling"]

    # Typical Difficulty
    if difficulty_counter:
        typical_difficulty = difficulty_counter.most_common(1)[0][0]
    else:
        typical_difficulty = "Medium"

    # Top round types observed
    top_round_types = [rt for rt, _ in round_type_counter.most_common(4)] if round_type_counter else [round_type or "Technical"]

    # Derive follow-up pattern
    follow_up_pattern = derive_follow_up_pattern(
        dominant_tone=dominant_tone,
        typical_difficulty=typical_difficulty,
        round_type=round_type,
        common_topics=common_topics,
    )

    return {
        "company": company or "Target Company",
        "role": role or "Software Engineer",
        "round_type": round_type or "Technical Interview",
        "dominant_tone": dominant_tone,
        "common_topics": common_topics,
        "typical_difficulty": typical_difficulty,
        "typical_follow_up_pattern": follow_up_pattern,
        "top_round_types": top_round_types,
        "reports_analyzed": len(reports),
        "tone_breakdown": dict(tone_counter.most_common(3)),
    }


def main():
    # Quick test with synthetic/retrieved mock data
    sample_reports = [
        {
            "id": 1,
            "company": "Google",
            "role": "Software Engineer",
            "tone": "friendly and conversational",
            "rounds": [
                {"type": ["Coding", "DSA"], "topics": ["Graphs", "BFS", "DFS"], "difficulty": "Hard"},
                {"type": ["Behavioral"], "topics": ["Googleyness", "Teamwork"], "difficulty": "Medium"},
            ],
        },
        {
            "id": 2,
            "company": "Google",
            "role": "Software Engineer",
            "tone": "friendly and conversational",
            "rounds": [
                {"type": ["Coding"], "topics": ["Dynamic Programming", "Trees"], "difficulty": "Hard"},
                {"type": ["System Design"], "topics": ["Distributed Caching", "Rate Limiter"], "difficulty": "Medium"},
            ],
        },
    ]

    persona = build_persona(
        sample_reports,
        company="Google",
        role="Software Engineer",
        round_type="Coding",
    )

    print("=" * 70)
    print("PERSONA BUILDER TEST OUTPUT")
    print("=" * 70)
    for k, v in persona.items():
        print(f"{k}: {v}")


if __name__ == "__main__":
    main()
