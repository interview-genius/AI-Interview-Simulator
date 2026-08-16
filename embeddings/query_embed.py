"""
Step 5 -- Person B: query-side embedding.

MODEL CHOICE -- must match Person A's storage side exactly:
    model: gemini-embedding-001
    output_dimensionality: 768  (matches the `vector(768)` column type)
Different models or dimensions on each side means queries and stored reports
live in different vector spaces -- similarity search would return meaningless
results even though nothing "errors."

TASK TYPE -- asymmetric, not the same on both sides, ON PURPOSE:
Gemini's embedding API takes a task_type hint that changes how the model
weights the input. This is a query, so it should be embedded with
task_type="RETRIEVAL_QUERY". Person A's stored reports should be embedded
with task_type="RETRIEVAL_DOCUMENT" on her side -- using the matching pair
measurably improves retrieval quality over using the same task_type on both
sides (or leaving it unset).
"""

import os

from dotenv import load_dotenv
from google import genai

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    raise ValueError("GEMINI_API_KEY was not found in .env")

client = genai.Client(api_key=GEMINI_API_KEY)

EMBEDDING_MODEL = "gemini-embedding-001"
EMBEDDING_DIM = 768


def embed_query(text: str) -> list[float]:
    """Embed a user's search query (e.g. 'Google coding round graphs') for
    similarity search against stored report embeddings."""
    result = client.models.embed_content(
        model=EMBEDDING_MODEL,
        contents=text,
        config={
            "output_dimensionality": EMBEDDING_DIM,
            "task_type": "RETRIEVAL_QUERY",
        },
    )
    return result.embeddings[0].values


if __name__ == "__main__":
    vec = embed_query("Google coding round with graph and dynamic programming questions")
    print(f"Embedded query into a {len(vec)}-dim vector.")
    print(f"First 5 values: {vec[:5]}")
