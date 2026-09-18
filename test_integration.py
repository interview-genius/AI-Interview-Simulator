from fastapi.testclient import TestClient
from app import app
import json

client = TestClient(app)

def test_dashboard():
    print("="*50)
    print("TESTING DASHBOARD API (STEP 10)")
    print("="*50)
    
    print("--> GET /api/dashboard/stats")
    res_stats = client.get("/api/dashboard/stats")
    print("Status:", res_stats.status_code)
    print("Response:", json.dumps(res_stats.json(), indent=2))
    
    print("\n--> GET /api/dashboard/trends")
    res_trends = client.get("/api/dashboard/trends")
    print("Status:", res_trends.status_code)
    
    trends_json = res_trends.json()
    if trends_json.get("trends"):
        print(f"Response: {len(trends_json['trends'])} trends found. Showing first 2:")
        print(json.dumps(trends_json["trends"][:2], indent=2))
    else:
        print("Response:", json.dumps(trends_json, indent=2))

def test_coding_intelligence():
    print("\n" + "="*50)
    print("TESTING LIVE CODING INTELLIGENCE (STEP 9)")
    print("="*50)
    
    print("--> POST /api/interview/coding/start")
    start_res = client.post("/api/interview/coding/start", json={"level": "Mid", "role": "Software Engineer"})
    print("Status:", start_res.status_code)
    
    if start_res.status_code != 200:
        print("Failed to start coding session", start_res.text)
        return

    data = start_res.json()
    session_id = data["session_id"]
    problem = data["problem"]
    starter_code = problem["starter_code"]
    
    print(f"Session started successfully. ID: {session_id[:8]}...")
    print(f"Problem: {problem['title']}")
    
    print("\n--> POST /api/coding/snapshot (No change)")
    snap1 = client.post("/api/coding/snapshot", json={
        "session_id": session_id,
        "current_code": starter_code
    })
    print("Status:", snap1.status_code)
    print("Response:", snap1.json())
    
    # Let's introduce a "significant code block" to trigger the LLM to ask about complexity
    # We'll write out a full naive implementation
    naive_code = starter_code + "\n    for i in range(len(nums)):\n        for j in range(i+1, len(nums)):\n            if nums[i] + nums[j] == target:\n                return [i, j]\n"
    
    print("\n--> POST /api/coding/snapshot (Significant code change added)")
    snap2 = client.post("/api/coding/snapshot", json={
        "session_id": session_id,
        "current_code": naive_code
    })
    print("Status:", snap2.status_code)
    print("Response:", snap2.json())
    
    print("\n--> POST /api/interview/coding/turn (Candidate advances conversation)")
    print("Candidate message: 'I finished writing a basic solution.'")
    turn_res = client.post("/api/interview/coding/turn", json={
        "session_id": session_id,
        "candidate_message": "I finished writing a basic solution.",
        "current_code": naive_code
    })
    
    print("Status:", turn_res.status_code)
    if turn_res.status_code == 200:
        print("Interviewer Response:")
        print(turn_res.json()["interviewer_response"])
    else:
        print("Error:", turn_res.text)

if __name__ == "__main__":
    test_dashboard()
    test_coding_intelligence()
