from fastapi import APIRouter
from pydantic import BaseModel
import os

from models.sector_classifier import classify_sector

router = APIRouter()


class ClassifyRequest(BaseModel):
    text: str


class ClassifyResponse(BaseModel):
    sector: str
    subsector: str | None = None
    confidence: float


@router.post("/classify", response_model=ClassifyResponse)
def classify(payload: ClassifyRequest):
    threshold = float(os.getenv("LOW_CONFIDENCE_THRESHOLD", "0.35"))
    sector, subsector, confidence = classify_sector(payload.text, threshold)
    return ClassifyResponse(
        sector=sector,
        subsector=subsector,
        confidence=confidence
    )
