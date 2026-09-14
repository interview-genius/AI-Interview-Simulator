# FlowState — AI Mock Interview Simulator

> **Realistic, adaptive, and immersive mock interviews that simulate how a specific company's interviewer actually behaves — tone, pacing, coding follow-ups, and bar-raiser standards, not just generic flashcards.**

---

## Overview

**FlowState** is an end-to-end technical and behavioral interview preparation platform designed to help candidates practice under authentic interview conditions. FlowState combines real-time voice conversations, multi-language code editing, adaptive interviewer AI, and holistic multi-dimensional performance evaluations with an organic growth tracking system.

---

## Key Features

### 1. Multi-Modal Interview Rounds
- **Technical Coding Round**: Full-screen coding environment with a multi-language editor (**Python, JavaScript, TypeScript, Java, C++, Go**), live syntax templates, automatic code caching, problem statements, and real-time interviewer commentary.
- **ML System Design Round**: High-level architectural discussion simulating machine learning design loops (data pipelines, modeling trade-offs, deployment, and scaling).
- **Technical Conceptual Discussion**: Deep dives into Core CS fundamentals (**DBMS, Operating Systems, Networks, Concurrency, OOP & System Architecture**) grounded in real company interview reports via RAG retrieval.
- **HR & Behavioral Round**: Probing behavioral questions evaluating the **STAR method** (Situation, Task, Action, Result), leadership, conflict resolution, and authentic ownership.

### 2. Conversational Voice & Audio Interaction
- **Speech-to-Text (STT) & Text-to-Speech (TTS)**: Realistic conversational audio interaction with automatic silence detection and natural conversational turn-taking.
- **Hardware Lifecycle Management**: Automatic release and cleanup of microphone and camera streams when an interview ends or when unmounting views.

### 3. Holistic Multi-Dimensional Feedback Engine
- Multi-dimensional rubric tailored specifically to each interview mode:
  - **Coding**: Technical Ability, Problem Solving, Optimisation, Debugging, Communication, Clarity.
  - **Technical Discussion**: Technical Ability, Communication, Problem Solving, Confidence, Depth, Clarity.
  - **HR / Behavioral**: Communication, Confidence, Resume Discussion, Behavioural Ownership, STAR Structure, Clarity.
  - **ML Round**: Technical Ability, Problem Solving, Resume Discussion, Communication, Depth, Clarity.
- **Actionable Turn-Specific Advice**: Delivers personalized tips grounded in candidate transcript responses alongside hiring recommendations (*Strong hire, Lean hire, Lean no hire, No hire*).

### 4. Organic Growth Tracking (FlowState Garden)
- **Visual Growth Engine**: Candidate trees grow and evolve based on cumulative practice and performance (**Seed $\rightarrow$ Little Sapling $\rightarrow$ Bigger Sapling $\rightarrow$ Plant $\rightarrow$ Blooming Plant $\rightarrow$ Fruit-Bearing Tree**).
- **Dashboard & Trends**: Average dimension breakdowns, top strengths, priority improvement areas, and a chronological history of past mock runs.

### 5. Authentication & Profile Management
- **Seamless Dual-Engine Auth**: Works with Supabase Authentication (OAuth & Email) with automatic, resilient fallback to FastAPI + PostgreSQL (`users` and `profiles` tables).
- **Account Dropdown**: Profile pill in the top navigation displaying candidate info, quick session links, and a direct logout action.

---

## Tech Stack

| Layer | Technologies |
| --- | --- |
| **Frontend** | React 19, TypeScript, Vite, React Router 7, Monaco Editor, Canvas Confetti |
| **Backend** | FastAPI, Python 3.12, Uvicorn, Pydantic, Psycopg2 |
| **Database** | PostgreSQL (Supabase Postgres) with JSONB Transcripts & Results |
| **LLM & AI Providers** | OpenRouter (Nemotron, Llama 3), Groq (Llama 3 70B), Gemini API |
| **Styling** | FlowState Dark Organic Design System (`#12150E`, `#1A1D16`, Sage `#6C7A63`, Terracotta `#B28B6A`) |

---

## Project Structure

