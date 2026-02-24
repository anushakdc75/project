import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter
from slowapi.util import get_remote_address
from sqlalchemy.orm import Session

from .analytics import router as analytics_router
from .auth import get_password_hash, router as auth_router
from .chat import router as chat_router
from .complaints import router as complaints_router
from .database import Base, SessionLocal, engine
from .models import User
from .state import get_ai_state

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
)
logger = logging.getLogger(__name__)

limiter = Limiter(key_func=get_remote_address)
app = FastAPI(title="CivicAI API", version="1.0.1", description="AI-powered grievance and policy intelligence platform")
app.state.limiter = limiter

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(chat_router)
app.include_router(complaints_router)
app.include_router(analytics_router)


@app.on_event("startup")
def startup():
    Base.metadata.create_all(bind=engine)
    ai_state = get_ai_state()
    logger.info("AI state ready with %s indexed grievances", len(ai_state.records))

    db: Session = SessionLocal()
    try:
        if not db.query(User).filter(User.username == "admin").first():
            db.add(User(username="admin", email="admin@civicai.local", hashed_password=get_password_hash("admin123"), role="admin"))
            db.commit()
    finally:
        db.close()


@app.get("/")
def health_check():
    return {"status": "ok", "service": "CivicAI"}
