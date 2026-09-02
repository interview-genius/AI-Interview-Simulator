"""
The one real FastAPI() instance for the whole project.

resume_intelligence/api.py and interview_engine/api.py are both
APIRouters, not their own apps -- one process, one port, one CORS config,
since the frontend (Step 8+) needs both resume upload and interview
endpoints from the same origin.

Run with: uvicorn app:app --reload --port 8000
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from resume_intelligence.api import router as resume_router
from interview_engine.api import router as interview_router

app = FastAPI(title="Interview Simulator")

# Wide open for hackathon-scope local dev (Vite on 5173) -- tighten to a
# real allowed-origins list before any non-local deployment.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(resume_router, prefix="/api")
app.include_router(interview_router, prefix="/api")
