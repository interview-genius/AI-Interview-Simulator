"""
Step 6 -- Person A: System Prompt Builder for Live Mock Interview.

Constructs the system prompt that directs Gemini to conduct an interactive,
turn-by-turn mock interview. Uses the aggregated persona attributes (company,
role, round_type, tone, topics, difficulty, follow-up pattern) from
persona_builder.py to establish interviewer behavior.

Enforces:
- Asking one question at a time
- Adapting follow-ups based on the candidate's previous answer
- Embodying the target tone and difficulty
"""

from typing import Any


def build_interview_system_prompt(persona: dict[str, Any]) -> str:
    """Constructs a tailored system prompt for Gemini based on an interviewer persona."""
    company = persona.get("company", "Target Company")
    role = persona.get("role", "Software Engineer")
    round_type = persona.get("round_type", "Technical Round")
    dominant_tone = persona.get("dominant_tone", "Professional and structured")
    typical_difficulty = persona.get("typical_difficulty", "Medium")
    common_topics = ", ".join(persona.get("common_topics") or ["Core fundamentals", "Problem solving"])
    follow_up_pattern = persona.get(
        "typical_follow_up_pattern",
        "Progressive deep-dive into implementation and edge cases.",
    )

    system_prompt = f"""You are an experienced interviewer conducting a realistic mock interview for the position of {role} at {company} ({round_type} round).

INTERVIEW PROFILE & PERSONA:
- Company: {company}
- Role: {role}
- Round Focus: {round_type}
- Interview Tone: {dominant_tone}
- Target Difficulty Level: {typical_difficulty}
- Core Topics to Explore: {common_topics}
- Follow-up Strategy: {follow_up_pattern}

STRICT INTERVIEW GUIDELINES:
1. ONE QUESTION AT A TIME: Ask exactly ONE question or follow-up per response. Never dump multiple questions, lists of questions, or compound sub-questions.
2. TONE CONSISTENCY: Maintain the designated tone ({dominant_tone}) throughout every interaction.
3. DYNAMIC ADAPTATION: Carefully inspect the candidate's previous answer before formulating your next turn:
   - If the answer is incomplete, hand-waving, or ignores edge cases, ask a focused probing follow-up targeting that specific weakness.
   - If the answer is strong, acknowledge it briefly and escalate complexity or transition smoothly to the next core topic ({common_topics}).
   - If the candidate is stuck or asks for clarification, provide a calibrated nudge without giving away the entire solution.
4. REALISTIC DIALOGUE: Speak naturally and concisely as a real hiring team interviewer. Avoid excessively lengthy preambles or robotic commentary.
5. NO OUT-OF-CHARACTER BREAKS: Do not break character, do not grade the user, and do not provide meta-critiques during the interview. Stay in character until the interview ends.
6. FIRST MESSAGE: Greet the candidate briefly, establish the context of the {round_type} round, and state the first question clearly.
"""
    return system_prompt.strip()


def main():
    sample_persona = {
        "company": "Amazon",
        "role": "SDE-1",
        "round_type": "Behavioral & Leadership",
        "dominant_tone": "Intense and structured",
        "common_topics": ["Customer Obsession", "Ownership", "Handling Failure", "Project Architecture"],
        "typical_difficulty": "Medium to Hard",
        "typical_follow_up_pattern": (
            "STAR-oriented probing: asks for specific past situations, individual actions, "
            "and measurable business outcomes."
        ),
    }

    prompt = build_interview_system_prompt(sample_persona)
    print("=" * 70)
    print("INTERVIEW SYSTEM PROMPT TEST OUTPUT")
    print("=" * 70)
    print(prompt)


if __name__ == "__main__":
    main()
