"""
Person A — Step 4: inverted-index-style topic search over
structured_reports.rounds.

Uses the GIN index created in create_topic_index.sql and adds
topic-variant handling for inconsistent capitalization, singular/plural
forms, and common abbreviations in the extracted topic vocabulary.

Example:
    search_by_topic("graphs")
    search_by_topic("graph")

Both searches return reports containing variants such as:
    graph, Graph, graphs, Graphs
"""

import json
import os

import psycopg2
from dotenv import load_dotenv


load_dotenv()

DATABASE_URL = os.getenv("SUPABASE_DB_URL") or os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise ValueError(
        "Neither SUPABASE_DB_URL nor DATABASE_URL was found in .env"
    )


# ---------------------------------------------------------------------
# Topic aliases / normalization groups
#
# The extracted Step 3 data contains inconsistent capitalization,
# singular/plural forms, and abbreviations.
#
# Each canonical topic maps to all known variants that should be treated
# as equivalent during search.
# ---------------------------------------------------------------------

TOPIC_ALIASES = {
    "graphs": [
        "graph",
        "Graph",
        "graphs",
        "Graphs",
        "graph algorithms",
        "Graph Algorithms",
        "graph theory",
        "Graph Theory",
        "graph problem",
        "Graph Problem",
    ],

    "dynamic programming": [
        "dp",
        "DP",
        "dynamic programming",
        "Dynamic programming",
        "Dynamic Programming",
    ],

    "algorithms": [
        "algorithm",
        "Algorithm",
        "algorithms",
        "Algorithms",
    ],

    "data structures": [
        "data structure",
        "Data Structure",
        "data structures",
        "Data Structures",
    ],

    "data structures and algorithms": [
        "dsa",
        "DSA",
        "Data Structures and Algorithms",
    ],

    "trees": [
        "tree",
        "Tree",
        "trees",
        "Trees",
    ],

    "arrays": [
        "array",
        "Array",
        "arrays",
        "Arrays",
    ],

    "linked lists": [
        "linked list",
        "Linked List",
        "linkedlist",
        "LinkedList",
    ],

    "hash maps": [
        "hash map",
        "Hash Map",
        "hashmap",
        "HashMap",
    ],

    "heaps": [
        "heap",
        "Heap",
        "heaps",
        "Heaps",
        "heap (priority queue)",
        "Heap (Priority Queue)",
    ],

    "stacks": [
        "stack",
        "Stack",
        "stacks",
        "Stacks",
    ],

    "queues": [
        "queue",
        "Queue",
        "queues",
        "Queues",
    ],

    "sliding window": [
        "sliding window",
        "Sliding window",
        "Sliding Window",
    ],

    "system design": [
        "system design",
        "System design",
        "System Design",
    ],

    "low-level design": [
        "low-level design",
        "Low-level design",
        "Low-Level Design",
    ],

    "leetcode": [
        "leetcode",
        "Leetcode",
        "LeetCode",
    ],

    "behavioral": [
        "behavioral",
        "Behavioral",
        "behavioral questions",
        "Behavioral scenarios",
    ],

    "leadership": [
        "leadership",
        "Leadership",
        "leadership principles",
        "Leadership Principles",
    ],

    "edge cases": [
        "edge cases",
        "Edge cases",
        "Edge Cases",
    ],

    "caching": [
        "caching",
        "Caching",
    ],

    "scaling": [
        "scaling",
        "Scaling",
        "scalability",
        "Scalability",
    ],
}


def get_connection():
    """Create and return a PostgreSQL connection."""
    return psycopg2.connect(DATABASE_URL)


def normalize_input(topic: str) -> str:
    """
    Normalize user input for matching against canonical alias groups.

    This does NOT modify database values.
    """
    return topic.strip().lower()


def get_topic_variants(topic: str) -> list[str]:
    """
    Return all known database variants for a topic.

    Examples:
        "graphs" -> ["graph", "Graph", "graphs", "Graphs", ...]
        "graph"  -> same group as "graphs"
        "DP"     -> all dynamic programming variants

    If no alias group is known, return the user's normalized input.
    """
    normalized = normalize_input(topic)

    for canonical, variants in TOPIC_ALIASES.items():

        # Check canonical topic.
        if normalized == canonical.lower():
            return variants

        # Check every known variant case-insensitively.
        for variant in variants:
            if normalized == variant.lower():
                return variants

    return [normalized]


def search_by_topic(topic: str) -> list[dict]:
    """
    Search structured_reports for reports containing the requested topic.

    The search:

    1. Finds all known variants of the requested topic.
    2. Uses JSONB containment (@>) for each variant.
    3. Combines matching reports.
    4. Removes duplicate raw_report_ids.

    The query remains compatible with the GIN index on rounds.

    Returns:
        [
            {
                "raw_report_id": ...,
                "company": ...,
                "role": ...,
                "outcome": ...
            },
            ...
        ]
    """

    if not isinstance(topic, str) or not topic.strip():
        raise ValueError("Topic must be a non-empty string.")

    variants = get_topic_variants(topic)

    query = """
        SELECT
            raw_report_id,
            company,
            role,
            outcome
        FROM structured_reports
        WHERE rounds @> %s::jsonb
        ORDER BY raw_report_id;
    """

    # Dictionary removes duplicate reports when multiple topic variants
    # match the same report.
    unique_results = {}

    conn = get_connection()

    try:
        with conn.cursor() as cur:

            for variant in variants:

                # Safely generate the JSONB containment value.
                containment_value = json.dumps(
                    [{"topics": [variant]}]
                )

                cur.execute(query, (containment_value,))
                rows = cur.fetchall()

                for row in rows:
                    raw_report_id = row[0]

                    unique_results[raw_report_id] = {
                        "raw_report_id": raw_report_id,
                        "company": row[1],
                        "role": row[2],
                        "outcome": row[3],
                    }

    finally:
        conn.close()

    return [
        unique_results[report_id]
        for report_id in sorted(unique_results)
    ]


def topic_report_ids(topic: str) -> list[int]:
    """
    Convenience wrapper that returns only matching report IDs.

    Example:
        topic_report_ids("graphs")
        -> [5, 19, 24]
    """
    return [
        row["raw_report_id"]
        for row in search_by_topic(topic)
    ]


def main():
    """
    Test common topic variations.

    Equivalent searches should return the same or logically equivalent
    report IDs where variants exist in the extracted data.
    """

    test_topics = [
        "graphs",
        "graph",
        "Graphs",
        "DP",
        "dynamic programming",
        "Dynamic Programming",
        "algorithms",
        "algorithm",
        "data structures",
        "data structure",
        "DSA",
        "arrays",
        "array",
        "trees",
        "tree",
    ]

    print("=== TOPIC SEARCH TESTS ===")

    for topic in test_topics:

        variants = get_topic_variants(topic)
        results = search_by_topic(topic)

        print("\n" + "=" * 70)
        print(f"Search topic : '{topic}'")
        print(f"Variants used: {variants}")
        print(f"Matches      : {len(results)}")

        if results:
            for result in results:
                print(
                    f"  id={result['raw_report_id']:<4} "
                    f"company={str(result['company']):<20} "
                    f"role={str(result['role']):<35} "
                    f"outcome={result['outcome']}"
                )
        else:
            print("  (no matches)")


if __name__ == "__main__":
    main()