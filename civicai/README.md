# CivicAI – Smart Grievance & Policy Intelligence Platform

Production-ready full-stack civic grievance platform with semantic retrieval, policy insights, and escalation workflows.

## Core AI Guarantees
- Uses `intfloat/e5-base-v2` for semantic embeddings.
- Uses FAISS (`IndexFlatIP`) for vector similarity retrieval.
- One-time corpus embedding/index generation persisted to disk.
- Real-time inference only during query handling.
- No TF-IDF, no keyword-only retrieval, no retraining per request.

## Architecture
- **Backend:** FastAPI + SQLAlchemy + JWT + FAISS + Transformers
- **Frontend:** React (Vite), Tailwind, Framer Motion (glassmorphism UI)
- **Storage:** SQLite by default (PostgreSQL-compatible via env)
- **Deployment:** Docker + docker-compose + `.env`

## Run Locally
### Backend
```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev -- --host 0.0.0.0 --port 5173
```

### Docker Compose
```bash
docker compose up --build
```

## API Endpoints
- `POST /auth/login`
- `POST /auth/register`
- `POST /chat`
- `POST /complaint`
- `GET /status/{ticket_id}`
- `GET /history/{user_id}`
- `POST /feedback`
- `GET /analytics`
- `GET /topics`
- `GET /alerts`

## AI/NLP Modules
- `app/nlp/embedder.py`: E5 embedding generation + language detection.
- `app/nlp/faiss_index.py`: one-time index build/load and search.
- `app/nlp/inference.py`: multilingual query handling + top-K retrieval + response composer.
- `app/nlp/topic_model.py`: embedding clustering for theme extraction.
- `app/nlp/sentiment.py`: sentiment trend signal.

## Escalation Flow
When chat receives `NOT SOLVED`:
1. Ticket is auto-generated.
2. Complaint escalates to escalation desk.
3. SLA set to 48 hours.
4. Ticket can be tracked via `/status/{ticket_id}`.

## Research-oriented Analytics
- Topic clusters from grievance embeddings.
- Sentiment distribution across complaints.
- Weekly emerging-issue alerts by location/department.
- Department-wise complaint load for policy prioritization.
