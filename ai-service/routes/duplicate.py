from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Optional

from models.similarity_model import find_similar_problems

router = APIRouter()


class ExistingProblem(BaseModel):
    id: str
    text: str


class DuplicateRequest(BaseModel):
    problem: str
    existingProblems: List[ExistingProblem] = []


class MatchResult(BaseModel):
    id: str
    similarity: float


class DuplicateResponse(BaseModel):
    isDuplicate: bool
    similarity: float
    similarProblemId: Optional[str] = None
    matches: List[MatchResult] = []


@router.post("/duplicate", response_model=DuplicateResponse)
def duplicate(payload: DuplicateRequest):
    existing = [
        {"id": p.id, "text": p.text}
        for p in payload.existingProblems
    ]

    matches = find_similar_problems(
        payload.problem,
        existing
    )

    if not matches:
        return DuplicateResponse(
            isDuplicate=False,
            similarity=0.0,
            similarProblemId=None,
            matches=[]
        )

    best = matches[0]

    # The backend applies its own configurable DUPLICATE_THRESHOLD.
    # This service reports the similarity score it computed.
    return DuplicateResponse(
        isDuplicate=best["similarity"] >= 0.85,
        similarity=best["similarity"],
        similarProblemId=best["id"],
        matches=[MatchResult(**m) for m in matches]
    )