```text
├── app.py                          # Unified FastAPI application instance (Port 8000)
├── auth/                           # Authentication & candidate profile layer
│   ├── api.py                      # /api/signup, /api/login, /api/interview-history
│   ├── auth_utils.py               # PBKDF2 password hashing & JWT handling
│   ├── profile.py                  # User profiles & interview history queries
│   └── create_users_table.sql      # Schema definitions
├── analytics/                      # Dashboard & analytics endpoints
│   └── dashboard_api.py            # /api/dashboard/stats, /api/dashboard/trends
├── interview_engine/               # Core interview mechanics & evaluation
│   ├── api.py                      # /api/interview session & feedback endpoints
│   ├── dynamic_feedback.py         # Multi-dimensional LLM feedback scoring
│   ├── coding.py                   # Coding round state & problem loader
│   ├── conversation.py             # ML round dialogue state machine
│   └── adaptive_engine.py          # Adaptive follow-up decision logic
├── interview_modes/                # Round routers (Technical, HR, Config)
├── resume_intelligence/            # Resume parsing, skill extraction & RAG
├── frontend/                       # React 19 + TypeScript SPA
│   ├── src/
│   │   ├── api/                    # API client, Supabase config, dashboard & feedback callers
│   │   ├── components/
│   │   │   ├── coding/             # CodeEditor, CodingRoundPage, ProblemStatementPanel
│   │   │   ├── ml/                 # MLRoundPage
│   │   │   ├── dashboard/          # DashboardPage, FeedbackPage, InterviewHistoryPage, TreeVisualization
│   │   │   ├── setup/              # AuthPage, SetupPage, PrepScreen, LandingPage
│   │   │   ├── shared/             # SharedNavbar, Logo
│   │   │   └── voice/              # VoiceConversationPanel, MicButton, StateIndicator
│   │   ├── hooks/                  # useVoiceConversation, useSpeechRecognition, useSpeechSynthesis
│   │   └── router.tsx              # App routes definition
│   └── package.json
└── .env.example                    # Environment variable documentation
```

---

## Getting Started

### Prerequisites
- **Node.js** (v18 or higher) & **npm**
- **Python** (v3.10 or higher) & **pip**
- A **PostgreSQL** database (e.g., Supabase Postgres instance)

---

### 1. Clone & Configure Environment

```bash
git clone https://github.com/interview-genius/AI-Interview-Simulator.git
cd AI-Interview-Simulator
```

Copy `.env.example` to `.env` in the root directory:

```bash
cp .env.example .env
```

Configure your `.env` variables:
```env
DATABASE_URL=postgresql://postgres.<ref>:<password>@<host>:5432/postgres
VITE_SUPABASE_URL=https://<your-project>.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-key>

# LLM Providers (at least one key required)
GROQ_API_KEY=gsk_...
OPENROUTER_API_KEY=sk-or-v1-...
GEMINI_API_KEY=...
```

---

### 2. Backend Setup

Install Python dependencies:
```bash
pip install -r requirements.txt
```

Start the FastAPI backend server:
```bash
uvicorn app:app --reload --port 8000
```
*The API documentation is accessible at `http://localhost:8000/docs`.*

---

### 3. Frontend Setup

In a new terminal, navigate to the `frontend` directory:
```bash
cd frontend
npm install
npm run dev
```
*The web application will open at `http://localhost:5173`.*

---

## Core API Endpoints

| Method | Endpoint | Description |
| --- | --- | --- |
| `POST` | `/api/signup` | Register user account & initialize candidate profile |
| `POST` | `/api/login` | Authenticate user credentials & receive session token |
| `GET` | `/api/profile` | Retrieve candidate profile and experience level |
| `POST` | `/api/interview/coding/start` | Initialize a new coding interview round with starter code |
| `POST` | `/api/interview/coding/turn` | Submit code and voice dialogue for interviewer feedback |
| `POST` | `/api/interview/ml/start` | Start an ML System Design interview session |
| `POST` | `/api/interview/ml/turn` | Advance ML system design round |
| `POST` | `/api/interview/technical/start` | Start Technical Discussion round (Core CS concepts) |
| `POST` | `/api/interview/hr/start` | Start HR & Behavioral interview round |
| `POST` | `/api/interview/feedback` | Generate dynamic scored evaluation and actionable tips |
| `GET` | `/api/interview-history` | Fetch past interview transcripts and feedback results |
| `POST` | `/api/interview-history` | Persist completed interview session to database |
| `GET` | `/api/dashboard/stats` | Get candidate interview counts, dimension averages, and strengths |
| `GET` | `/api/dashboard/trends` | Get chronological score progression for charts and history |

---

## License

This project is licensed under the MIT License.
