# Recallix — Your AI Lecture Companion

**Recallix** transforms dense lecture notes and audio transcripts into structured summaries, key concept breakdowns, actionable study tasks, and grounded question-and-answer dialogues.

---

## 🚀 Tech Stack

- **Frontend**: [Next.js](https://nextjs.org/) (App Router, Turbopack), [TypeScript](https://www.typescriptlang.org/), [Tailwind CSS v4](https://tailwindcss.com/)
- **Backend**: [Python](https://www.python.org/) 3.14+, [FastAPI](https://fastapi.tiangolo.com/), [Pydantic v2](https://docs.pydantic.dev/)
- **Database**: SQLite (built-in persistent relational storage)
- **AI Engine (Upcoming)**: Gemma via [Ollama](https://ollama.ai/)
- **Icons & UI**: [Lucide React](https://lucide.dev/), responsive dark glassmorphism

---

## 📁 Project Structure

```text
Recallix/
├── .gitignore                      # Monorepo ignore rules (node_modules, .venv, *.db)
├── README.md                       # Documentation & setup guide
│
├── frontend/                       # Next.js 16 + React 19 + Tailwind CSS
│   ├── package.json
│   ├── tsconfig.json
│   ├── next.config.ts
│   └── src/
│       ├── app/
│       │   ├── layout.tsx          # Root layout & typography
│       │   ├── page.tsx            # Main responsive dashboard
│       │   └── globals.css         # Theme tokens & glassmorphic styles
│       ├── components/
│       │   ├── layout/             # Navbar, Sidebar navigation
│       │   └── dashboard/          # StatsGrid, LectureCard, UploadModal, Q&A, Diagnostics
│       ├── lib/
│       │   ├── api.ts              # FastAPI client & latency instrumentation
│       │   └── utils.ts            # Formatting helpers
│       └── types/                  # TypeScript interfaces (Health, Lecture, Task)
│
└── backend/                        # Python + FastAPI + SQLite
    ├── requirements.txt            # FastAPI, Uvicorn, Pydantic, HTTPX
    ├── run.py                      # Development runner
    ├── .env.example
    └── app/
        ├── main.py                 # FastAPI application & CORS configuration
        ├── core/
        │   ├── config.py           # Application settings via Pydantic
        │   └── database.py         # SQLite connection & schema seeder
        ├── api/v1/
        │   ├── router.py           # v1 route aggregator
        │   └── endpoints/
        │       ├── health.py       # Health check (/api/v1/health)
        │       └── lectures.py     # Lecture ingestion & task toggle APIs
        └── schemas/
            ├── health.py           # Health response validation schema
            └── lecture.py          # Lecture & task validation schemas
```

---

## ⚡ Quickstart

### 1. Backend Setup (FastAPI)

```bash
cd backend

# Create & activate Python virtual environment
python3 -m venv .venv
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start backend server (runs on http://127.0.0.1:8000)
python3 run.py
```

FastAPI interactive documentation will be accessible at:
- **Interactive Swagger Docs**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- **Health Check Endpoint**: [http://127.0.0.1:8000/api/v1/health](http://127.0.0.1:8000/api/v1/health)

### 2. Frontend Setup (Next.js)

```bash
cd frontend

# Install dependencies
npm install

# Start Next.js development server (runs on http://localhost:3000)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🩺 System Health & Connectivity

The frontend features a live status indicator that pings the FastAPI `/api/v1/health` endpoint:
- Displays **live server latency** (in milliseconds)
- Verifies **SQLite database connectivity**
- Displays **uptime and system diagnostics**
- Provides interactive task toggling and lecture note ingestion
