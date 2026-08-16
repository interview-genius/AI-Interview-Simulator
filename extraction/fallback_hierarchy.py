"""
Step 3 -- fallback hierarchy for sparse data.

THE PROBLEM THIS SOLVES:
When Step 8's config screen asks a user for Company -> Role -> Round, an
exact match often won't exist -- e.g. "Anthropic, ML Engineer, Coding round"
might have zero matching rows even though the DB has SOME Anthropic data,
SOME ML Engineer data, just not that exact combination. Without a fallback,
the user hits a dead end. This module returns the best available match by
progressively relaxing the query, and tells the caller which tier it used so
the UI can be honest about it (e.g. "no exact Anthropic ML data -- showing
similar Anthropic reports instead").

FALLBACK ORDER (per the work-split spec):
  1. Exact match      -- company + role + round type all match
  2. Round-specific    -- drop role, keep company + round type
  3. Role-specific     -- drop company, keep role + round type
  4. Company-generic   -- drop role + round type, keep company only
  5. Global default    -- no filters, return anything

Each tier is tried in order; the first tier that returns any rows wins.
"""

import os
from dataclasses import dataclass

import psycopg2
import psycopg2.extras
from dotenv import load_dotenv

load_dotenv()

DB_URL = os.getenv("SUPABASE_DB_URL") or os.getenv("DATABASE_URL")
if not DB_URL:
    raise ValueError("Neither SUPABASE_DB_URL nor DATABASE_URL found in .env")


TIER_NAMES = {
    1: "exact_match",
    2: "round_specific",
    3: "role_specific",
    4: "company_generic",
    5: "global_default",
}

# One query template per tier -- each uses jsonb_array_elements to check
# whether ANY round in the rounds array has a "type" list containing the
# requested round_type (rounds.type is a JSON array, e.g. ["Coding","DSA"]).
_ROUND_TYPE_MATCH = """
    EXISTS (
        SELECT 1 FROM jsonb_array_elements(sr.rounds) AS round_elem
        WHERE round_elem->'type' ? %(round_type)s
    )
"""

TIER_QUERIES = {
    1: f"""
        SELECT * FROM structured_reports sr
        WHERE company ILIKE %(company)s AND role ILIKE %(role)s AND {_ROUND_TYPE_MATCH}
        LIMIT %(limit)s
    """,
    2: f"""
        SELECT * FROM structured_reports sr
        WHERE company ILIKE %(company)s AND {_ROUND_TYPE_MATCH}
        LIMIT %(limit)s
    """,
    3: f"""
        SELECT * FROM structured_reports sr
        WHERE role ILIKE %(role)s AND {_ROUND_TYPE_MATCH}
        LIMIT %(limit)s
    """,
    4: """
        SELECT * FROM structured_reports sr
        WHERE company ILIKE %(company)s
        LIMIT %(limit)s
    """,
    5: """
        SELECT * FROM structured_reports sr
        ORDER BY RANDOM()
        LIMIT %(limit)s
    """,
}


@dataclass
class FallbackResult:
    tier: int
    tier_name: str
    rows: list
    exact_match: bool  # convenience flag: True only if tier == 1


def get_reports_with_fallback(company: str, role: str, round_type: str, limit: int = 5) -> FallbackResult:
    """Try each tier in order, return the first tier with any results."""
    params_base = {"company": f"%{company}%", "role": f"%{role}%",
                    "round_type": round_type, "limit": limit}

    with psycopg2.connect(DB_URL) as conn:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            for tier in (1, 2, 3, 4, 5):
                cur.execute(TIER_QUERIES[tier], params_base)
                rows = cur.fetchall()
                if rows:
                    return FallbackResult(
                        tier=tier,
                        tier_name=TIER_NAMES[tier],
                        rows=rows,
                        exact_match=(tier == 1),
                    )

    # Should be unreachable if structured_reports has any rows at all --
    # tier 5 has no filters. Only happens on a genuinely empty table.
    return FallbackResult(tier=5, tier_name="global_default", rows=[], exact_match=False)


def main():
    """Quick manual test against a few real and deliberately sparse combos."""
    test_cases = [
        ("Google", "SWE", "Coding"),
        ("Anthropic", "ML Engineer", "Coding"),   # likely sparse -- good fallback test
        ("Nonexistent Startup", "Nobody", "Nothing"),  # forces tier 5
    ]

    for company, role, round_type in test_cases:
        result = get_reports_with_fallback(company, role, round_type)
        print(f"Query: company={company!r} role={role!r} round_type={round_type!r}")
        print(f"  -> tier {result.tier} ({result.tier_name}), {len(result.rows)} rows, "
              f"exact_match={result.exact_match}")
        for r in result.rows[:2]:
            print(f"     id={r['id']} company={r['company']} role={r['role']}")
        print()


if __name__ == "__main__":
    main()
