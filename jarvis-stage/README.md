# 10X Command Center — `jarvis-stage`

Day 1 scaffold: **Next.js 15 frontend** + **FastAPI backend** with **Claude Sonnet 4.5** streaming over **SSE**.

## Prerequisites

- Node 20+ and npm
- Python 3.11+
- Anthropic API key

## Setup

### Backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env — set ANTHROPIC_API_KEY
uvicorn main:app --reload --port 8000
```

Health check: `curl http://127.0.0.1:8000/api/health`

### Frontend

```bash
cd frontend
npm install
cp .env.example .env.local   # optional; defaults to http://localhost:8000
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Send **“Say hello in pirate voice”** and confirm tokens stream in.

## Day 1 test

1. Backend running on port **8000**
2. Frontend on port **3000**
3. In the UI, submit the pirate prompt — you should see incremental text without waiting for the full completion.

## Project rules

Copy `cursor-package/.cursorrules` into this folder as **`.cursorrules`** (already mirrored at repo root when you sync from the package). Cursor loads it for stack lock and stage rules.

## Security note

`next@15.3.4` was installed by the Day 1 template. Before production, run `npm audit` / upgrade to a **patched** Next 15 release per [Next.js security advisories](https://nextjs.org/blog).

## Next (Day 2+)

Follow `cursor-package/DAILY_PROMPTS.md` — LangGraph supervisor, `/api/run`, CopilotKit, then visuals.
