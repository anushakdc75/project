import logging
import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .database import get_db
from .models import ChatHistory, Complaint, User
from .schemas import ChatRequest, ChatResponse
from .state import get_ai_state

router = APIRouter(tags=["chat"])
logger = logging.getLogger(__name__)

_GREETINGS = {
    "hi",
    "hello",
    "hey",
    "good morning",
    "good afternoon",
    "good evening",
}


def _ensure_user_exists(db: Session, user_id: int) -> None:
    existing = db.query(User).filter(User.id == user_id).first()
    if existing:
        return

    fallback_user = User(
        id=user_id,
        username=f"citizen_{user_id}",
        email=f"citizen_{user_id}@civicai.local",
        hashed_password="guest-user-no-login",
        role="citizen",
    )
    db.add(fallback_user)
    db.commit()


def _small_talk_response(message: str):
    msg = message.strip().lower()
    if msg in _GREETINGS:
        return {
            "reply": (
                "Hi 👋 I can help with civic issues like water, roads, garbage, drainage, streetlights, and "
                "department routing. Tell me your issue with area details and I will guide you step by step."
            ),
            "answer": (
                "Hi 👋 I can help with civic issues like water, roads, garbage, drainage, streetlights, and "
                "department routing. Tell me your issue with area details and I will guide you step by step."
            ),
            "solution_steps": [
                "Share your grievance in one line (example: 'No water supply in Rajajinagar since morning').",
                "Include location, landmark, and since when the issue exists.",
                "If not resolved, type NOT SOLVED and I will escalate with a ticket.",
            ],
            "confidence": 0.98,
            "department": "CivicAI Assistant",
            "expected_resolution_time": "Instant guidance",
            "similar_cases": [],
            "escalation_note": "No escalation created for greeting.",
            "is_live_authority_contact": False,
        }

    general_terms = ["joke", "poem", "song", "movie", "cricket", "weather", "bitcoin", "stocks"]
    if any(term in msg for term in general_terms):
        return {
            "reply": (
                "I’m primarily a civic-grievance assistant, so I may not be accurate for this topic. "
                "I can best help with public service issues (water, roads, garbage, sanitation, streetlights, "
                "drainage, civic offices) and escalation workflows."
            ),
            "answer": (
                "I’m primarily a civic-grievance assistant, so I may not be accurate for this topic. "
                "I can best help with public service issues (water, roads, garbage, sanitation, streetlights, "
                "drainage, civic offices) and escalation workflows."
            ),
            "solution_steps": [
                "Share a civic issue and area name.",
                "I will identify the likely department and next action steps.",
                "If unresolved, type NOT SOLVED for escalation guidance.",
            ],
            "confidence": 0.72,
            "department": "CivicAI Assistant",
            "expected_resolution_time": "Instant guidance",
            "similar_cases": [],
            "escalation_note": "No escalation created. Query is outside civic scope.",
            "is_live_authority_contact": False,
        }

    return None


@router.post("/chat", response_model=ChatResponse)
def chat(payload: ChatRequest, db: Session = Depends(get_db)):
    ai_state = get_ai_state()
    msg = payload.message.strip()
    if not msg:
        raise HTTPException(status_code=400, detail="Message must not be empty")

    try:
        _ensure_user_exists(db, payload.user_id)

        small_talk = _small_talk_response(msg)
        if small_talk is not None:
            response = small_talk
        elif msg.upper() == "NOT SOLVED":
            ticket_id = f"CIV-{uuid.uuid4().hex[:10].upper()}"
            complaint = Complaint(
                ticket_id=ticket_id,
                user_id=payload.user_id,
                text="Auto-escalated from chat",
                department="BBMP Escalation Desk",
                status="escalated",
                sla_hours=48,
                severity="high",
            )
            db.add(complaint)
            db.commit()
            response = {
                "reply": (
                    f"Your issue is escalated to BBMP Escalation Desk. Ticket ID: {ticket_id}. "
                    "Current SLA: 48 hours. You can track progress from the Tracker page."
                ),
                "answer": (
                    f"Your issue is escalated to BBMP Escalation Desk. Ticket ID: {ticket_id}. "
                    "Current SLA: 48 hours. You can track progress from the Tracker page."
                ),
                "solution_steps": [
                    "Status updated to ESCALATED and queued for authority review.",
                    "The escalation desk assigns the case to the relevant line department.",
                    "Track this ticket in Status Tracker; add proofs when requested.",
                ],
                "confidence": 0.99,
                "department": "BBMP Escalation Desk",
                "expected_resolution_time": "48 hours",
                "similar_cases": [],
                "escalation_note": (
                    "This environment creates and tracks escalation tickets inside CivicAI. "
                    "Live authority outreach requires production integration with official systems."
                ),
                "is_live_authority_contact": False,
            }
        else:
            response = ai_state.run_inference(msg)

        chat_row = ChatHistory(
            user_id=payload.user_id,
            query=payload.message,
            response=response["answer"],
            confidence=response["confidence"],
        )
        db.add(chat_row)
        db.commit()
        return response
    except HTTPException:
        raise
    except Exception as exc:
        db.rollback()
        logger.exception("Chat request failed for user_id=%s", payload.user_id)
        raise HTTPException(status_code=500, detail=f"Failed to process chat request: {exc}") from exc


@router.get("/history/{user_id}")
def history(user_id: int, db: Session = Depends(get_db)):
    rows = db.query(ChatHistory).filter(ChatHistory.user_id == user_id).order_by(ChatHistory.created_at.desc()).all()
    return [
        {
            "query": row.query,
            "response": row.response,
            "confidence": row.confidence,
            "created_at": row.created_at,
        }
        for row in rows
    ]
