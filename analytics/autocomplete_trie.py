"""
Step 4 -- Person B, optional: Trie for company/role autocomplete.

WHY A TRIE, CONCRETELY:
Step 8's config screen needs "type 3 letters, see matching companies" --
a trie answers "give me everything starting with this prefix" in O(k) time
(k = length of the typed prefix), regardless of how many companies exist in
the dataset. A naive `WHERE company ILIKE 'goo%'` query works fine at 51
rows, but doesn't scale as cleanly once there are thousands of distinct
company/role strings and this is being called on every keystroke in a
search box -- a trie is the standard data structure for exactly this
UI pattern.

This is marked optional in the spec -- included because it's small and the
spec explicitly calls it out, not because current data volume needs it yet.
"""

import os

import psycopg2
from dotenv import load_dotenv

load_dotenv()

DB_URL = os.getenv("SUPABASE_DB_URL") or os.getenv("DATABASE_URL")


class TrieNode:
    __slots__ = ("children", "is_end")

    def __init__(self):
        self.children: dict[str, "TrieNode"] = {}
        self.is_end = False


class Trie:
    def __init__(self):
        self.root = TrieNode()

    def insert(self, word: str):
        if not word:
            return
        node = self.root
        for ch in word.lower():
            node = node.children.setdefault(ch, TrieNode())
        node.is_end = True

    def _collect(self, node: TrieNode, prefix: str, results: list[str]):
        if node.is_end:
            results.append(prefix)
        for ch, child in node.children.items():
            self._collect(child, prefix + ch, results)

    def autocomplete(self, prefix: str, limit: int = 10) -> list[str]:
        node = self.root
        for ch in prefix.lower():
            if ch not in node.children:
                return []  # no words with this prefix at all
            node = node.children[ch]

        results: list[str] = []
        self._collect(node, prefix.lower(), results)
        return sorted(results)[:limit]


def build_tries_from_db() -> tuple[Trie, Trie]:
    """Populates two separate tries -- companies and roles are different
    namespaces (you wouldn't want typing 'SD' to suggest a company)."""
    company_trie, role_trie = Trie(), Trie()

    with psycopg2.connect(DB_URL) as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT DISTINCT company FROM structured_reports WHERE company IS NOT NULL")
            for (company,) in cur.fetchall():
                company_trie.insert(company)

            cur.execute("SELECT DISTINCT role FROM structured_reports WHERE role IS NOT NULL")
            for (role,) in cur.fetchall():
                role_trie.insert(role)

    return company_trie, role_trie


def main():
    company_trie, role_trie = build_tries_from_db()

    test_prefixes = ["go", "goo", "am", "mi", "an"]
    print("=== Company autocomplete ===")
    for p in test_prefixes:
        print(f"  '{p}' -> {company_trie.autocomplete(p)}")

    print("\n=== Role autocomplete ===")
    for p in ["sd", "sw", "so"]:
        print(f"  '{p}' -> {role_trie.autocomplete(p)}")


if __name__ == "__main__":
    main()
