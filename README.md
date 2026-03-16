# FinPilot AI — Local-First Predictive Personal Finance Copilot

A monorepo containing a **Next.js** frontend and **FastAPI** backend, backed by **MongoDB**.

## Architecture

```
finpilot/
├── frontend/      Next.js (App Router) + Tailwind + shadcn/ui
├── backend/       FastAPI + Pydantic v2 + MongoDB
├── docker-compose.yml   MongoDB + mongo-express
└── README.md
```

## Prerequisites

| Tool | Version |
|------|---------|
| Docker & Docker Compose | latest |
| Python | 3.11+ |
| Node.js | 18+ |
| npm | 9+ |

---

## 1. Start MongoDB

```bash
cd finpilot
docker compose up -d
```

- **MongoDB** → `localhost:27017`
- **mongo-express** (optional UI) → `http://localhost:8081`

---

## 2. Run the Backend

```bash
cd finpilot/backend

# Create and activate virtual environment
python -m venv .venv

# Windows
.venv\Scripts\activate
# macOS / Linux
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Copy env file and edit if needed
cp .env.example .env

# Start the server
uvicorn app.main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`.
Interactive docs at `http://localhost:8000/docs`.

### Backend environment variables (`backend/.env`)

| Variable | Default | Description |
|----------|---------|-------------|
| `MONGO_URI` | `mongodb://localhost:27017` | MongoDB connection string |
| `MONGO_DB` | `finpilot` | Database name |
| `JWT_SECRET` | `change_me` | Secret for signing JWTs |
| `JWT_EXPIRES_MIN` | `60` | Token expiry in minutes |
| `CORS_ORIGINS` | `http://localhost:3000` | Allowed CORS origins |

---

## 3. Run the Frontend

```bash
cd finpilot/frontend

npm install

# Copy env file and edit if needed
cp .env.example .env.local

npm run dev
```

Open `http://localhost:3000`.

### Frontend environment variables (`frontend/.env.local`)

| Variable | Default | Description |
|----------|---------|-------------|
| `NEXT_PUBLIC_MOCK` | `true` | Enable mock mode (no backend needed) |
| `NEXT_PUBLIC_API_BASE_URL` | `http://localhost:8000` | Backend API base URL |
| `NEXT_PUBLIC_APP_NAME` | `FinPilot AI` | App display name |

### Mock Mode

Set `NEXT_PUBLIC_MOCK=true` to run the frontend without the backend. All API calls return fixture data with simulated delays. This is useful for UI development and demos.

Set `NEXT_PUBLIC_MOCK=false` when you want the frontend to call the real backend.

---

## Quick Start (all three)

```bash
# Terminal 1 — MongoDB
cd finpilot && docker compose up -d

# Terminal 2 — Backend
cd finpilot/backend && python -m venv .venv && .venv\Scripts\activate && pip install -r requirements.txt && cp .env.example .env && uvicorn app.main:app --reload --port 8000

# Terminal 3 — Frontend
cd finpilot/frontend && npm install && cp .env.example .env.local && npm run dev
```

---

## Features

1. **Salary Slip OCR** — Upload, parse, verify salary documents
2. **Expenses & Goals** — Track spending and financial goals
3. **Forecasting** — 3/6/12 month cash-flow projections with risk months
4. **Scenario Planning** — Create and compare financial scenarios
5. **Investment Recommendations** — Bucket allocations (not product pushing)
6. **RAG Chatbot** — AI assistant with citations and audit trail
7. **Voice-to-Voice** — STT → RAG → LLM → TTS (HTTP fallback for MVP)
