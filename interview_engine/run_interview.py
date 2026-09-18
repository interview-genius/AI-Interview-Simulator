"""
Step 6 -- Person A: Interactive CLI Runner for Mock Interviews (OpenRouter).

End-to-end execution flow:
1. Prompts candidate for company, role, and round type in terminal.
2. Calls retrieval.py to fetch matching past reports with rounds JSONB (Gemini embeddings).
3. Calls persona_builder.py to derive realistic interviewer tone, topics, and difficulty.
4. Calls interview_prompt.py to create the interviewer system instruction.
5. Initializes an InterviewSession and conducts a multi-turn interview loop via OpenRouter.
"""

import os
import re
import sys
import time

from dotenv import load_dotenv
from openai import OpenAI, RateLimitError

from interview_engine.interview_prompt import build_interview_system_prompt
from interview_engine.persona_builder import build_persona
from interview_engine.retrieval import retrieve_interview_context
from interview_engine.session import InterviewSession

load_dotenv()

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
if not OPENROUTER_API_KEY:
    raise ValueError("OPENROUTER_API_KEY was not found in .env")

OPENROUTER_BASE_URL = os.getenv("OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1")
# OpenRouter model for live mock interview chat (override via OPENROUTER_MODEL in .env)
OPENROUTER_MODEL = os.getenv("OPENROUTER_MODEL", "nvidia/nemotron-3-ultra-550b-a55b:free")


def _extract_retry_delay(error_str: str, default_delay: float = 20.0) -> float:
    """Extracts suggested retry delay in seconds from error payload (e.g. 'retry_after_seconds': 15).
    Falls back to default_delay if not specified.
    """
    match = re.search(r"retry_after_seconds['\"]?\s*:\s*['\"]?(\d+(?:\.\d+)?)s?", error_str, re.IGNORECASE)
    if not match:
        match = re.search(r"retryDelay['\"]?\s*:\s*['\"]?(\d+(?:\.\d+)?)s?", error_str, re.IGNORECASE)
    if match:
        try:
            return float(match.group(1))
        except (ValueError, TypeError):
            pass
    return default_delay


def send_message_with_retry(
    client: OpenAI,
    messages: list[dict[str, str]],
    model: str = OPENROUTER_MODEL,
    max_retries: int = 3,
) -> str:
    """Sends a chat completion request to OpenRouter with backoff on rate limits.

    Catches 429 / RateLimitError responses, parses any suggested retry delay, and
    retries up to 3 times without losing conversation state.
    """
    attempt = 0
    while attempt <= max_retries:
        try:
            response = client.chat.completions.create(
                model=model,
                messages=messages,
                temperature=0.7,
            )
            if not response or not response.choices:
                raise ValueError("No response choices returned by OpenRouter.")
            choice = response.choices[0]
            content = choice.message.content
            if content is None:
                content = getattr(choice.message, "reasoning", "") or ""
            return content.strip()
        except Exception as e:
            error_str = str(e)
            is_rate_limit = (
                isinstance(e, RateLimitError)
                or "429" in error_str
                or "rate" in error_str.lower()
                or (hasattr(e, "status_code") and getattr(e, "status_code") == 429)
            )

            if is_rate_limit and attempt < max_retries:
                attempt += 1
                delay = _extract_retry_delay(error_str, default_delay=20.0)
                wait_time = max(delay, 5.0) + 2.0  # +2s buffer
                print(
                    f"\n[Rate limit hit on OpenRouter -- "
                    f"waiting {wait_time:.0f}s before retry (attempt {attempt}/{max_retries})...]"
                )
                time.sleep(wait_time)
                continue

            raise e


