# CivicAI – Smart Grievance & Policy Intelligence Platform

Production-ready full-stack civic grievance platform with semantic retrieval, policy insights, and escalation workflows.

## Core AI Guarantees
- Uses `intfloat/e5-base-v2` for semantic embeddings.
- Uses FAISS (`IndexFlatIP`) for vector similarity retrieval.
- One-time corpus embedding/index generation persisted to disk (`backend/data/grievance.index`).
- Real-time inference only during query handling.
- No TF-IDF, no keyword-only retrieval, no retraining per request.

## Architecture
- **Backend:** FastAPI + SQLAlchemy + JWT + FAISS + Transformers
- **Frontend:** React (Vite), Tailwind, Framer Motion (glassmorphism UI)
- **Storage:** SQLite by default (PostgreSQL-compatible via env)
- **Deployment:** Docker + docker-compose + `.env`

## Run Locally (Fixed Flow)
> Run all commands from the `civicai` folder (the folder that contains `backend/` and `frontend/`).

### 1) Backend
```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Windows (PowerShell):
```powershell
cd backend
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Backend startup now does the following automatically:
1. Creates DB tables.
2. Loads persisted FAISS + metadata if dataset fingerprint matches.
3. Rebuilds FAISS index once only if dataset changed or cache is invalid.
4. Seeds default admin user (`admin` / `admin123`) if missing.

### 2) Frontend
```bash
cd frontend
npm install
npm run dev -- --host 0.0.0.0 --port 5173
```

### 3) Docker Compose
```bash
docker compose up --build
```

## API Contracts
### `POST /chat`
Returns semantic retrieval output with policy-ready structure:
```json
{
  "reply": "Best matched department: ...",
  "answer": "Best matched department: ...",
  "solution_steps": ["...", "...", "..."],
  "confidence": 0.87,
  "department": "BWSSB",
  "expected_resolution_time": "5 days",
  "similar_cases": [
    {
      "grievance_id": "123",
      "department": "BWSSB",
      "solution": "...",
      "similarity": 0.84
    }
  ]
}
```

### `GET /analytics`
Returns SLA, volume, area clusters, and emerging alert signals:
```json
{
  "sla_summary": {
    "total_complaints": 100,
    "open_cases": 70,
    "resolved_cases": 30,
    "sla_breaches": 12,
    "avg_sla_hours": 64.5,
    "source": "complaints"
  },
  "complaint_volume": {
    "total": 100,
    "by_department": {
      "Water": 35,
      "Roads": 21
    }
  },
  "area_clusters": [
    {
      "location": "Rajajinagar",
      "complaint_count": 18,
      "dominant_department": "Water Board"
    }
  ],
  "emerging_alerts": [
    {
      "location": "Rajajinagar",
      "department": "Water Board",
      "complaint_count": 7,
      "sentiment_spike": "high",
      "severity": "high"
    }
  ],
  "sentiment_distribution": {
    "positive": 10,
    "neutral": 22,
    "negative": 68
  }
}
```

## API Endpoints
- `POST /auth/login`
- `POST /auth/register`
- `POST /chat`
- `POST /complaint`
- `POST /complaint/intake` (guided intake with live location + optional image classification)
- `GET /status/{ticket_id}`
- `GET /history/{user_id}`
- `POST /feedback`
- `GET /analytics`
- `GET /topics`
- `GET /alerts`

## AI/NLP Modules
- `app/nlp/embedder.py`: E5 embedding generation + language detection.
- `app/nlp/faiss_index.py`: one-time index build/load with dataset fingerprinting and FAISS persistence.
- `app/nlp/inference.py`: multilingual query handling + top-K retrieval + response composer.
- `app/nlp/topic_model.py`: embedding clustering for theme extraction.
- `app/nlp/sentiment.py`: sentiment trend signal.

## Escalation Flow
When chat receives `NOT SOLVED`:
1. Ticket is auto-generated.
2. Complaint escalates to escalation desk.
3. SLA set to 48 hours.
4. Ticket can be tracked via `/status/{ticket_id}`.

## Troubleshooting
- If `/chat` fails, check backend logs for model download/runtime errors and ensure internet access for first-time HuggingFace model fetch.
- If analytics appears sparse for a fresh DB, dashboard bootstraps from indexed dataset until real complaints accumulate.
- If you are on Windows, do **not** use `/workspace/...` paths (that path exists only inside this coding container). Use your local project path. Example syntax check command from project root:

```powershell
python -m compileall .\backend\app
```


## Live Authority Relay (Optional)
Set `AUTHORITY_WEBHOOK_URL` in backend environment to forward new guided complaints to your real authority integration endpoint (for example, a government CRM bridge). If not set, complaints are still tracked internally and marked as not notified.
