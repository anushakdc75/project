import uuid
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .database import get_db
from .models import ChatHistory, Complaint
from .schemas import ChatRequest, ChatResponse
from .state import get_ai_state

router = APIRouter(tags=["chat"])


@router.post("/chat", response_model=ChatResponse)
def chat(payload: ChatRequest, db: Session = Depends(get_db)):
    ai_state = get_ai_state()
    msg = payload.message.strip()

    if msg.upper() == "NOT SOLVED":
        ticket_id = f"CIV-{uuid.uuid4().hex[:10].upper()}"
        complaint = Complaint(
            ticket_id=ticket_id,
            user_id=payload.user_id,
            text="Auto-escalated from chat",
            department="Escalation Desk",
            status="escalated",
            sla_hours=48,
            severity="high",
        )
        db.add(complaint)
        db.commit()
        response = {
            "answer": f"Issue escalated. Ticket ID: {ticket_id}. SLA: 48 hours.",
            "confidence": 0.99,
            "department": "Escalation Desk",
            "expected_resolution_time": "48 hours",
            "similar_cases": [],
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
