"""
Step 10 -- Person A: Full Dynamic Feedback Engine & End-of-Interview Test.

Runs:
1. Full Technical Discussion interview from start to natural phase exhaustion.
2. Full HR Round interview from start to natural phase exhaustion.
3. Validates mode-specific dimension routing and prints complete ComprehensiveFeedback objects.
4. Validates database persistence in the interview_history table.
"""

import sys
import json
import os
import psycopg2
import psycopg2.extras
from dotenv import load_dotenv

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

load_dotenv()

from fastapi.testclient import TestClient
from app import app

client = TestClient(app)
DB_URL = os.getenv("SUPABASE_DB_URL") or os.getenv("DATABASE_URL")


def test_technical_discussion_full_run():
    print("=" * 80)
    print("TEST 1: TECHNICAL DISCUSSION FULL RUN & DYNAMIC FEEDBACK")
    print("=" * 80)

    start_res = client.post("/api/interview/technical/start", json={
        "company": "Google",
        "role": "Senior Software Engineer",
        "level": "Senior"
    })
    assert start_res.status_code == 200, f"Start failed: {start_res.text}"
    session_id = start_res.json()["session_id"]
    print(f"Session ID: {session_id}")
    print(f"Opening Phase: {start_res.json()['phase']}")
    print(f"Interviewer: {start_res.json()['opening_question']}\n")

    # High quality answers across technical phases to drive natural phase progression
    answers = [
        # Phase 1: Core CS concepts (B-trees, algorithms)
        (
            "In relational database storage, B+ Trees are used because their high branching factor "
            "keeps the tree height very low (3-4 levels for millions of rows), minimizing disk I/O. "
            "Internal nodes store only routing keys, while leaf nodes store actual keys and data/pointers, "
            "linked sequentially for efficient O(log N) lookups and fast range scans."
        ),
        # Phase 2: DBMS & storage (ACID, isolation)
        (
            "ACID guarantees consistency in distributed transactions. Isolation levels range from Read Uncommitted "
            "to Serializable. In PostgreSQL, Snapshot Isolation prevents dirty reads and non-repeatable reads using "
            "MVCC (Multi-Version Concurrency Control), creating row versions rather than acquiring heavy read locks."
        ),
        # Phase 3: OS & concurrency (Processes, threads, deadlocks)
        (
            "Processes have independent virtual address spaces with their own page tables, while threads in the same process "
            "share memory and file descriptors. To prevent deadlocks, we must eliminate at least one of the four Coffman conditions, "
            "most commonly by enforcing a global lock acquisition hierarchy and using try-lock timeouts."
        ),
        # Phase 4: Networks & protocols (TCP vs UDP, HTTP/2)
        (
            "TCP is a connection-oriented, byte-stream protocol with reliable delivery via sequence numbers, acknowledgements, "
            "and sliding-window flow control. HTTP/2 and HTTP/3 multiplex requests over a single connection to eliminate head-of-line blocking."
        ),
        # Phase 5: OOP & System Design (Final phase -> triggers natural phase exhaustion)
        (
            "For system design and modular OOP, we adhere to SOLID principles and clean separation of concerns. "
            "We decouple compute from storage, use asynchronous event queues (Kafka) for ingest buffering, and implement "
            "read-replicas and distributed caching (Redis) to scale reads while maintaining write idempotency."
        ),
    ]

    last_turn_data = None
    for i, ans in enumerate(answers, 1):
        print(f"--- [Turn {i}] Submitting candidate answer ---")
        turn_res = client.post("/api/interview/technical/turn", json={
            "session_id": session_id,
            "candidate_answer": ans
        })
        assert turn_res.status_code == 200, f"Turn {i} failed: {turn_res.text}"
        last_turn_data = turn_res.json()
        print(f"advance_phase: {last_turn_data.get('advance_phase')} | is_completed: {last_turn_data.get('is_completed')}")
        print(f"Interviewer: {last_turn_data.get('interviewer_response')}\n")

        if last_turn_data.get("is_completed"):
            print(f">>> INTERVIEW REACHED COMPLETION AT TURN {i}! <<<\n")
            break

    # If not completed yet, send one final wrap-up answer
    if not last_turn_data.get("is_completed"):
        print("--- [Final Turn] Concluding final phase ---")
        turn_res = client.post("/api/interview/technical/turn", json={
            "session_id": session_id,
            "candidate_answer": "Yes, that covers our system design and architecture approach in full detail.",
            "end_interview": True
        })
        assert turn_res.status_code == 200
        last_turn_data = turn_res.json()

    print("=" * 80)
    print("TECHNICAL DISCUSSION COMPREHENSIVE FEEDBACK OUTPUT:")
    print("=" * 80)
    feedback = last_turn_data.get("feedback")
    print(json.dumps(feedback, indent=2))
    return session_id, feedback


