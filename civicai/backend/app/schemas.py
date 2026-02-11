from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, EmailStr, Field


class LoginRequest(BaseModel):
    username: str
    password: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str


class ChatRequest(BaseModel):
    user_id: int
    message: str


class SimilarCase(BaseModel):
    grievance_id: str
    department: str
    solution: str
    similarity: float


class AreaClusterItem(BaseModel):
    location: str
    complaint_count: int
    dominant_department: str


class EmergingAlertItem(BaseModel):
    location: str
    department: str
    complaint_count: int
    sentiment_spike: str
    severity: str


class ChatResponse(BaseModel):
    reply: str
    answer: str
    solution_steps: List[str]
    confidence: float
    department: str
    expected_resolution_time: str
    similar_cases: List[SimilarCase]
    escalation_note: Optional[str] = None
    is_live_authority_contact: bool = False


class ComplaintCreate(BaseModel):
    user_id: int
    text: str
    location: Optional[str] = None


class ComplaintResponse(BaseModel):
    ticket_id: str
    department: str
    status: str
    sla_hours: int


class ComplaintStatusResponse(BaseModel):
    ticket_id: str
    status: str
    department: str
    sla_hours: int
    created_at: datetime


class FeedbackRequest(BaseModel):
    user_id: int
    ticket_id: Optional[str] = None
    rating: int = Field(ge=1, le=5)
    comments: Optional[str] = None


class AnalyticsResponse(BaseModel):
    sla_summary: dict
    complaint_volume: dict
    area_clusters: List[AreaClusterItem]
    emerging_alerts: List[EmergingAlertItem]
    sentiment_distribution: dict


class TopicItem(BaseModel):
    topic_id: int
    size: int
    representative_text: str


class AlertItem(BaseModel):
    department: str
    location: str
    issue_count: int
    severity: str


class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str
