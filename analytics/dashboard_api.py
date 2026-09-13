import os
import json
from fastapi import APIRouter, HTTPException, Query
import psycopg2
import psycopg2.extras
from dotenv import load_dotenv

load_dotenv()

DB_URL = os.getenv("SUPABASE_DB_URL") or os.getenv("DATABASE_URL")

router = APIRouter(prefix="/dashboard", tags=["dashboard"])

def get_db_connection():
    if not DB_URL:
        raise HTTPException(status_code=500, detail="Database URL not configured.")
    return psycopg2.connect(DB_URL, cursor_factory=psycopg2.extras.RealDictCursor)

@router.get("/stats")
def get_dashboard_stats(user_id: int | None = Query(None, description="Optional user ID")):
    try:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                if user_id:
                    cur.execute("SELECT feedback_result FROM interview_history WHERE user_id = %s;", (user_id,))
                else:
                    return {"total_interviews": 0, "dimensions": {}}
                
                rows = cur.fetchall()
                
        if not rows:
            return {"total_interviews": 0, "dimensions": {}}

        dimension_totals = {}
        dimension_counts = {}

        for row in rows:
            feedback = row.get("feedback_result", {})
            if isinstance(feedback, str):
                try:
                    feedback = json.loads(feedback)
                except:
                    continue

            # Iterate over keys looking for DimensionScore shapes
            for key, val in feedback.items():
                if isinstance(val, dict) and "score" in val:
                    score = val["score"]
                    dimension_totals[key] = dimension_totals.get(key, 0) + score
                    dimension_counts[key] = dimension_counts.get(key, 0) + 1

        dimension_averages = {
            k: round(dimension_totals[k] / dimension_counts[k], 1)
            for k in dimension_totals
        }

        # Identify top strength and top weakness
        sorted_dims = sorted(dimension_averages.items(), key=lambda x: x[1], reverse=True)
        top_strength = sorted_dims[0][0] if sorted_dims else "N/A"
        top_weakness = sorted_dims[-1][0] if sorted_dims else "N/A"

        return {
            "total_interviews": len(rows),
            "dimensions": dimension_averages,
            "top_strength": top_strength.replace("_", " ").title(),
            "top_weakness": top_weakness.replace("_", " ").title()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/trends")
def get_dashboard_trends(user_id: int | None = Query(None, description="Optional user ID")):
    try:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                if user_id:
                    cur.execute("SELECT created_at, company, role, round_type, feedback_result FROM interview_history WHERE user_id = %s ORDER BY created_at ASC;", (user_id,))
                else:
                    return {"trends": []}
                
                rows = cur.fetchall()

        trends = []
        for row in rows:
            feedback = row.get("feedback_result", {})
            if isinstance(feedback, str):
                try:
                    feedback = json.loads(feedback)
                except:
                    continue
            
            # Calculate average score for this specific interview
            total = 0
            count = 0
            for key, val in feedback.items():
                if isinstance(val, dict) and "score" in val:
                    total += val["score"]
                    count += 1
            
            avg_score = round(total / count, 1) if count > 0 else 0
            
            trends.append({
                "date": row["created_at"].strftime("%Y-%m-%d"),
                "company": row["company"],
                "role": row["role"],
                "type": row["round_type"],
                "average_score": avg_score
            })

        return {"trends": trends}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
