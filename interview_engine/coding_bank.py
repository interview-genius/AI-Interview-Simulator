"""
Step 8 -- Person B: static coding-problem bank for the Coding Round shell.

Static list, not LLM-generated -- Step 8 is explicitly a shell (Monaco +
problem statement + a voice interviewer that can't see the code yet).
Dynamic problem generation is out of scope here; this just needs enough
real variety to demo the shell convincingly. One language (Python) only.
"""

import random

PROBLEMS = [
    {
        "id": "two-sum",
        "title": "Two Sum",
        "difficulty": "Easy",
        "statement": "Given an array of integers `nums` and an integer `target`, return "
                     "the indices of the two numbers that add up to `target`. Assume "
                     "exactly one solution exists, and you may not use the same element twice.",
        "starter_code": "def two_sum(nums, target):\n    pass\n",
        "language": "python",
    },
    {
        "id": "valid-parentheses",
        "title": "Valid Parentheses",
        "difficulty": "Easy",
        "statement": "Given a string containing only the characters '(', ')', '{', '}', "
                     "'[' and ']', determine if the input string is valid -- brackets must "
                     "close in the correct order.",
        "starter_code": "def is_valid(s):\n    pass\n",
        "language": "python",
    },
    {
        "id": "reverse-linked-list",
        "title": "Reverse Linked List",
        "difficulty": "Easy",
        "statement": "Given the head of a singly linked list, reverse the list and return "
                     "the new head.",
        "starter_code": "class ListNode:\n    def __init__(self, val=0, next=None):\n        self.val = val\n        self.next = next\n\ndef reverse_list(head):\n    pass\n",
        "language": "python",
    },
    {
        "id": "longest-substring-no-repeat",
        "title": "Longest Substring Without Repeating Characters",
        "difficulty": "Medium",
        "statement": "Given a string `s`, find the length of the longest substring "
                     "without repeating characters.",
        "starter_code": "def length_of_longest_substring(s):\n    pass\n",
        "language": "python",
    },
    {
        "id": "number-of-islands",
        "title": "Number of Islands",
        "difficulty": "Medium",
        "statement": "Given an `m x n` 2D binary grid representing '1' (land) and '0' "
                     "(water), return the number of islands. An island is surrounded by "
                     "water and formed by connecting adjacent lands horizontally or vertically.",
        "starter_code": "def num_islands(grid):\n    pass\n",
        "language": "python",
    },
    {
        "id": "course-schedule",
        "title": "Course Schedule",
        "difficulty": "Medium",
        "statement": "There are `numCourses` courses labeled 0 to numCourses-1. Given a "
                     "list of prerequisite pairs, determine if it's possible to finish all "
                     "courses (i.e., the prerequisite graph has no cycle).",
        "starter_code": "def can_finish(num_courses, prerequisites):\n    pass\n",
        "language": "python",
    },
    {
        "id": "word-break",
        "title": "Word Break",
        "difficulty": "Medium",
        "statement": "Given a string `s` and a dictionary of strings `word_dict`, return "
                     "True if `s` can be segmented into a space-separated sequence of one "
                     "or more dictionary words.",
        "starter_code": "def word_break(s, word_dict):\n    pass\n",
        "language": "python",
    },
    {
        "id": "merge-k-sorted-lists",
        "title": "Merge k Sorted Lists",
        "difficulty": "Hard",
        "statement": "You are given an array of `k` linked-lists, each sorted in "
                     "ascending order. Merge all the linked-lists into one sorted linked-list.",
        "starter_code": "class ListNode:\n    def __init__(self, val=0, next=None):\n        self.val = val\n        self.next = next\n\ndef merge_k_lists(lists):\n    pass\n",
        "language": "python",
    },
    {
        "id": "trapping-rain-water",
        "title": "Trapping Rain Water",
        "difficulty": "Hard",
        "statement": "Given `n` non-negative integers representing an elevation map "
                     "where the width of each bar is 1, compute how much water it can trap "
                     "after raining.",
        "starter_code": "def trap(height):\n    pass\n",
        "language": "python",
    },
]

DIFFICULTY_BY_LEVEL_KEYWORD = {
    "intern": "Easy",
    "new grad": "Easy",
    "junior": "Medium",
    "mid": "Medium",
    "senior": "Hard",
    "staff": "Hard",
}


def pick_problem(level: str | None = None, role: str | None = None) -> dict:
    target_difficulty = None
    if level:
        level_lower = level.lower()
        for keyword, difficulty in DIFFICULTY_BY_LEVEL_KEYWORD.items():
            if keyword in level_lower:
                target_difficulty = difficulty
                break

    candidates = [p for p in PROBLEMS if p["difficulty"] == target_difficulty] if target_difficulty else PROBLEMS
    if not candidates:
        candidates = PROBLEMS
    return random.choice(candidates)