def run_mock_interview():
    """Runs a complete interactive mock interview session in the terminal via OpenRouter."""
    print("=" * 70)
    print("       AI INTERVIEW SIMULATOR -- MOCK INTERVIEW ENGINE (STEP 6)")
    print("=" * 70)
    print("Configure your target interview (press Enter for defaults):\n")

    try:
        company_input = input("Target Company [Google]: ").strip()
        company = company_input if company_input else "Google"

        role_input = input("Target Role [Software Engineer]: ").strip()
        role = role_input if role_input else "Software Engineer"

        round_input = input("Round Type (e.g., Coding, System Design, Behavioral) [Coding]: ").strip()
        round_type = round_input if round_input else "Coding"
    except (KeyboardInterrupt, EOFError):
        print("\nInterview setup cancelled.")
        return

    print("\n" + "-" * 70)
    print(f"Retrieving historical interview reports for {company} - {role} ({round_type})...")
    
    # 1. Retrieval (uses Gemini document embeddings via pgvector)
    reports = retrieve_interview_context(
        company=company,
        role=role,
        round_type=round_type,
        limit=5,
    )
    print(f"Retrieved {len(reports)} matching historical reports.")

    # 2. Persona Building
    persona = build_persona(
        reports=reports,
        company=company,
        role=role,
        round_type=round_type,
    )

    print("\n" + "=" * 70)
    print("               INTERVIEWER PERSONA PROFILE")
    print("=" * 70)
    print(f"  Company:          {persona['company']}")
    print(f"  Role:             {persona['role']}")
    print(f"  Round Focus:      {persona['round_type']}")
    print(f"  Tone:             {persona['dominant_tone']}")
    print(f"  Difficulty:       {persona['typical_difficulty']}")
    print(f"  Focus Topics:     {', '.join(persona['common_topics'])}")
    print(f"  Follow-up Style:  {persona['typical_follow_up_pattern']}")
    print("=" * 70)

    # 3. System Prompt Construction
    system_prompt = build_interview_system_prompt(persona)

    # 4. Initialize Session
    session = InterviewSession(system_prompt=system_prompt, persona=persona)

    # 5. Initialize OpenRouter Client
    client = OpenAI(
        base_url=OPENROUTER_BASE_URL,
        api_key=OPENROUTER_API_KEY,
    )

    print(f"\nStarting live interview session using model '{OPENROUTER_MODEL}'.")
    print("Type 'exit' or 'quit' anytime to end.\n")
    print("-" * 70)

    # Generate initial greeting and first question
    try:
        opening_prompt = (
            "Please start the interview now: introduce yourself briefly in your persona, "
            f"mention this is the {round_type} round for {role} at {company}, "
            "and ask your first question."
        )
        initial_messages = session.get_openai_messages() + [{"role": "user", "content": opening_prompt}]
        interviewer_text = send_message_with_retry(client, initial_messages)
        session.add_assistant_message(interviewer_text)

        print(f"\n[Interviewer]:\n{interviewer_text}\n")
    except Exception as e:
        print(f"\n[Error connecting to OpenRouter API]: {e}")
        return

    # Multi-turn dialogue loop
    turn = 1
    while True:
        try:
            print("-" * 70)
            user_input = input(f"\n[Candidate - Turn {turn}]:\n> ").strip()

            if not user_input:
                print("Please enter a response, or type 'exit' to quit.")
                continue

            if user_input.lower() in ["exit", "quit", "q"]:
                print("\nEnding interview session...")
                break

            session.add_user_message(user_input)

            # Generate interviewer's adaptive follow-up
            interviewer_text = send_message_with_retry(client, session.get_openai_messages())
            session.add_assistant_message(interviewer_text)

            turn += 1
            print(f"\n[Interviewer - Turn {turn}]:\n{interviewer_text}\n")

        except (KeyboardInterrupt, EOFError):
            print("\nInterview session interrupted.")
            break
        except Exception as e:
            print(f"\n[Error during conversation turn]: {e}")
            break

    print("\n" + "=" * 70)
    print(f"INTERVIEW CONCLUDED -- Completed {session.turn_count()} dialogue turns.")
    print("=" * 70)


if __name__ == "__main__":
    run_mock_interview()