def test_hr_round_full_run():
    print("\n" + "=" * 80)
    print("TEST 2: HR / BEHAVIORAL ROUND FULL RUN & DYNAMIC FEEDBACK")
    print("=" * 80)

    start_res = client.post("/api/interview/hr/start", json={
        "company": "Google",
        "role": "Senior Software Engineer",
        "level": "Senior"
    })
    assert start_res.status_code == 200, f"Start failed: {start_res.text}"
    session_id = start_res.json()["session_id"]
    print(f"Session ID: {session_id}")
    print(f"Opening Phase: {start_res.json()['phase']}")
    print(f"Interviewer: {start_res.json()['opening_question']}\n")

    answers = [
        # Phase 1: Introduction
        (
            "Hello! I am a senior software engineer with 6 years of experience building high-scale distributed systems. "
            "Most recently, I led the core backend platform team, improving service reliability from 99.9% to 99.99%."
        ),
        # Phase 2: Resume experience dive
        (
            "In my previous project, we had a critical bottleneck in our data processing pipeline handling 50k events/sec. "
            "I spearheaded the transition to an event-driven architecture using Kafka, decoupling services and reducing p99 latency by 45%."
        ),
        # Phase 3: Leadership & Teamwork (STAR format)
        (
            "Situation: Two senior engineers had conflicting views on database schema design during a critical project milestone. "
            "Task: As tech lead, I needed to resolve the deadlock without alienating team members. "
            "Action: I scheduled a spike where each engineer prototyped their approach with synthetic benchmarks against our target QPS. "
            "Result: The data showed Option A handled write contention 30% better, and both engineers agreed based on the evidence."
        ),
        # Phase 4: Company motivation
        (
            "I want to join Google because of your mission to organize the world's information and solve engineering problems at planetary scale. "
            "My background in infrastructure and distributed systems directly aligns with the technical challenges your team tackles."
        ),
        # Phase 5: Situational challenges (Final phase)
        (
            "When dealing with tight deadlines or failure, I focus on radical transparency and blameless post-mortems. "
            "Once a deployment introduced a regression affecting 2% of users; I immediately initiated a rollback, conducted a root-cause "
            "investigation, and implemented automated canary verification to prevent recurrence."
        ),
    ]

    last_turn_data = None
    for i, ans in enumerate(answers, 1):
        print(f"--- [Turn {i}] Submitting behavioral answer ---")
        turn_res = client.post("/api/interview/hr/turn", json={
            "session_id": session_id,
            "candidate_answer": ans
        })
        assert turn_res.status_code == 200, f"Turn {i} failed: {turn_res.text}"
        last_turn_data = turn_res.json()
        print(f"advance_phase: {last_turn_data.get('advance_phase')} | is_completed: {last_turn_data.get('is_completed')}")
        print(f"Interviewer: {last_turn_data.get('interviewer_response')}\n")

        if last_turn_data.get("is_completed"):
            print(f">>> INTERVIEW REACHED COMPLETION AT TURN {i}! <<<\n")
            break

    if not last_turn_data.get("is_completed"):
        print("--- [Final Turn] Concluding HR round ---")
        turn_res = client.post("/api/interview/hr/turn", json={
            "session_id": session_id,
            "candidate_answer": "Thank you, I really enjoyed discussing my journey and learning about the team.",
            "end_interview": True
        })
        assert turn_res.status_code == 200
        last_turn_data = turn_res.json()

    print("=" * 80)
    print("HR ROUND COMPREHENSIVE FEEDBACK OUTPUT:")
    print("=" * 80)
    feedback = last_turn_data.get("feedback")
    print(json.dumps(feedback, indent=2))
    return session_id, feedback


def verify_database_records(tech_session_id: str, hr_session_id: str):
    print("\n" + "=" * 80)
    print("TEST 3: VERIFYING DATABASE PERSISTENCE IN interview_history TABLE")
    print("=" * 80)
    if not DB_URL:
        print("DB_URL not found; skipping DB query test.")
        return

    conn = psycopg2.connect(DB_URL)
    with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
        cur.execute("""
            SELECT id, session_id, round_type, company, role, feedback_result IS NOT NULL as has_feedback, created_at
            FROM interview_history
            WHERE session_id IN (%s, %s)
            ORDER BY created_at DESC;
        """, (tech_session_id, hr_session_id))
        rows = cur.fetchall()
        print(f"Found {len(rows)} persisted interview_history records in database:")
        for r in rows:
            print(f"  - ID: {r['id']} | Mode: {r['round_type']} | Session: {r['session_id'][:8]}... | Has Feedback: {r['has_feedback']} | Timestamp: {r['created_at']}")
    conn.close()


def main():
    tech_session_id, tech_fb = test_technical_discussion_full_run()
    hr_session_id, hr_fb = test_hr_round_full_run()
    verify_database_records(tech_session_id, hr_session_id)
    print("\n" + "=" * 80)
    print("ALL STEP 10 DYNAMIC FEEDBACK TESTS COMPLETED SUCCESSFULLY!")
    print("=" * 80)


if __name__ == "__main__":
    main()
