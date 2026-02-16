import json
import logging
import os
import uuid
from pathlib import Path
from urllib import request

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.orm import Session

from .database import get_db
from .models import Complaint, User
from .nlp.vision import detect_issue_from_image
from .schemas import ComplaintCreate, ComplaintResponse, ComplaintStatusResponse, FeedbackRequest, IntakeResponse
from .state import get_ai_state

router = APIRouter(tags=["complaints"])
logger = logging.getLogger(__name__)
UPLOAD_DIR = Path(__file__).resolve().parents[1] / "data" / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


def _ensure_user_exists(db: Session, user_id: int, username: str | None = None) -> User:
    existing = db.query(User).filter(User.id == user_id).first()
    if existing:
        return existing

    candidate_name = (username or f"citizen_{user_id}").strip().replace(" ", "_")
    user = User(
        id=user_id,
        username=candidate_name,
        email=f"{candidate_name.lower()}@civicai.local",
        hashed_password="guest-user-no-login",
        role="citizen",
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def _notify_authority(payload: dict) -> tuple[bool, str | None]:
    webhook = os.getenv("AUTHORITY_WEBHOOK_URL", "").strip()
    if not webhook:
        return False, None

    req = request.Request(
        webhook,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with request.urlopen(req, timeout=8) as resp:  # nosec - configurable endpoint
            return True, f"HTTP-{resp.status}"
    except Exception as exc:
        logger.warning("Authority webhook failed: %s", exc)
        return False, None


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


@router.post("/complaint/intake", response_model=IntakeResponse)
def intake_complaint(
    name: str = Form(...),
    problem: str = Form(...),
    location: str | None = Form(None),
    latitude: float | None = Form(None),
    longitude: float | None = Form(None),
    user_id: int = Form(1),
    image: UploadFile | None = File(None),
    db: Session = Depends(get_db),
):
    try:
        user = _ensure_user_exists(db, user_id, username=name)

        ai_state = get_ai_state()
        inferred = ai_state.run_inference(problem)
        detected_issue = "text grievance"
        detected_department = inferred["department"]
        confidence = float(inferred["confidence"])

        if image is not None:
            image_bytes = image.file.read()
            if image_bytes:
                save_path = UPLOAD_DIR / f"{uuid.uuid4().hex}_{image.filename or 'evidence.jpg'}"
                save_path.write_bytes(image_bytes)
                vis_issue, vis_department, vis_conf = detect_issue_from_image(image_bytes)
                if vis_conf >= confidence:
                    detected_issue, detected_department, confidence = vis_issue, vis_department, vis_conf

        location_text = location or ""
        if latitude is not None and longitude is not None:
            coords = f"{latitude:.6f},{longitude:.6f}"
            location_text = f"{location_text} ({coords})".strip()

        ticket_id = f"CIV-{uuid.uuid4().hex[:10].upper()}"
        complaint = Complaint(
            ticket_id=ticket_id,
            user_id=user.id,
            text=f"{problem}\nDetected issue: {detected_issue}",
            department=detected_department,
            location=location_text or None,
            status="open",
            sla_hours=72,
            severity="high" if confidence >= 0.75 else "medium",
        )
        db.add(complaint)
        db.commit()

        authority_notified, authority_ref = _notify_authority(
            {
                "ticket_id": ticket_id,
                "citizen_name": name,
                "problem": problem,
                "department": detected_department,
                "location": location_text,
                "confidence": confidence,
            }
        )

        return IntakeResponse(
            ticket_id=ticket_id,
            detected_issue=detected_issue,
            detected_department=detected_department,
            confidence=round(confidence, 3),
            location=location_text or None,
            authority_notified=authority_notified,
            authority_reference=authority_ref,
        )
    except Exception as exc:
        db.rollback()
        logger.exception("Intake complaint failed")
        raise HTTPException(status_code=500, detail=f"Failed to process intake complaint: {exc}") from exc


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
