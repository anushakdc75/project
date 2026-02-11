import logging
import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .database import get_db
from .models import Complaint, User
from .schemas import ComplaintCreate, ComplaintResponse, ComplaintStatusResponse, FeedbackRequest
from .state import get_ai_state

router = APIRouter(tags=["complaints"])
logger = logging.getLogger(__name__)


def _ensure_user_exists(db: Session, user_id: int) -> None:
    if db.query(User).filter(User.id == user_id).first():
        return
    db.add(
        User(
            id=user_id,
            username=f"citizen_{user_id}",
            email=f"citizen_{user_id}@civicai.local",
            hashed_password="guest-user-no-login",
            role="citizen",
        )
    )
    db.commit()


@router.post("/complaint", response_model=ComplaintResponse)
def create_complaint(payload: ComplaintCreate, db: Session = Depends(get_db)):
    try:
        _ensure_user_exists(db, payload.user_id)
        ai_state = get_ai_state()
        response = ai_state.run_inference(payload.text)

        ticket_id = f"CIV-{uuid.uuid4().hex[:10].upper()}"
        complaint = Complaint(
            ticket_id=ticket_id,
            user_id=payload.user_id,
            text=payload.text,
            department=response["department"],
            location=payload.location,
            status="open",
            sla_hours=72,
            severity="medium",
        )
        db.add(complaint)
        db.commit()

        return ComplaintResponse(ticket_id=ticket_id, department=response["department"], status="open", sla_hours=72)
    except Exception as exc:
        db.rollback()
        logger.exception("Complaint creation failed for user_id=%s", payload.user_id)
        raise HTTPException(status_code=500, detail=f"Failed to create complaint: {exc}") from exc


@router.get("/status/{ticket_id}", response_model=ComplaintStatusResponse)
def status(ticket_id: str, db: Session = Depends(get_db)):
    row = db.query(Complaint).filter(Complaint.ticket_id == ticket_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Ticket not found")

    return ComplaintStatusResponse(
        ticket_id=row.ticket_id,
        status=row.status,
        department=row.department,
        sla_hours=row.sla_hours,
        created_at=row.created_at,
    )


@router.post("/feedback")
def feedback(payload: FeedbackRequest, db: Session = Depends(get_db)):
    from .models import Feedback

    db.add(Feedback(**payload.model_dump()))
    db.commit()
    return {"message": "Feedback received"}
