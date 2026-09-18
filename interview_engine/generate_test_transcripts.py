"""
Replaces sample_transcripts.py's hand-written stand-ins with real output
from the ML Round conversation engine (conversation.py).

Runs a few sessions with scripted candidate answers, captures the full
conversation, and saves transcripts that feedback_scoring.py can score.

Usage:
    python -m interview_engine.generate_test_transcripts
"""

import json
import os
import time

from interview_engine.conversation import (
    start_ml_session,
    advance_ml_conversation,
    SESSIONS,
)


# Scripted candidate answers — realistic enough to produce a meaningful
# transcript, deliberately varying in quality so the feedback scorer has
# something interesting to differentiate between.

SCENARIOS = [
    {
        "name": "strong_ml_engineer",
        "company": "Google",
        "role": "ML Engineer",
        "level": "Mid",
        "candidate_answers": [
            "I worked on a recommendation system at my last company. We used a two-tower "
            "architecture with user and item embeddings trained via contrastive learning. "
            "The main challenge was handling the cold-start problem for new users — we "
            "addressed it by incorporating side features like demographics and device type "
            "into the user tower until we had enough interaction data.",

            "For model evaluation, we used a holdout set with NDCG@10 as our primary "
            "metric, but we also tracked business metrics like click-through rate and "
            "revenue per session. We ran A/B tests for every model change — the A/B test "
            "for our contrastive learning approach showed a 4.2% lift in CTR over the "
            "previous matrix factorization baseline.",

            "Trade-offs I'd consider: first, latency versus quality — a heavier model "
            "with cross-features might score better offline but add 50ms to serving, "
            "which matters at scale. Second, freshness versus stability — retraining "
            "daily captures trends but risks instability. We settled on daily retrains "
            "with a canary rollout to catch regressions before full deployment.",
        ],
    },
    {
        "name": "weak_ml_engineer",
        "company": "Amazon",
        "role": "Applied Scientist",
        "level": "New Grad",
        "candidate_answers": [
            "Yeah so in school I did a project with machine learning, I think it was "
            "about predicting something. We used Python and some libraries. I worked "
            "with a team and we got a decent result I think.",

            "I'm not really sure about evaluation metrics specifically. We just looked "
            "at the accuracy and it seemed okay. I think for real products you'd want "
            "to do more testing but I haven't done that professionally.",

            "I guess you'd want a model that's fast and accurate? I haven't really "
            "thought about deployment or serving before. In school everything just ran "
            "on our laptops so that wasn't an issue.",
        ],
    },
    {
        "name": "strong_case_study",
        "company": "Meta",
        "role": "ML Engineer",
        "level": "Senior",
        "candidate_answers": [
            "For a content moderation system at scale, I'd start by defining the "
            "taxonomy of violations and getting labeled data — likely a combination of "
            "human-labeled examples from existing moderators and weak supervision using "
            "rule-based heuristics. The initial model would be a fine-tuned "
            "transformer classifier for high-precision categories like nudity and "
            "violence, with a separate model for more nuanced categories like hate "
            "speech that need additional context.",

            "The main challenges are class imbalance — violations are rare relative to "
            "total content — and the adversarial nature of the problem where bad actors "
            "actively try to evade detection. I'd address imbalance with focal loss and "
            "stratified sampling. For adversarial robustness, I'd implement a feedback "
            "loop where flagged-but-undetected content from human reviewers feeds back "
            "into training. I'd also use multilingual embeddings to handle content "
            "across languages without separate models per language.",

            "For serving, I'd use a two-stage pipeline: a lightweight model for initial "
            "filtering at high throughput, then a heavier model for borderline cases. "
            "We'd need sub-100ms latency on the first stage to keep up with upload "
            "volume. Monitoring would track precision/recall per category daily, with "
            "automated alerts if drift is detected — something like a PSI test on the "
            "score distribution.",
        ],
    },
]


def format_transcript(session_state) -> str:
    """Convert a session's history into a readable Interviewer/Candidate transcript."""
    lines = []
    for entry in session_state.history:
        speaker = "Interviewer" if entry["role"] == "assistant" else "Candidate"
        lines.append(f"{speaker}: {entry['content']}\n")
    return "\n".join(lines)


def run_scenario(scenario: dict) -> dict | None:
    """Run one interview scenario and return the transcript + metadata."""
    print(f"\n--- Scenario: {scenario['name']} ---")
    print(f"    Company: {scenario['company']}  Role: {scenario['role']}  Level: {scenario['level']}")

    try:
        session, turn = start_ml_session(
            company=scenario["company"],
            role=scenario["role"],
            level=scenario["level"],
        )
    except Exception as e:
        print(f"    FAILED to start session: {e}")
        return None

    if turn is None:
        print("    FAILED to get opening turn")
        return None

    print(f"    Phase: {session.active_phases[session.phase_index]}")
    print(f"    Opening: {turn.interviewer_response[:80]}...")

    # Feed scripted candidate answers
    for i, answer in enumerate(scenario["candidate_answers"]):
        time.sleep(1)  # stay under free-tier TPM cap
        try:
            next_turn = advance_ml_conversation(session.session_id, answer)
        except Exception as e:
            print(f"    FAILED on turn {i+1}: {e}")
            break

        if next_turn is None:
            print(f"    FAILED to get turn {i+1}")
            break

        phase = session.active_phases[min(session.phase_index, len(session.active_phases) - 1)]
        print(f"    Turn {i+1} → phase: {phase}  grounded: {next_turn.grounded}")

    transcript_text = format_transcript(session)
    print(f"    Transcript length: {len(transcript_text)} chars, {len(session.history)} turns")

    return {
        "name": scenario["name"],
        "company": scenario["company"],
        "role": scenario["role"],
        "level": scenario["level"],
        "transcript": transcript_text,
        "num_turns": len(session.history),
        "phases_covered": session.active_phases[: session.phase_index + 1],
    }


def main():
    os.makedirs("interview_engine/test_transcripts", exist_ok=True)

    results = []
    for scenario in SCENARIOS:
        result = run_scenario(scenario)
        if result:
            results.append(result)
        time.sleep(2)

    # Save individual transcripts
    for r in results:
        path = f"interview_engine/test_transcripts/{r['name']}.txt"
        with open(path, "w", encoding="utf-8") as f:
            f.write(r["transcript"])
        print(f"\nSaved {path}")

    # Save metadata index
    index = [
        {
            "name": r["name"],
            "company": r["company"],
            "role": r["role"],
            "level": r["level"],
            "num_turns": r["num_turns"],
            "phases_covered": r["phases_covered"],
            "file": f"{r['name']}.txt",
        }
        for r in results
    ]
    with open("interview_engine/test_transcripts/index.json", "w", encoding="utf-8") as f:
        json.dump(index, f, indent=2)

    print(f"\nGenerated {len(results)}/{len(SCENARIOS)} transcripts.")
    print("Run feedback scoring against them with:")
    print("  python -m interview_engine.feedback_scoring")


if __name__ == "__main__":
    main()
