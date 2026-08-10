from pydantic import BaseModel, EmailStr
from typing import List


class UserRegister(BaseModel):
    full_name: str
    email: EmailStr
    password: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str

# what needed to analyse a cv
class JobAnalysisRequest(BaseModel):
    user_id: int
    cv_text: str
    job_title: str
    job_description: str

# results returned to the user
class JobAnalysisResponse(BaseModel):
    matched_skills: List[str]
    missing_skills: List[str]
    match_score: float
    recommendation: str
    roadmap: List[str]




