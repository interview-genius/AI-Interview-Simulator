"""
Step 6 -- Person A: Multi-turn Session Manager for Mock Interviews.

Manages conversational state and message history across turns for live
mock interviews. Formats conversation history for consumption by OpenAI / OpenRouter
and other OpenAI-compatible chat completion APIs.
"""

from typing import Any


class InterviewSession:
    """Manages the multi-turn state of an active mock interview."""

    def __init__(
        self,
        system_prompt: str = "",
        persona: dict[str, Any] | None = None,
    ):
        self.system_prompt = system_prompt
        self.persona = persona or {}
        self.messages: list[dict[str, str]] = []

    def add_turn(self, role: str, content: str) -> None:
        """Appends a turn to the conversation history.

        Accepts roles: 'user' / 'candidate', 'assistant' / 'model' / 'interviewer'.
        Normalizes internal storage to 'user' and 'assistant'.
        """
        normalized_role = "user" if role.lower() in ["user", "candidate"] else "assistant"
        self.messages.append({
            "role": normalized_role,
            "content": content.strip(),
        })

    def add_user_message(self, content: str) -> None:
        """Convenience method to append a candidate/user turn."""
        self.add_turn("user", content)

    def add_assistant_message(self, content: str) -> None:
        """Convenience method to append an interviewer/assistant turn."""
        self.add_turn("assistant", content)

    def add_model_message(self, content: str) -> None:
        """Alias for add_assistant_message for backward compatibility."""
        self.add_turn("assistant", content)

    def get_history(self) -> list[dict[str, str]]:
        """Returns the full list of recorded message turns."""
        return list(self.messages)

    def get_openai_messages(self) -> list[dict[str, str]]:
        """Formats conversation history for OpenAI / OpenRouter API calls.

        Returns list of messages starting with the system instruction followed by
        'user' and 'assistant' turns.
        """
        msgs: list[dict[str, str]] = []
        if self.system_prompt:
            msgs.append({"role": "system", "content": self.system_prompt})
        for msg in self.messages:
            role = "assistant" if msg["role"] in ["model", "assistant", "interviewer"] else "user"
            msgs.append({"role": role, "content": msg["content"]})
        return msgs

    def get_gemini_contents(self) -> list[dict[str, Any]]:
        """Formats conversation history for Gemini API calls."""
        gemini_contents = []
        for msg in self.messages:
            role = "user" if msg["role"] == "user" else "model"
            gemini_contents.append({
                "role": role,
                "parts": [{"text": msg["content"]}],
            })
        return gemini_contents

    def get_transcript_text(self) -> str:
        """Returns a clean formatted text representation of the interview transcript."""
        lines = []
        for i, msg in enumerate(self.messages, start=1):
            speaker = "Candidate" if msg["role"] == "user" else "Interviewer"
            lines.append(f"[{i}] {speaker}:\n{msg['content']}\n")
        return "\n".join(lines)

    def turn_count(self) -> int:
        """Returns the total number of dialogue turns."""
        return len(self.messages)

    def reset(self) -> None:
        """Clears all turns to start a fresh interview session."""
        self.messages.clear()


def create_session(
    system_prompt: str = "",
    persona: dict[str, Any] | None = None,
) -> InterviewSession:
    """Factory helper to initialize a new InterviewSession."""
    return InterviewSession(system_prompt=system_prompt, persona=persona)


def main():
    session = create_session(system_prompt="You are a mock interviewer.")
    session.add_assistant_message("Welcome to your interview! Could you start by introducing yourself?")
    session.add_user_message("Hi, I'm a software engineer with 2 years of experience in backend systems.")
    session.add_assistant_message("Great. Can you explain how you would design a rate limiter in Python?")

    print("=" * 70)
    print("SESSION MANAGER TEST OUTPUT")
    print("=" * 70)
    print(f"Total turns: {session.turn_count()}")
    print("\nTranscript:\n" + session.get_transcript_text())
    print("\nOpenAI messages payload:")
    print(session.get_openai_messages())


if __name__ == "__main__":
    main()
