"""
Step 6 -- Person B: run the feedback-scoring prompt for real.

Tested against interview_engine/sample_transcripts.py -- see that file's
docstring for why these are hand-written placeholders rather than real
output from Person A's engine (which doesn't exist yet).
"""

import json
import time

from groq import BadRequestError, RateLimitError
from pydantic import ValidationError

from interview_engine.feedback_prompt import call_groq
from interview_engine.feedback_schema import FeedbackScore
from interview_engine.sample_transcripts import ALL_SAMPLES


def call_groq_with_retry(transcript: str, max_retries: int = 4) -> str | None:
    for attempt in range(max_retries):
        try:
            return call_groq(transcript)
        except RateLimitError:
            wait = 5 * (attempt + 1)
            print(f"  [rate limited] waiting {wait}s (retry {attempt+1}/{max_retries})...")
            time.sleep(wait)
        except BadRequestError as e:
            print(f"  [error] Groq rejected the generation: {e}")
            return None
    return None


def score_transcript(transcript: str) -> FeedbackScore | None:
    raw_output = call_groq_with_retry(transcript)
    if raw_output is None:
        return None
    try:
        data = json.loads(raw_output)
        return FeedbackScore.model_validate(data)
    except (json.JSONDecodeError, ValidationError) as e:
        print(f"  [error] could not parse/validate feedback response: {e}")
        return None


def main():
    for name, transcript in ALL_SAMPLES.items():
        print("=" * 70)
        print(f"Transcript: {name}")
        score = score_transcript(transcript)

        if score is None:
            print("  SCORING FAILED")
            continue

        print(f"  STAR:    {score.star.score}/5  -- {score.star.tip}")
        print(f"  Depth:   {score.depth.score}/5  -- {score.depth.tip}")
        print(f"  Clarity: {score.clarity.score}/5  -- {score.clarity.tip}")
        print()


if __name__ == "__main__":
    main()
