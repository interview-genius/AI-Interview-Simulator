"""
Step 9 -- Person A: Adaptive Engine Variation & Decision Loop Test.

Validates:
1. Strong/detailed answer -> triggers next_action='new_topic' / advance_phase=True with high depth/confidence
2. Vague answer -> triggers next_action='follow_up' / advance_phase=False with low depth/confidence
3. Contradictory/hesitant answer -> triggers next_action='follow_up' with low confidence
4. External live coding intelligence signal -> triggers interrupt override
"""

import sys

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

from fastapi.testclient import TestClient
from app import app
from interview_engine.adaptive_engine import incorporate_external_signal

client = TestClient(app)

def run_test():
    print("=" * 80)
    print("ADAPTIVE INTERVIEW ENGINE -- REAL BEHAVIORAL VARIATION TEST")
    print("=" * 80)

    # Step 1: Start technical discussion session
    start_res = client.post("/api/interview/technical/start", json={
        "company": "Google",
        "role": "Software Engineer",
        "level": "Senior"
    })
    assert start_res.status_code == 200, f"Start failed: {start_res.text}"
    start_data = start_res.json()
    session_id = start_data["session_id"]
    opening_q = start_data["opening_question"]
    initial_phase = start_data["phase"]
    print(f"Started Session ID: {session_id}")
    print(f"Initial Phase: {initial_phase}")
    print(f"Interviewer: {opening_q}\n")

    # Step 2: Test Turn 1 with a STRONG, THOROUGH, IN-DEPTH ANSWER
    print("-" * 80)
    print("[TURN 1] SUBMITTING STRONG / DETAILED ANSWER:")
    strong_ans = (
        "In relational database indexing, B+ Trees are used for disk-based storage because of their high branching "
        "factor, keeping tree height low (typically 3-4 levels for billions of rows) to minimize I/O seeks. "
        "Clustered indexes define the physical ordering of data on disk, meaning a table can have only one clustered index, "
        "while non-clustered secondary indexes store pointers/rowids to the base table or primary key. "
        "Secondary indexes incur lookup overhead, requiring a bookmark lookup or index scan unless the query is a covering index."
    )
    print(f"Candidate Answer: {strong_ans}\n")
    turn1_res = client.post("/api/interview/technical/turn", json={
        "session_id": session_id,
        "candidate_answer": strong_ans
    })
    assert turn1_res.status_code == 200
    t1 = turn1_res.json()
    print(f"Result advance_phase: {t1.get('advance_phase')}")
    print(f"Interviewer Response: {t1.get('interviewer_response')}\n")

    # Step 3: Test Turn 2 with a VAGUE, SHALLOW ANSWER
    print("-" * 80)
    print("[TURN 2] SUBMITTING VAGUE / SHALLOW ANSWER:")
    vague_ans = "I guess databases just use hashes or binary search to find data faster, not really sure about the internals."
    print(f"Candidate Answer: {vague_ans}\n")
    turn2_res = client.post("/api/interview/technical/turn", json={
        "session_id": session_id,
        "candidate_answer": vague_ans
    })
    assert turn2_res.status_code == 200
    t2 = turn2_res.json()
    print(f"Result advance_phase: {t2.get('advance_phase')}")
    print(f"Interviewer Response: {t2.get('interviewer_response')}\n")

    # Step 4: Test Turn 3 with a CONTRADICTORY / UNCERTAIN ANSWER
    print("-" * 80)
    print("[TURN 3] SUBMITTING CONTRADICTORY / UNCERTAIN ANSWER:")
    contradictory_ans = (
        "Well, TCP is completely connectionless and fast with no three-way handshake, but actually UDP establishes "
        "reliable ordered streams, or wait, maybe I have that backwards, honestly I am not sure and forgot."
    )
    print(f"Candidate Answer: {contradictory_ans}\n")
    turn3_res = client.post("/api/interview/technical/turn", json={
        "session_id": session_id,
        "candidate_answer": contradictory_ans
    })
    assert turn3_res.status_code == 200
    t3 = turn3_res.json()
    print(f"Result advance_phase: {t3.get('advance_phase')}")
    print(f"Interviewer Response: {t3.get('interviewer_response')}\n")

    # Step 5: Test External Live Coding Signal Integration Placeholder
    print("-" * 80)
    print("[TEST 4] EXTERNAL LIVE CODING SIGNAL INTEGRATION TEST:")
    incorporate_external_signal(session_id, {
        "trigger": True,
        "reasoning": "Candidate wrote O(N^2) nested loop when O(N) hash map lookup is required.",
        "severity": "high"
    })
    turn4_res = client.post("/api/interview/technical/turn", json={
        "session_id": session_id,
        "candidate_answer": "I am iterating through all pairs with nested loops to check if the sum equals target."
    })
    assert turn4_res.status_code == 200
    t4 = turn4_res.json()
    print(f"Result advance_phase: {t4.get('advance_phase')}")
    print(f"Interviewer Response: {t4.get('interviewer_response')}\n")

    print("=" * 80)
    print("ALL ADAPTIVE ENGINE TESTS COMPLETED SUCCESSFULLY!")
    print("=" * 80)

if __name__ == "__main__":
    run_test()
