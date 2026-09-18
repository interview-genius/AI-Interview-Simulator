"""
Step 10 -- Person A: Natural Phase Exhaustion & Dynamic Contextual Test.

Demonstrates:
1. Natural phase progression from Phase 0 to Phase 4 (last phase).
2. Natural Phase Exhaustion triggering automatically on Turn 8 when Phase 4 is completed.
3. High scoring and comprehensive feedback when answers are evaluated.
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
from interview_modes.technical_discussion import SESSIONS as TECH_SESSIONS

client = TestClient(app)


def test_natural_phase_exhaustion():
    print("=" * 80)
    print("TEST: NATURAL PHASE EXHAUSTION (START -> ALL 5 PHASES -> NATURAL COMPLETION)")
    print("=" * 80)

    # 1. Start technical session
    start_res = client.post("/api/interview/technical/start", json={
        "company": "Google",
        "role": "Senior Software Engineer",
        "level": "Senior"
    })
    assert start_res.status_code == 200
    session_id = start_res.json()["session_id"]
    session = TECH_SESSIONS[session_id]

    print(f"Session ID: {session_id}")
    print(f"Total Active Phases: {len(session.active_phases)} -> {session.active_phases}")
    print(f"Initial Phase: {session.active_phases[session.phase_index]} (phase_index={session.phase_index})")
    print(f"Interviewer: {start_res.json()['opening_question']}\n")

    phase_answers = [
        # Turn 1 (Phase 0: Core CS Concepts)
        (
            "For core CS data structures, comparing hash tables and balanced BSTs: hash tables provide O(1) average "
            "lookup, insert, and delete using array indexing and hash functions, with linear probing or chaining for collisions. "
            "In contrast, balanced BSTs (like Red-Black or AVL trees) provide guaranteed O(log N) worst-case time complexity, "
            "maintain sorted key ordering for efficient range queries and predecessor/successor traversal, but require tree rebalancing overhead."
        ),
        # Turn 2 (Phase 1: DBMS & Storage)
        (
            "In database storage engines, B+ Trees store keys and values/pointers only at leaf nodes, which are linked for fast sequential range scans, "
            "while internal nodes store routing keys to maximize fanout. LSM trees optimize for high-throughput writes by appending to an in-memory "
            "MemTable and WAL, then flushing immutable SSTables to disk in levels, using background compaction to merge files and control read amplification."
        ),
        # Turn 3 (Phase 1: DBMS & Storage follow-up)
        (
            "Leveled compaction keeps SSTables in separate levels with fixed size multipliers (e.g. 10x), guaranteeing at most one SSTable per key range "
            "in each level except L0, which minimizes read amplification. Tiered/size-tiered compaction merges SSTables of similar sizes into a larger file, "
            "which lowers write amplification at the cost of higher temporary disk space and higher read amplification."
        ),
        # Turn 4 (Phase 2: OS & Concurrency)
        (
            "In operating systems, a race condition occurs when concurrent threads access shared mutable state without synchronization. "
            "A critical section can be protected using mutexes for mutual exclusion or semaphores for resource counting. "
            "To prevent deadlocks, we enforce a strict lock acquisition ordering across the codebase and use try-lock with exponential backoff."
        ),
        # Turn 5 (Phase 3: Networks & Protocols)
        (
            "Comparing TCP and UDP: TCP provides reliable, ordered, byte-stream communication via a 3-way handshake (SYN, SYN-ACK, ACK), "
            "sequence numbers, sliding-window flow control, and congestion avoidance algorithms (like BBR or Cubic). "
            "UDP is connectionless and lightweight without retransmissions, making it ideal for real-time video, DNS queries, and gaming."
        ),
        # Turn 6 (Phase 4: OOP & System Design)
        (
            "For system design and modular OOP architecture, we apply SOLID principles to ensure loose coupling and high cohesion. "
            "We design for horizontal scalability by decoupling compute services behind load balancers, using event-driven messaging (Kafka) "
            "for asynchronous processing, implementing distributed caching (Redis) for read scaling, and partitioning databases via consistent hashing."
        ),
        # Turn 7 (Phase 4: OOP & System Design follow-up)
        (
            "To apply Dependency Inversion to our caching layer, we define a generic CacheService interface with get(), set(), and invalidate() methods. "
            "Our business logic depends solely on CacheService, not Redis. We implement RedisCacheService as the production adapter and MemoryCacheService "
            "for unit testing, injecting the appropriate implementation via dependency injection (Guice or Spring)."
        ),
        # Turn 8 (Phase 4: Final Phase wrap-up -> TRIGGERS NATURAL PHASE EXHAUSTION)
        (
            "To wrap up our architecture, we deploy across multi-region active-active clusters with geo-DNS routing, automated health checks, "
            "circuit breakers (Resilience4j), and asynchronous cross-region database replication to guarantee 99.99% availability."
        ),
    ]

    last_turn_data = None
    for i, ans in enumerate(phase_answers, 1):
        phase_name = session.active_phases[min(session.phase_index, len(session.active_phases) - 1)]
        print(f"--- [TURN {i}] Phase: {phase_name} (phase_index={session.phase_index}/{len(session.active_phases) - 1}) ---")
        turn_res = client.post("/api/interview/technical/turn", json={
            "session_id": session_id,
            "candidate_answer": ans,
            "end_interview": False  # MUST END NATURALLY WITHOUT EXPLICIT END FLAG!
        })
        assert turn_res.status_code == 200
        last_turn_data = turn_res.json()
        print(f"Result -> advance_phase: {last_turn_data.get('advance_phase')} | is_completed: {last_turn_data.get('is_completed')} | current phase_index: {session.phase_index}")
        print(f"Interviewer: {last_turn_data.get('interviewer_response')}\n")

        if last_turn_data.get("is_completed"):
            print("=" * 80)
            print(f">>> SUCCESS: Interview completed via NATURAL PHASE EXHAUSTION at Turn {i}! <<<")
            print(f">>> Final phase_index: {session.phase_index}/{len(session.active_phases) - 1} | Total Turns: {len(session.history)} messages <<<")
            print("=" * 80 + "\n")
            break

    print("=" * 80)
    print("COMPREHENSIVE FEEDBACK GENERATED FOR STRONG NATURAL RUN:")
    print("=" * 80)
    feedback = last_turn_data.get("feedback")
    print(json.dumps(feedback, indent=2))


if __name__ == "__main__":
    test_natural_phase_exhaustion()
